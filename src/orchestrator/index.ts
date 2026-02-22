export { runDebate } from "./orchestrator.js";
export type { DebateConfig, DebateResult, RoundResult } from "./orchestrator.js";
export { AgentResponseSchema, parseAgentResponse, extractJSON } from "./schema.js";
export type { AgentResponse, Section } from "./schema.js";
export {
  createConvergenceState,
  checkConvergence,
  buildConsensus,
} from "./convergence.js";
export type { ConvergenceState, ConsensusSection } from "./convergence.js";
