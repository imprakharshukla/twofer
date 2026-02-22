import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface AgentConfig {
  name: string;
  providerID: string;
  modelID: string;
}

export interface TwoferConfig {
  maxRounds: number;
  stack?: string;
  agents: AgentConfig[];
  httpPort: number;
  sota?: boolean;
}

const DEFAULTS = {
  maxRounds: 10,
  httpPort: 3002,
};

const CONFIG_PATH = path.join(
  os.homedir(),
  ".config",
  "twofer",
  "config.json",
);

export function loadConfig(overrides: {
  maxRounds?: number;
  stack?: string;
  agents?: AgentConfig[];
  sota?: boolean;
}): TwoferConfig {
  let fileConfig: Partial<TwoferConfig> = {};

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      fileConfig = JSON.parse(raw);
    }
  } catch {
    // ignore invalid config
  }

  return {
    maxRounds: overrides.maxRounds ?? fileConfig.maxRounds ?? DEFAULTS.maxRounds,
    stack: overrides.stack ?? fileConfig.stack,
    agents: overrides.agents ?? fileConfig.agents ?? [],
    httpPort: fileConfig.httpPort ?? DEFAULTS.httpPort,
    sota: overrides.sota,
  };
}
