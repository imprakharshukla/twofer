import { createOpencode } from "@opencode-ai/sdk";
import { execSync } from "node:child_process";

export type OpencodeInstance = Awaited<ReturnType<typeof createOpencode>>;
export type OpencodeClient = OpencodeInstance["client"];

let instance: OpencodeInstance | null = null;

const OPENCODE_PORT = 4096;

/**
 * Kill any stale OpenCode server on the default port.
 */
function killStaleServer(): void {
  try {
    const pids = execSync(`lsof -ti:${OPENCODE_PORT} 2>/dev/null`, { encoding: "utf-8" }).trim();
    if (pids) {
      for (const pid of pids.split("\n")) {
        try {
          process.kill(parseInt(pid, 10), "SIGTERM");
        } catch {
          // already dead
        }
      }
      // Brief wait for port to free up
      execSync("sleep 1");
    }
  } catch {
    // No process on port — good
  }
}

export async function getOpencode(): Promise<OpencodeInstance> {
  if (!instance) {
    try {
      instance = await createOpencode();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("port") || msg.includes("EADDRINUSE") || msg.includes("Failed to start server")) {
        // Stale server — kill it and retry
        killStaleServer();
        instance = await createOpencode();
      } else {
        throw e;
      }
    }
  }
  return instance;
}

export async function getClient(): Promise<OpencodeClient> {
  const { client } = await getOpencode();
  return client;
}

/** Read-only tools agents can use to explore the codebase */
const EXPLORATION_TOOLS = ["read", "glob", "grep", "codesearch"];

/** Permission rules that auto-allow read-only exploration tools */
const EXPLORATION_PERMISSIONS = EXPLORATION_TOOLS.map((tool) => ({
  permission: tool,
  pattern: "*",
  action: "allow" as const,
}));

export async function createAgentSession(
  client: OpencodeClient,
  title: string,
  options?: { directory?: string; enableTools?: boolean },
) {
  const { data: session } = await client.session.create({
    body: {
      title,
      ...(options?.enableTools ? { permission: EXPLORATION_PERMISSIONS } : {}),
    },
    ...(options?.directory ? { query: { directory: options.directory } } : {}),
  });
  if (!session) throw new Error("Failed to create session");
  return session;
}

/**
 * Send a prompt and poll until the session is idle, then extract the response.
 */
