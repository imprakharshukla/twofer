import type { OpencodeClient } from "./client.js";
import type { BroadcastFn } from "../server/ws.js";

export type EventType =
  | "message.part.updated"
  | "session.idle"
  | "session.error"
  | "message.updated";

export interface AgentEvent {
  type: EventType;
  sessionId: string;
  agent: string;
  data: unknown;
}

/**
 * Start a background event subscription that forwards streaming events to the
 * WebSocket. This runs indefinitely and should be started once before any prompts.
 * Returns an AbortController to stop the subscription.
 */
export function startEventForwarder(
  client: OpencodeClient,
  sessionMap: Map<string, string>,
  broadcast: BroadcastFn,
): { stop: () => void } {
  let stopped = false;

  const run = async () => {
    try {
      const { stream } = await client.event.subscribe();
      let eventCount = 0;
      // Track assistant message IDs so we only forward assistant content
      const assistantMessageIds = new Set<string>();

      for await (const event of stream) {
        if (stopped) break;
        eventCount++;

        const type = event.type as string;
        const props = event.properties as Record<string, unknown>;

        // Debug: log first few events and all unique types
        if (process.env.TWOFER_DEBUG && eventCount <= 5) {
          console.log(`  [event #${eventCount}] type=${type} keys=${Object.keys(props).join(",")}`);
          console.log(`    props=${JSON.stringify(props).slice(0, 300)}`);
        }

        // Track assistant messages so we can filter parts
        if (type === "message.updated") {
          const info = props.info as Record<string, unknown> | undefined;
          if (info?.role === "assistant" && typeof info.id === "string") {
            assistantMessageIds.add(info.id);
          }
        }

        if (type === "message.part.updated") {
          const sessionId = extractSessionId(props);
          const part = (props.part ?? props) as Record<string, unknown>;

          if (process.env.TWOFER_DEBUG && eventCount <= 20) {
            console.log(`  [stream] sessionId=${sessionId} mapped=${sessionMap.has(sessionId ?? "")} part.type=${part.type ?? "N/A"}`);
          }

          if (!sessionId || !sessionMap.has(sessionId)) continue;

          // Only forward parts from assistant messages (not user prompts)
          const messageId = part.messageID as string | undefined;
          if (messageId && !assistantMessageIds.has(messageId)) continue;

          // Only forward text and reasoning parts (skip step-start, tool-call, etc.)
          const partType = part.type as string;
          if (partType !== "text" && partType !== "reasoning") continue;

          const agent = sessionMap.get(sessionId)!;

          // Build the streaming payload the UI expects
          const streamData: Record<string, unknown> = { type: partType };
          if (partType === "text" && typeof part.text === "string") {
            streamData.text = part.text;
          } else if (partType === "reasoning" && typeof part.reasoning === "string") {
            streamData.reasoning = part.reasoning;
          } else {
            continue; // no actual content
          }

          const agentEvent: AgentEvent = {
            type: "message.part.updated",
            sessionId,
            agent,
            data: streamData,
          };
          broadcast({ type: "agent_stream", payload: agentEvent });
        }
      }

      if (process.env.TWOFER_DEBUG) {
        console.log(`  [event forwarder] stream ended after ${eventCount} events`);
      }
    } catch (e) {
      if (!stopped) {
        console.error("Event stream error:", e);
      }
    }
  };

  run();

  return {
    stop: () => {
      stopped = true;
    },
  };
}

function extractSessionId(props: Record<string, unknown>): string | undefined {
  // The SDK puts sessionID inside props.part for message.part.updated events
  if (props.part && typeof props.part === "object") {
    const part = props.part as Record<string, unknown>;
    if (typeof part.sessionID === "string") return part.sessionID;
    if (typeof part.session_id === "string") return part.session_id;
  }
  // Fallback: check props.info (for message.updated events)
  if (props.info && typeof props.info === "object") {
    const info = props.info as Record<string, unknown>;
    if (typeof info.sessionID === "string") return info.sessionID;
    if (typeof info.session_id === "string") return info.session_id;
  }
  // Fallback: top-level
  if (typeof props.sessionID === "string") return props.sessionID;
  if (typeof props.session_id === "string") return props.session_id;
  if (typeof props.sessionId === "string") return props.sessionId;
  return undefined;
}
