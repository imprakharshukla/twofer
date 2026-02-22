import { WebSocketServer, WebSocket } from "ws";

export type BroadcastFn = (message: WsMessage) => void;

export interface WsMessage {
  type:
    | "agent_stream"
    | "agent_error"
    | "round_complete"
    | "debate_complete"
    | "status"
    | "error"
    | "export";
  payload: unknown;
}

export interface WsServer {
  broadcast: BroadcastFn;
  onMessage: (handler: (data: WsMessage) => void) => void;
  close: () => void;
  wss: WebSocketServer;
}

export function createWsServer(): WsServer {
  const wss = new WebSocketServer({ noServer: true });
  const handlers: Array<(data: WsMessage) => void> = [];

  // Cache last message of each type for replay on new connections
  const stateCache = new Map<string, string>();

  wss.on("connection", (ws) => {
    // Replay cached state to new client
    for (const [, serialized] of stateCache) {
      ws.send(serialized);
    }

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString()) as WsMessage;
        handlers.forEach((h) => h(data));
      } catch {
        // ignore malformed messages
      }
    });
  });

  const broadcast: BroadcastFn = (message) => {
    const serialized = JSON.stringify(message);

    // Cache state messages (not agent_stream — those are ephemeral)
    if (message.type !== "agent_stream") {
      stateCache.set(message.type, serialized);
    }

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    });
  };

  return {
    broadcast,
    onMessage: (handler) => handlers.push(handler),
    close: () => wss.close(),
    wss,
  };
}