export async function sendPromptAndWait(
  client: OpencodeClient,
  sessionId: string,
  model: { providerID: string; modelID: string },
  systemPrompt: string,
  text: string,
  options?: { enableTools?: boolean },
): Promise<string> {
  // Get current message count before sending
  const beforeMsgs = await getSessionMessages(client, sessionId);
  const beforeCount = beforeMsgs.length;

  // Build tools map: enable read-only tools for exploration
  const tools = options?.enableTools
    ? Object.fromEntries(EXPLORATION_TOOLS.map((t) => [t, true]))
    : undefined;

  // Fire the prompt (returns immediately)
  await client.session.promptAsync({
    path: { id: sessionId },
    body: {
      model,
      system: systemPrompt,
      parts: [{ type: "text", text }],
      ...(tools ? { tools } : {}),
    },
  });

  // Wait for session to become busy first, then wait for it to finish
  const timeout = 600_000; // 10 min
  const start = Date.now();
  const pollInterval = 2000; // 2s
  let sawBusy = false;

  // Initial delay to let the server register the prompt
  await sleep(1000);

  while (Date.now() - start < timeout) {
    const { data: statusMap } = await client.session.status();
    if (statusMap) {
      const sessionStatus = (statusMap as Record<string, unknown>)[sessionId] as
        | { type?: string; active?: boolean }
        | undefined;

      const isBusy = sessionStatus?.type === "busy" || sessionStatus?.active === true;

      if (isBusy) {
        sawBusy = true;
      } else if (sawBusy) {
        // Was busy, now idle — done
        break;
      }
    }

    // If we've been polling for >10s without ever seeing busy, check messages directly
    if (!sawBusy && Date.now() - start > 10_000) {
      const msgs = await getSessionMessages(client, sessionId);
      const hasReady = msgs.some((m: { info: { role: string }; parts?: Array<Record<string, unknown>> }) => {
        if (m.info.role !== "assistant") return false;
        const parts = m.parts ?? [];
        return parts.some((p) => p.type === "text" && typeof p.text === "string" && (p.text as string).length > 0);
      });
      if (hasReady) break;
    }

    await sleep(pollInterval);
  }

  if (Date.now() - start >= timeout) {
    throw new Error(`Timeout waiting for session ${sessionId}`);
  }

  // Fetch messages and find the new assistant response — retry if assistant message has no parts yet
  let afterMsgs = await getSessionMessages(client, sessionId);

  for (let retry = 0; retry < 3; retry++) {
    const lastAssistant = [...afterMsgs].reverse().find(
      (m: Record<string, unknown>) => (m.info as Record<string, unknown>)?.role === "assistant",
    ) as Record<string, unknown> | undefined;
    const parts = (lastAssistant?.parts ?? []) as Array<Record<string, unknown>>;
    if (parts.some((p) => p.type === "text" && typeof p.text === "string" && (p.text as string).length > 0)) {
      break;
    }
    await sleep(2000);
    afterMsgs = await getSessionMessages(client, sessionId);
  }

  // Find the last assistant message with text content
  for (let i = afterMsgs.length - 1; i >= 0; i--) {
    const msg = afterMsgs[i] as Record<string, unknown>;
    const info = msg.info as Record<string, unknown> | undefined;
    const role = info?.role ?? msg.role;
    if (role === "assistant") {
      const parts = (msg.parts ?? []) as Array<Record<string, unknown>>;

      // Try explicit text parts first
      const textParts = parts.filter((p) => p.type === "text");
      if (textParts.length > 0) {
        const last = textParts[textParts.length - 1];
        if (typeof last.text === "string" && last.text.length > 0) {
          return last.text;
        }
      }

      // Fallback: any part with a text field
      for (const p of parts) {
        if (typeof p.text === "string" && p.text.length > 0) {
          return p.text;
        }
      }

      // Fallback: check content field (some providers use this)
      if (typeof info?.content === "string" && (info.content as string).length > 0) {
        return info.content as string;
      }
      if (typeof msg.content === "string" && (msg.content as string).length > 0) {
        return msg.content as string;
      }

      // This assistant message had no text (e.g. error/step-start only) — keep searching
    }
  }

  // Dump message structure for debugging
  console.error(`\n[debug] No assistant response found in session ${sessionId}`);
  console.error(`[debug] Messages (${afterMsgs.length}):`);
  for (let i = 0; i < afterMsgs.length; i++) {
    const msg = afterMsgs[i] as Record<string, unknown>;
    const info = msg.info as Record<string, unknown> | undefined;
    const role = info?.role ?? msg.role ?? "unknown";
    const parts = (msg.parts ?? []) as Array<Record<string, unknown>>;
    console.error(`[debug]   msg[${i}] role=${role} parts=${parts.length} keys=${Object.keys(msg).join(",")}`);
    if (info) console.error(`[debug]     info keys: ${Object.keys(info).join(",")}`);
    for (let j = 0; j < Math.min(parts.length, 3); j++) {
      const p = parts[j];
      console.error(`[debug]     part[${j}] type=${p.type} keys=${Object.keys(p).join(",")}`);
      if (typeof p.text === "string") console.error(`[debug]       text: ${(p.text as string).slice(0, 100)}`);
    }
    if (parts.length > 3) console.error(`[debug]     ... +${parts.length - 3} more parts`);
  }

  throw new Error(`No assistant response found in session ${sessionId} (had ${beforeCount} msgs, now ${afterMsgs.length})`);
}

export async function getSessionMessages(
  client: OpencodeClient,
  sessionId: string,
) {
  const { data: messages } = await client.session.messages({
    path: { id: sessionId },
  });
  return messages ?? [];
}

export async function listProviders(client: OpencodeClient) {
  const { data } = await client.provider.list();
  return data;
}

export async function shutdown() {
  if (instance) {
    instance.server.close();
    instance = null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
