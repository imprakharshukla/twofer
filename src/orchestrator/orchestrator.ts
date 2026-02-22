import chalk from "chalk";
import type { OpencodeClient } from "../opencode/client.js";
import {
  createAgentSession,
  sendPromptAndWait,
} from "../opencode/client.js";
import { startEventForwarder } from "../opencode/events.js";
import { parseAgentResponse, type AgentResponse } from "./schema.js";
import {
  systemPromptRound1,
  systemPromptRoundN,
  buildUserPromptRound1,
  buildUserPromptRoundN,
} from "./prompts.js";
import {
  createConvergenceState,
  checkConvergence,
  buildConsensus,
  type ConvergenceState,
  type ConsensusSection,
} from "./convergence.js";
import type { BroadcastFn } from "../server/ws.js";
import type { AgentConfig } from "../cli/config.js";

export interface DebateConfig {
  prompt: string;
  maxRounds: number;
  stack?: string;
  agents: AgentConfig[];
  codebaseContext?: string;
  projectDir?: string;
}

export interface DebateResult {
  rounds: RoundResult[];
  consensus: ConsensusSection[];
  convergenceState: ConvergenceState;
  agentResponses: Record<string, AgentResponse>;
  projectTitle: string;
}

export interface RoundResult {
  round: number;
  responses: Record<string, AgentResponse>;
  consensus: ConsensusSection[];
}

const MAX_PARSE_RETRIES = 2;

async function promptAndParse(
  client: OpencodeClient,
  sessionId: string,
  model: { providerID: string; modelID: string },
  systemPrompt: string,
  userPrompt: string,
  agentLabel: string,
  options?: { enableTools?: boolean },
): Promise<AgentResponse> {
  for (let attempt = 0; attempt <= MAX_PARSE_RETRIES; attempt++) {
    const promptText =
      attempt === 0
        ? userPrompt
        : "Your previous response was not valid JSON. Please respond with ONLY valid JSON matching the schema. No markdown fences, no explanation.";

    console.log(chalk.dim(`  ${agentLabel}: sending prompt${attempt > 0 ? ` (retry ${attempt})` : ""}...`));

    const raw = await sendPromptAndWait(client, sessionId, model, systemPrompt, promptText, { enableTools: attempt === 0 && options?.enableTools });

    if (process.env.TWOFER_DEBUG) {
      console.log(chalk.dim(`  ${agentLabel}: raw response (${raw.length} chars):`));
      console.log(chalk.dim(`  ${raw.slice(0, 300)}${raw.length > 300 ? "..." : ""}`));
    }

    const result = parseAgentResponse(raw);

    if (result.success) {
      console.log(chalk.dim(`  ${agentLabel}: response parsed OK (${result.data.sections.length} sections, verdict: ${result.data.overall_verdict})`));
      return result.data;
    }

    if (attempt < MAX_PARSE_RETRIES) {
      console.log(chalk.yellow(`  ${agentLabel}: parse failed — ${result.error}`));
      if (process.env.TWOFER_DEBUG) {
        console.log(chalk.dim(`  ${agentLabel}: raw start: ${raw.slice(0, 200)}`));
      }
    } else {
      throw new Error(`${agentLabel}: failed to parse after ${MAX_PARSE_RETRIES + 1} attempts: ${result.error}`);
    }
  }

  throw new Error("Unreachable");
}

/**
 * Run all agents in parallel, collecting successes and logging failures.
 * Returns only the agents that succeeded.
 */
async function runAgentsSettled(
  agentSessions: Array<{ config: AgentConfig; sessionId: string }>,
  fn: (as: { config: AgentConfig; sessionId: string }) => Promise<AgentResponse>,
  broadcast: BroadcastFn,
): Promise<Record<string, AgentResponse>> {
  const results = await Promise.allSettled(agentSessions.map(fn));
  const responses: Record<string, AgentResponse> = {};

  for (let i = 0; i < agentSessions.length; i++) {
    const r = results[i];
    const name = agentSessions[i].config.name;
    if (r.status === "fulfilled") {
      responses[name] = r.value;
    } else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.log(chalk.red(`  ${name}: FAILED — ${msg}`));
      broadcast({
        type: "agent_error",
        payload: { agent: name, error: msg },
      });
    }
  }

  return responses;
}

