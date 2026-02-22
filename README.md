# twofer

Multi-agent design debate CLI. Give it a prompt, and multiple AI agents will debate the architecture — then converge on a battle-tested spec.

## Install

```bash
npm i -g twofer
```

Or run directly:

```bash
npx twofer "build a todo app"
```

## Quick Start

```bash
# Basic — auto-detects available models
twofer "build a real-time chat app"

# With a preferred stack
twofer "build an analytics dashboard" --stack "Next.js, Postgres, Tailwind"

# SOTA mode — uses 4 top-tier models
twofer "build a collaborative code editor" --sota
```

## CLI Reference

```
Usage: twofer [options] <prompt>

Arguments:
  prompt                          The project prompt to debate

Options:
  -a, --agent <provider/model>    Add an agent (repeatable, format: provider/model or name=provider/model)
  -r, --max-rounds <n>            Safety limit on debate rounds (default: 10)
  -s, --stack <stack>             Preferred tech stack
  --no-ui                         Disable web UI
  -o, --output <file>             Output markdown file
  -d, --dir <path>                Project directory to scan for context (default: cwd)
  --no-scan                       Skip codebase scanning
  --sota                          Use all SOTA models (4 agents)
  --debug                         Enable debug logging
  -V, --version                   Output the version number
  -h, --help                      Display help
```

## How It Works

1. **Connect** — twofer connects to your AI providers via the OpenCode SDK
2. **Debate** — agents propose, critique, and refine architecture in structured rounds
3. **Converge** — a moderator synthesizes agreement into a unified spec
4. **Export** — final spec is served in a live web UI or exported as markdown

## Prerequisites

You need the [OpenCode SDK](https://github.com/nicepkg/opencode) configured with at least 2 AI providers (or use `--sota` to auto-select models).

## License

MIT
