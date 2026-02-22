import type { AgentResponse } from "./schema.js";

export interface ConvergenceState {
  consecutiveApprovals: number;
  round: number;
  maxRounds: number;
  converged: boolean;
  reason?: string;
}

export function createConvergenceState(maxRounds: number): ConvergenceState {
  return {
    consecutiveApprovals: 0,
    round: 0,
    maxRounds,
    converged: false,
  };
}

export function checkConvergence(
  state: ConvergenceState,
  responses: AgentResponse[],
): ConvergenceState {
  const allApprove = responses.every((r) => r.overall_verdict === "approve");

  const newConsecutive = allApprove ? state.consecutiveApprovals + 1 : 0;
  const newRound = state.round + 1;

  if (newConsecutive >= 2) {
    return {
      ...state,
      consecutiveApprovals: newConsecutive,
      round: newRound,
      converged: true,
      reason: "All agents approved for 2 consecutive rounds",
    };
  }

  if (newRound >= state.maxRounds) {
    return {
      ...state,
      consecutiveApprovals: newConsecutive,
      round: newRound,
      converged: true,
      reason: `Max rounds (${state.maxRounds}) reached`,
    };
  }

  return {
    ...state,
    consecutiveApprovals: newConsecutive,
    round: newRound,
    converged: false,
  };
}

export interface ConsensusSection {
  title: string;
  agreed: boolean;
  agentContents: Record<string, string>; // agentName -> content
  finalContent: string;
}

export function buildConsensus(
  agentResponses: Array<{ name: string; response: AgentResponse }>,
): ConsensusSection[] {
  const allTitles = new Set<string>();
  for (const { response } of agentResponses) {
    for (const s of response.sections) {
      allTitles.add(s.title);
    }
  }

  return Array.from(allTitles).map((title) => {
    const agentContents: Record<string, string> = {};
    let allApprove = true;

    for (const { name, response } of agentResponses) {
      const section = response.sections.find((s) => s.title === title);
      agentContents[name] = section?.content ?? "";
      if (section?.verdict !== "approve") allApprove = false;
    }

    return {
      title,
      agreed: allApprove,
      agentContents,
      finalContent: allApprove ? agentContents[agentResponses[0].name] ?? "" : "",
    };
  });
}
