# KairoCLI

KairoCLI is a terminal-native AI coding assistant built with TypeScript and LangChain.

## Features

- Interactive CLI chat loop
- Multi-provider model setup (`nvidia`, `openai`, `anthropic`, `ollama`, `groq`)
- Tool-calling agent with safety checks
- Persistent chat memory
- File, shell, and git helper tools

## Install

```bash
pnpm install
```

## Setup

```bash
pnpm setup
```

Or after global link:

```bash
kairo setup
```

## Run

Development:

```bash
pnpm dev
```

Production build:

```bash
pnpm build
pnpm start
```

Direct CLI from build output:

```bash
node dist/index.js
```

## Global CLI

```bash
pnpm build
pnpm link --global
kairo
```

## Internal Commands

- `/tools` show available tools
- `/clear` clear conversation memory
- `clear` or `cls` clear terminal screen
- `exit` exit the app

## Available Tools

- `get_time`
- `execute_command`
- `current_directory`
- `list_directory`
- `read_file`
- `search_text`
- `change_directory`
- `write_file`
- `replace_in_file`
- `run_script`
- `git_status`
- `git_diff`
- `diff_preview`

## Docker

```bash
docker build -t kairocli .
docker run -it kairocli
```
