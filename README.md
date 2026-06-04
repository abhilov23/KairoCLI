# KairoCLI

A terminal-native AI coding assistant built with TypeScript and the OpenAI SDK.

KairoCLI runs as an interactive CLI agent with tool-calling capabilities — reading/writing files, executing commands, searching code, and managing git workflows — all from your terminal.

---

## Demo

https://github.com/user-attachments/assets/e95504c1-01e1-4f7d-9eea-ad753c23acb2

---

## Features

- **Interactive terminal assistant** — conversational AI that can act on your codebase
- **Multi-provider support** — OpenAI, Anthropic, Groq, NVIDIA, Ollama, or any OpenAI-compatible API (Custom)
- **Streaming responses** — real-time token-by-token output with markdown rendering
- **Tool-calling agent** — tools for filesystem, shell, git, and search operations
- **Safety checks** — dangerous commands and protected files require confirmation
- **Runtime session persistence** — conversation history and state saved across sessions
- **Workspace-aware execution** — tracks current working directory and execution state
- **Git-aware tooling** — status, diff, and diff preview tools
- **Non-interactive mode** — `--task` flag for single-shot automation
- **Docker support** — containerized runtime for portable execution
- **CI/CD** — GitHub Actions pipeline with build and test

---

## Architecture

```
kairo/
├── config/          # Configuration loading, saving, setup flow
├── core/            # Agent loop, command routing, streaming, tool execution, safety
├── prompt/          # System prompt defining agent behavior
├── providers/       # Provider definitions (base URLs, default models, env vars)
├── runtime/         # Session persistence, execution/task/workspace state
├── tests/           # Vitest test suite
├── tools/           # Tool registry and individual tool implementations
├── ui/              # Terminal UI (banner, markdown rendering, input)
└── index.ts         # CLI entry point
```

---

## Install

### From npm

```bash
npm install -g @abhilov/kairo
```

### From source

```bash
pnpm install
pnpm build
```

---

## Setup

```bash
kairo setup
```

You'll be prompted to select a provider and configure the model. Supported providers:

| # | Provider  | Auth method              |
|---|---|--------------------------|
| 1 | OpenAI    | `OPENAI_API_KEY` env var |
| 2 | Anthropic | `ANTHROPIC_API_KEY` env var |
| 3 | Groq      | `GROQ_API_KEY` env var   |
| 4 | NVIDIA    | `NVIDIA_API_KEY` env var |
| 5 | Ollama    | No API key required (local) |
| 6 | Custom    | Set base URL, API key, and model explicitly |

Configuration is stored at:

```
~/.terminal-agent/config.json
```

---

## Run

```bash
# Interactive session
kairo

# Non-interactive task
kairo --task "show me the git log"

# Development mode (hot reload)
pnpm dev

# Production build
pnpm build
pnpm start

# Direct invocation from build output
node dist/index.js
```

---

## CLI Commands

| Command              | Description                                |
|----------------------|--------------------------------------------|
| `kairo`              | Start interactive assistant                |
| `kairo setup`        | Configure provider and model               |
| `kairo doctor`       | Run configuration health checks            |
| `kairo help`         | Show CLI help                              |
| `kairo version`      | Show CLI version                           |
| `kairo --task <txt>` | Execute a single task non-interactively    |

---

## Internal Commands

| Command      | Description                      |
|--------------|----------------------------------|
| `/help`      | Show interactive help and tools  |
| `/tools`     | List available tools             |
| `/clear`     | Clear conversation memory        |
| `clear`/`cls`| Clear terminal screen            |
| `exit`       | Exit KairoCLI                    |

---

## Available Tools

| Tool               | Description                              |
|--------------------|------------------------------------------|
| `get_time`         | Get current system date and time         |
| `execute_command`  | Run a terminal command                   |
| `current_directory`| Get current working directory            |
| `list_directory`   | List files and folders in a directory    |
| `read_file`        | Read file contents                       |
| `search_text`      | Search for text across files             |
| `change_directory` | Change working directory                 |
| `write_file`       | Write text to a file                     |
| `replace_in_file`  | Replace text in a file                   |
| `run_script`       | Run a script in the shell                |
| `git_status`       | Show git repository status               |
| `git_diff`         | Show diff for modified files             |
| `diff_preview`     | Show a unified diff preview for changes  |

---

## Runtime State

KairoCLI persists sessions to disk so you can resume where you left off:

```
~/.terminal-agent/session.json
```

The runtime tracks:

- **Conversation messages** — up to 200 recent messages with history trimming
- **Execution state** — turn count, last tool used, error state
- **Task state** — current task, status (idle / in_progress / blocked / done)
- **Workspace state** — current working directory

---

## Tech Stack

- **TypeScript** — strict mode, ES2022 target
- **OpenAI SDK** — streaming chat completions with tool calling
- **Zod** — runtime parameter validation + JSON Schema generation
- **Chalk** / **Boxen** — terminal styling and banners
- **Marked** / **marked-terminal** — markdown rendering in the terminal
- **Ora** — spinner UI during tool execution
- **Dotenv** — environment variable loading from `.env`
- **Vitest** — test runner
- **pnpm** — package manager

---

## Docker

```bash
docker build -t kairocli .
docker run -it kairocli
```

---

## CI/CD

GitHub Actions runs on every push and PR to `main`:

- `pnpm install`
- `pnpm build`
- `pnpm test`

---

## Repository

- **GitHub:** https://github.com/abhilov23/KairoCLI
- **npm:** https://www.npmjs.com/package/@abhilov/kairo
