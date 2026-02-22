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

## Setup with OpenRouter (recommended)

The easiest way to get access to every model is through [OpenRouter](https://openrouter.ai). Configure it once in OpenCode and twofer can use any model OpenRouter supports.

**1. Get an OpenRouter API key** at [openrouter.ai/keys](https://openrouter.ai/keys)

**2. Add it to your OpenCode config** (`~/.config/opencode/config.json`):

```json
{
  "provider": {
    "openrouter": {
      "apiKey": "sk-or-..."
    }
  }
}
```

**3. Run twofer** — it auto-discovers OpenRouter as a provider and all its models become available:

```bash
# Auto-picks the best available models
twofer "build a real-time chat app"

# Or pick specific models via OpenRouter
twofer "design a payment system" \
  --agent "openrouter/anthropic/claude-opus-4-6" \
  --agent "openrouter/openai/gpt-5.2-codex"
```

### How provider discovery works

On startup, twofer queries OpenCode for all connected providers and their models. It scans every provider — OpenRouter, Anthropic, OpenAI, Google, and any others you've configured — to find available models. This means:

- **One provider is enough** — OpenRouter alone gives you access to 200+ models
- **Multiple providers work too** — if you have both Anthropic and OpenAI keys configured directly, twofer sees both
- **`--sota` mode** picks 4 top-tier models from whatever providers are available
- **`--agent` flag** lets you target a specific provider/model combination

### Other providers

You can configure any provider that OpenCode supports (Anthropic, OpenAI, Google, etc.) the same way — add the API key to your OpenCode config and twofer picks it up automatically.

## License

MIT
