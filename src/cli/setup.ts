import chalk from "chalk";
import { getClient, listProviders } from "../opencode/client.js";
import type { TwoferConfig, AgentConfig } from "./config.js";

interface ProviderInfo {
  id: string;
  name: string;
  models: Record<string, unknown>;
}

const SOTA_MODELS: Array<{ model: string; name: string }> = [
  { model: "claude-opus-4-6",      name: "Claude-Opus" },
  { model: "gpt-5.2-codex",        name: "Codex" },
  { model: "minimax/minimax-m2.5", name: "MiniMax" },
  { model: "z-ai/glm-5",           name: "GLM-5" },
];

export interface SetupResult {
  ok: boolean;
  agents: AgentConfig[];
}

export async function checkSetup(config: TwoferConfig): Promise<SetupResult> {
  try {
    console.log(chalk.dim("Connecting to OpenCode..."));
    const client = await getClient();

    console.log(chalk.dim("Checking providers..."));
    const providers = await listProviders(client);

    if (!providers) {
      console.log(chalk.red("Failed to list providers"));
      return { ok: false, agents: [] };
    }

    const connected = providers.connected ?? [];
    console.log(
      chalk.dim(`Connected providers: ${connected.length > 0 ? connected.join(", ") : "none"}`),
    );

    if (connected.length === 0) {
      console.log(
        chalk.yellow(
          "\nNo providers connected. Run `opencode` and authenticate with at least one provider.",
        ),
      );
      return { ok: false, agents: [] };
    }

    // Build a map of connected providers with their models
    const connectedProviders: ProviderInfo[] = [];
    for (const p of providers.all ?? []) {
      if (!connected.includes(p.id)) continue;
      const modelIds = Object.keys(p.models ?? {});
      console.log(chalk.dim(`  ${p.id} models: ${modelIds.slice(0, 10).join(", ")}${modelIds.length > 10 ? ` (+${modelIds.length - 10} more)` : ""}`));
      connectedProviders.push(p as ProviderInfo);
    }

    // If agents are already specified in config (from CLI --agent flags), validate them
    if (config.agents.length > 0) {
      const resolved: AgentConfig[] = [];
      for (const agent of config.agents) {
        const r = resolveModel(connectedProviders, agent.providerID, agent.modelID, agent.name);
        if (!r) return { ok: false, agents: [] };
        resolved.push({ name: agent.name, providerID: r.providerID, modelID: r.modelID });
      }
      printAgents(resolved);
      return { ok: true, agents: resolved };
    }

    // Pick agents: SOTA mode (all 4) or default (first 2 SOTA)
    const agents = config.sota
      ? pickSotaAgents(connectedProviders)
      : pickDefaultAgents(connectedProviders);
    if (agents.length < 2) {
      console.log(chalk.yellow("\nNeed at least 2 models. Use --agent flags to specify models."));
      return { ok: false, agents: [] };
    }

    printAgents(agents);
    return { ok: true, agents };
  } catch (e) {
    console.log(
      chalk.red(
        `\nFailed to connect to OpenCode. Make sure opencode is installed:\n  npm i -g opencode\n\n${e instanceof Error ? e.message : e}`,
      ),
    );
    return { ok: false, agents: [] };
  }
}

function printAgents(agents: AgentConfig[]): void {
  console.log("");
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const letter = String.fromCharCode(65 + i); // A, B, C...
    console.log(chalk.dim(`  Agent ${letter} (${a.name})`) + chalk.dim.italic(` ${a.providerID}/${a.modelID}`));
  }
  console.log("");
}

/**
 * Find a model across all connected providers.
 * Returns the first provider that has the model, or an error string.
 */
function findModel(
  providers: ProviderInfo[],
  modelID: string,
): { providerID: string; modelID: string } | string {
  for (const p of providers) {
    if (modelID in (p.models ?? {})) {
      return { providerID: p.id, modelID };
    }
  }
  return `Model "${modelID}" not found in any connected provider.`;
}

/**
 * Pick first 2 SOTA models as default agents. Errors on missing models.
 */
function pickDefaultAgents(providers: ProviderInfo[]): AgentConfig[] {
  const agents: AgentConfig[] = [];

  for (const sota of SOTA_MODELS) {
    if (agents.length >= 2) break;
    const result = findModel(providers, sota.model);
    if (typeof result === "string") {
      console.log(chalk.red(`  ${sota.name}: ${result}`));
    } else {
      agents.push({ name: sota.name, providerID: result.providerID, modelID: result.modelID });
    }
  }

  return agents;
}

/**
 * Pick all SOTA models. Requires ALL to be available — errors and aborts on any missing.
 */
function pickSotaAgents(providers: ProviderInfo[]): AgentConfig[] {
  const agents: AgentConfig[] = [];
  let anyMissing = false;

  for (const sota of SOTA_MODELS) {
    const result = findModel(providers, sota.model);
    if (typeof result === "string") {
      console.log(chalk.red(`  ${sota.name}: ${result}`));
      anyMissing = true;
    } else {
      agents.push({ name: sota.name, providerID: result.providerID, modelID: result.modelID });
    }
  }

  if (anyMissing) {
    console.log(chalk.yellow(`\n--sota requires all ${SOTA_MODELS.length} models. Set up the missing providers or models above.`));
    return [];
  }

  return agents;
}

/**
 * Resolve an explicit --agent flag. Provider is required here since the user specified it.
 */
function resolveModel(
  providers: ProviderInfo[],
  providerID: string,
  modelID: string,
  label: string,
): { providerID: string; modelID: string } | null {
  const provider = providers.find((p) => p.id === providerID);
  if (!provider) {
    console.log(chalk.red(`  ${label}: Provider "${providerID}" is not connected.`));
    return null;
  }
  if (!(modelID in (provider.models ?? {}))) {
    console.log(chalk.red(`  ${label}: Model "${modelID}" not found in provider "${providerID}".`));
    return null;
  }
  return { providerID, modelID };
}
