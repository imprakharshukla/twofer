#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import { exec } from "node:child_process";
import { platform } from "node:os";
import type { Server } from "node:http";
import { loadConfig, type AgentConfig } from "./config.js";
import { checkSetup } from "./setup.js";
import { scanCodebase, formatContext } from "./scanner.js";
import { getClient, shutdown } from "../opencode/client.js";
import { runDebate } from "../orchestrator/orchestrator.js";
import { createWsServer } from "../server/ws.js";
import { createHttpServer } from "../server/api.js";
import { exportToMarkdown } from "../utils/export.js";
import type { WsServer } from "../server/ws.js";
import type { DebateResult } from "../orchestrator/index.js";

// Track all servers for cleanup
let wsServer: WsServer | null = null;
let httpServer: Server | null = null;

let cleaningUp = false;
async function cleanup() {
  if (cleaningUp) return;
  cleaningUp = true;
  try { wsServer?.close(); } catch {}
  try { httpServer?.close(); } catch {}
  try { await shutdown(); } catch {}
  process.exit(0);
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("uncaughtException", async (e) => {
  console.error(chalk.red(`\nUncaught error: ${e.message}`));
  await cleanup();
});

/**
 * Parse --agent flag values like "anthropic/claude-opus-4-6" or "MyAgent=anthropic/claude-opus-4-6"
 */
function parseAgentFlag(values: string[]): AgentConfig[] {
  return values.map((v, i) => {
    const eqIdx = v.indexOf("=");
    let name: string;
    let providerModel: string;

    if (eqIdx > 0) {
      name = v.slice(0, eqIdx);
      providerModel = v.slice(eqIdx + 1);
    } else {
      name = `Agent-${i + 1}`;
      providerModel = v;
    }

    const slashIdx = providerModel.indexOf("/");
    if (slashIdx <= 0) {
      console.error(chalk.red(`Invalid --agent format: "${v}". Use "provider/model" or "name=provider/model"`));
      process.exit(1);
    }

    return {
      name,
      providerID: providerModel.slice(0, slashIdx),
      modelID: providerModel.slice(slashIdx + 1),
    };
  });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const program = new Command();

program
  .name("twofer")
  .description("Orchestrate multi-agent design debate")
  .version("1.0.0")
  .argument("<prompt>", "The project prompt to debate")
  .option("-a, --agent <provider/model>", "Add an agent (repeatable, format: provider/model or name=provider/model)", (v, prev: string[]) => [...prev, v], [])
  .option("-r, --max-rounds <n>", "Safety limit on debate rounds", "10")
  .option("-s, --stack <stack>", "Preferred tech stack")
  .option("--no-ui", "Disable web UI")
  .option("-o, --output <file>", "Output markdown file")
  .option("-d, --dir <path>", "Project directory to scan for context", process.cwd())
  .option("--no-scan", "Skip codebase scanning")
  .option("--sota", "Use all SOTA models (4 agents)")
  .option("--debug", "Enable debug logging")
  .action(async (prompt, opts) => {
    if (opts.debug) process.env.TWOFER_DEBUG = "1";

    if (opts.sota && opts.agent.length > 0) {
      console.error(chalk.red("--sota and --agent cannot be used together."));
      process.exit(1);
    }

    const agents = opts.agent.length > 0 ? parseAgentFlag(opts.agent) : [];

    if (agents.length === 1) {
      console.error(chalk.red("Need at least 2 agents for a debate. Add more --agent flags."));
      process.exit(1);
    }

    const config = loadConfig({
      maxRounds: parseInt(opts.maxRounds, 10),
      stack: opts.stack,
      agents,
      sota: opts.sota,
    });

    console.log(chalk.bold("\n  TWOFER") + chalk.dim(" — multi-agent design debate\n"));

    // Setup check — auto-detects models if none specified
    const setup = await checkSetup(config);
    if (!setup.ok || setup.agents.length < 2) process.exit(1);

    // Start servers — single port for HTTP + WS + static
    wsServer = createWsServer();
    let debateResult: DebateResult | null = null;
    httpServer = createHttpServer(config.httpPort, () => debateResult, wsServer);
    console.log(chalk.dim(`Server on http://localhost:${config.httpPort}`));

    if (opts.ui !== false) {
      const os = platform();
      const open = os === "darwin" ? "open" : os === "win32" ? "start" : "xdg-open";
      exec(`${open} http://localhost:${config.httpPort}`);
      console.log(chalk.dim(`Opening browser...\n`));
    }

    // Scan codebase for context
    let codebaseContext: string | undefined;
    if (opts.scan !== false) {
      const projectDir = opts.dir ?? process.cwd();
      const scan = scanCodebase(projectDir);
      if (scan.keyFiles.length > 0) {
        codebaseContext = formatContext(scan);
      }
    }

    try {
      const client = await getClient();

      const projectDir = opts.scan !== false ? (opts.dir ?? process.cwd()) : undefined;

      debateResult = await runDebate(client, {
        prompt,
        maxRounds: config.maxRounds,
        stack: config.stack,
        agents: setup.agents,
        codebaseContext,
        projectDir,
      }, wsServer.broadcast);

      // Export to file if requested or in headless mode
      if (opts.output) {
        const markdown = exportToMarkdown(debateResult);
        fs.writeFileSync(opts.output, markdown, "utf-8");
        console.log(chalk.green(`\nSpec exported to ${opts.output}`));
      }

      if (opts.ui === false) {
        // Headless mode: auto-export and exit
        if (!opts.output) {
          const title = debateResult.projectTitle
            ? slugify(debateResult.projectTitle)
            : "spec";
          const filename = `twofer-${title}.md`;
          const markdown = exportToMarkdown(debateResult);
          fs.writeFileSync(filename, markdown, "utf-8");
          console.log(chalk.green(`\nSpec exported to ${filename}`));
        }
        await cleanup();
      } else {
        // Keep alive for UI
        console.log(chalk.dim("\nPress Ctrl+C to exit"));
        await new Promise(() => {}); // keep alive
      }
    } catch (e) {
      console.error(chalk.red(`\nError: ${e instanceof Error ? e.message : e}`));
      await cleanup();
    }
  });

program.parse();