export async function runDebate(
  client: OpencodeClient,
  config: DebateConfig,
  broadcast: BroadcastFn,
): Promise<DebateResult> {
  const hasProject = !!config.projectDir;

  // Create a session for each agent
  const agentSessions: Array<{
    config: AgentConfig;
    sessionId: string;
  }> = [];

  const sessionMap = new Map<string, string>(); // sessionId -> agentName

  for (const agent of config.agents) {
    const session = await createAgentSession(client, `twofer-${agent.name}`, {
      directory: config.projectDir,
      enableTools: hasProject,
    });
    agentSessions.push({ config: agent, sessionId: session.id });
    sessionMap.set(session.id, agent.name);
  }

  // Start background event forwarder for UI streaming
  // Convert sessionMap to the format the forwarder expects (sessionId -> agentKey)
  const forwarderMap = new Map<string, string>();
  for (const [sid, name] of sessionMap) {
    forwarderMap.set(sid, name);
  }
  const eventForwarder = startEventForwarder(client, forwarderMap, broadcast);

  let convergence = createConvergenceState(config.maxRounds);
  const rounds: RoundResult[] = [];
  let agentResponses: Record<string, AgentResponse> = {};

  try {
    while (!convergence.converged) {
      const round = convergence.round + 1;
      console.log(chalk.bold(`\n--- Round ${round} ---`) + chalk.dim(` (max ${config.maxRounds})`));
      broadcast({
        type: "status",
        payload: {
          round,
          maxRounds: config.maxRounds,
          status: "debating",
          agents: config.agents.map((a) => a.name),
        },
      });

      // Mark all agents as streaming
      for (const as of agentSessions) {
        broadcast({
          type: "agent_stream",
          payload: {
            agent: as.config.name,
            type: "message.part.updated",
            sessionId: as.sessionId,
            data: { type: "streaming_start" },
          },
        });
      }

      if (round === 1) {
        // Round 1: all agents get the original prompt in parallel
        agentResponses = await runAgentsSettled(
          agentSessions,
          (as) => {
            const system = systemPromptRound1(as.config.name, config.stack, config.codebaseContext);
            const userPrompt = buildUserPromptRound1(config.prompt);
            return promptAndParse(
              client,
              as.sessionId,
              { providerID: as.config.providerID, modelID: as.config.modelID },
              system,
              userPrompt,
              as.config.name,
              { enableTools: hasProject },
            );
          },
          broadcast,
        );
      } else {
        // Round N: each agent sees all OTHER agents' responses
        const prevResponses = { ...agentResponses };
        agentResponses = await runAgentsSettled(
          agentSessions,
          (as) => {
            const system = systemPromptRoundN(as.config.name, round);
            const otherAgents = Object.entries(prevResponses)
              .filter(([name]) => name !== as.config.name)
              .map(([name, resp]) => ({ name, response: JSON.stringify(resp, null, 2) }));
            const userPrompt = buildUserPromptRoundN(otherAgents);
            return promptAndParse(
              client,
              as.sessionId,
              { providerID: as.config.providerID, modelID: as.config.modelID },
              system,
              userPrompt,
              as.config.name,
            );
          },
          broadcast,
        );
      }

      // Need at least 2 agents to continue the debate
      if (Object.keys(agentResponses).length < 2) {
        console.log(chalk.red("\nFewer than 2 agents responded. Aborting debate."));
        break;
      }

      const responseArray = Object.values(agentResponses);
      const namedResponses = Object.entries(agentResponses).map(([name, response]) => ({ name, response }));
      const consensus = buildConsensus(namedResponses);
      convergence = checkConvergence(convergence, responseArray);

      const roundResult: RoundResult = { round, responses: agentResponses, consensus };
      rounds.push(roundResult);

      broadcast({
        type: "round_complete",
        payload: {
          round,
          consensus,
          convergence,
          agents: agentResponses,
        },
      });

      const agreed = consensus.filter((s) => s.agreed).length;
      const disputed = consensus.filter((s) => !s.agreed).length;
      const verdicts = Object.entries(agentResponses)
        .map(([name, r]) => `${name}: ${r.overall_verdict}`)
        .join(", ");
      console.log(
        chalk.green(`  Agreed: ${agreed}`) +
        chalk.red(` Disputed: ${disputed}`) +
        chalk.dim(` | ${verdicts}`),
      );

      if (convergence.converged) {
        console.log(chalk.bold.green(`\nConverged: ${convergence.reason}`));
      }
    }
  } finally {
    eventForwarder.stop();
  }

  const finalNamedResponses = Object.entries(agentResponses).map(([name, response]) => ({ name, response }));
  const finalConsensus = buildConsensus(finalNamedResponses);

  // Extract project_title from first agent that provided one
  const projectTitle = Object.values(agentResponses)
    .map((r) => r.project_title)
    .find((t) => t && t.length > 0) ?? "";

  broadcast({
    type: "debate_complete",
    payload: {
      consensus: finalConsensus,
      convergence,
      agents: agentResponses,
    },
  });

  return {
    rounds,
    consensus: finalConsensus,
    convergenceState: convergence,
    agentResponses,
    projectTitle,
  };
}
