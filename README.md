# Shell Copilot

A terminal-native AI coding assistant built with TypeScript, LangChain, and NVIDIA NIM.

Shell Copilot combines:
- AI tool calling
- shell execution
- filesystem awareness
- code search
- file editing
- iterative agent loops

into a developer-focused terminal experience.

---

# Features

## Agent Runtime
- Iterative tool execution loop
- Inline tool-call fallback parsing
- Multi-step reasoning workflows
- Terminal-native interaction

## Filesystem Tools
- Read files
- Write files
- Replace content in files
- List directories
- Search text recursively

## Shell Tools
- Execute terminal commands
- Current directory awareness
- Change directories

## Developer UX
- Colored terminal UI
- Tool execution logs
- Internal commands
- Dockerized runtime

---

# Tech Stack

- TypeScript
- LangChain
- NVIDIA NIM
- Node.js
- Docker
- Zod
- Chalk
- Prompt Sync

---

# Project Structure

```txt
.
├── core/
│   ├── agentLoop.ts
│   ├── commandRouter.ts
│   ├── inlineToolParser.ts
│   ├── toolExecutor.ts
│   └── toolRegistory.ts
│
├── model/
│   └── model.ts
│
├── prompt/
│   └── prompt.ts
│
├── tools/
│   ├── changeDirectory.ts
│   ├── currentDirectory.ts
│   ├── execCommand.ts
│   ├── getTime.ts
│   ├── listDirectory.ts
│   ├── readFile.ts
│   ├── replaceInFile.ts
│   ├── searchText.ts
│   └── writeFile.ts
│
├── ui/
│   └── ui.ts
│
├── index.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

# Installation

## Clone Repository

```bash
git clone <your-repo-url>
cd TERMINAL-AGENT-AI
```

## Install Dependencies

```bash
pnpm install
```

---

# Environment Variables

Create a `.env` file:

```env
NVIDIA_API_KEY=your_api_key
```

---

# Running The Project

## Development

```bash
pnpm tsx index.ts
```

## Production Build

```bash
pnpm tsc
node dist/index.js
```

---

# Docker

## Build Image

```bash
docker build -t shell-copilot .
```

## Run Container

```bash
docker run -it --env-file .env shell-copilot
```

---

# Available Tools

| Tool | Description |
|---|---|
| `get_time` | Get current system time |
| `execute_command` | Execute shell commands |
| `current_directory` | Get current working directory |
| `list_directory` | List files and folders |
| `read_file` | Read file contents |
| `search_text` | Search text recursively |
| `change_directory` | Change current directory |
| `write_file` | Create or overwrite files |
| `replace_in_file` | Replace text inside files |

---

# Internal Commands

| Command | Description |
|---|---|
| `/tools` | Show available tools |
| `/clear` | Clear conversation memory |
| `exit` | Exit application |

---

# Example Workflows

## Search Code

```txt
Search for ChatOpenAI usage
```

## Read Files

```txt
Read package.json
```

## Edit Files

```txt
Replace "localhost" with "127.0.0.1" in config.ts
```

## Execute Commands

```txt
Show files in current directory
```

---

# Safety Notes

Shell Copilot can:
- execute terminal commands
- edit files
- modify project structure

Use carefully inside isolated environments or containers.

---

# Future Improvements

- Git integration
- Test execution
- Streaming responses
- Diff previews
- Safety middleware
- AST-based editing
- Autonomous workflows
- Session persistence

---

# License

MIT