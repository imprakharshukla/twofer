"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AgentStreamPayload {
  type: "message.part.updated";
  sessionId: string;
  agent: string;
  data: {
    type: string;
    text?: string;
    reasoning?: string;
  };
}

export interface ConsensusSection {
  title: string;
  agreed: boolean;
  agentContents: Record<string, string>;
  finalContent: string;
}

interface ConvergenceState {
  consecutiveApprovals: number;
  round: number;
  maxRounds: number;
  converged: boolean;
  reason?: string;
}

interface AgentResponse {
  sections: Array<{
    title: string;
    content: string;
    verdict: string;
    reasoning: string;
  }>;
  overall_verdict: string;
  change_requests: string[];
  summary: string;
}

interface RoundCompletePayload {
  round: number;
  consensus: ConsensusSection[];
  convergence: ConvergenceState;
  agents: Record<string, AgentResponse>;
}

interface StatusPayload {
  round: number;
  maxRounds: number;
  status: string;
  agents?: string[];
}

export interface AgentState {
  text: string;
  thinking: string;
  streaming: boolean;
  response: AgentResponse | null;
}

export interface DebateState {
  connected: boolean;
  status: string;
  round: number;
  maxRounds: number;
  agentNames: string[];
  agents: Record<string, AgentState>;
  consensus: ConsensusSection[];
  convergence: ConvergenceState | null;
  rounds: RoundCompletePayload[];
  completed: boolean;
}

const INITIAL_STATE: DebateState = {
  connected: false,
  status: "connecting",
  round: 0,
  maxRounds: 10,
  agentNames: [],
  agents: {},
  consensus: [],
  convergence: null,
  rounds: [],
  completed: false,
};

function getOrCreateAgent(agents: Record<string, AgentState>, name: string): AgentState {
  return agents[name] ?? { text: "", thinking: "", streaming: false, response: null };
}

export function useDebateStream() {
  const [state, setState] = useState<DebateState>(INITIAL_STATE);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true, status: "waiting" }));
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, connected: false, status: "disconnected" }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "agent_stream": {
            const payload = msg.payload as AgentStreamPayload;
            const agentName = payload.agent;
            const part = payload.data;

            setState((s) => {
              const agent = getOrCreateAgent(s.agents, agentName);
              const names = s.agentNames.includes(agentName)
                ? s.agentNames
                : [...s.agentNames, agentName];

              if (part.type === "streaming_start") {
                return {
                  ...s,
                  agentNames: names,
                  agents: {
                    ...s.agents,
                    [agentName]: { ...agent, text: "", thinking: "", streaming: true },
                  },
                };
              }

              const updated = { ...agent };
              // SDK sends full accumulated text on each update (not deltas)
              if (part.type === "text" && part.text) {
                updated.text = part.text;
                updated.streaming = true;
              }
              if (part.type === "reasoning" && part.reasoning) {
                updated.thinking = part.reasoning;
              }

              return {
                ...s,
                agentNames: names,
                agents: { ...s.agents, [agentName]: updated },
              };
            });
            break;
          }

          case "round_complete": {
            const payload = msg.payload as RoundCompletePayload;
            setState((s) => {
              const newAgents = { ...s.agents };
              for (const [name, resp] of Object.entries(payload.agents)) {
                const existing = getOrCreateAgent(newAgents, name);
                newAgents[name] = {
                  ...existing,
                  text: resp.summary,
                  thinking: "",
                  streaming: false,
                  response: resp,
                };
              }
              const names = Object.keys(payload.agents);
              return {
                ...s,
                round: payload.round,
                consensus: payload.consensus,
                convergence: payload.convergence,
                agents: newAgents,
                agentNames: names.length > 0 ? names : s.agentNames,
                rounds: [...s.rounds, payload],
              };
            });
            break;
          }

          case "debate_complete": {
            const payload = msg.payload as RoundCompletePayload;
            setState((s) => {
              const newAgents = { ...s.agents };
              for (const [name, resp] of Object.entries(payload.agents)) {
                const existing = getOrCreateAgent(newAgents, name);
                newAgents[name] = {
                  ...existing,
                  text: resp.summary,
                  thinking: "",
                  streaming: false,
                  response: resp,
                };
              }
              return {
                ...s,
                consensus: payload.consensus,
                convergence: payload.convergence,
                agents: newAgents,
                completed: true,
                status: "complete",
              };
            });
            break;
          }

          case "status": {
            const payload = msg.payload as StatusPayload;
            setState((s) => {
              const names = payload.agents ?? s.agentNames;
              const newAgents = { ...s.agents };
              // Initialize agent state for newly registered agents so UI shows them as waiting
              for (const name of names) {
                if (!newAgents[name]) {
                  newAgents[name] = { text: "", thinking: "", streaming: true, response: null };
                }
              }
              return {
                ...s,
                round: payload.round,
                maxRounds: payload.maxRounds,
                status: payload.status,
                agentNames: names,
                agents: newAgents,
              };
            });
            break;
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return { state, sendMessage };
}
