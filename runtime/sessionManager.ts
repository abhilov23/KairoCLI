import fs from "fs/promises";
import os from "os";
import path from "path";

import {
  TaskState,
  createInitialTaskState,
} from "./taskState.js";
import {
  ExecutionState,
  createInitialExecutionState,
} from "./executionState.js";
import {
  WorkspaceState,
  createInitialWorkspaceState,
} from "./workspaceState.js";

const SESSION_FILE = path.join(
  os.homedir(),
  ".terminal-agent",
  "session.json"
);
const MAX_STORED_MESSAGES = 200;

export type StoredMessage = {
  role: string;
  content: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
};

export type SessionState = {
  messages: StoredMessage[];
  task: TaskState;
  execution: ExecutionState;
  workspace: WorkspaceState;
};

function serializeMessage(message: any): StoredMessage {
  const content = typeof message.content === "string" ? message.content : JSON.stringify(message.content);
  const base: StoredMessage = { role: message.role, content };
  if (message.tool_calls) {
    base.tool_calls = message.tool_calls;
  }
  if (message.tool_call_id) {
    base.tool_call_id = message.tool_call_id;
  }
  return base;
}

function createInitialSessionState(): SessionState {
  return {
    messages: [],
    task: createInitialTaskState(),
    execution: createInitialExecutionState(),
    workspace: createInitialWorkspaceState(),
  };
}

function trimMessages(messages: StoredMessage[]): StoredMessage[] {
  if (messages.length <= MAX_STORED_MESSAGES) {
    return messages;
  }

  const first = messages[0];
  const hasLeadingSystem = first?.role === "system";

  if (!hasLeadingSystem) {
    return messages.slice(-MAX_STORED_MESSAGES);
  }

  const tailLimit = MAX_STORED_MESSAGES - 1;
  return [first, ...messages.slice(-tailLimit)];
}

export async function loadSessionState(): Promise<SessionState> {
  try {
    const raw = await fs.readFile(SESSION_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SessionState>;

    return {
      messages: parsed.messages ?? [],
      task: parsed.task ?? createInitialTaskState(),
      execution: parsed.execution ?? createInitialExecutionState(),
      workspace: parsed.workspace ?? createInitialWorkspaceState(),
    };
  } catch {
    return createInitialSessionState();
  }
}

export async function loadSessionMessages(): Promise<any[]> {
  const session = await loadSessionState();
  return session.messages;
}

export async function saveSessionMessages(
  messages: any[],
  patch?: Partial<Pick<SessionState, "task" | "execution" | "workspace">>
): Promise<void> {
  const previous = await loadSessionState();
  const next: SessionState = {
    ...previous,
    messages: trimMessages(messages.map(serializeMessage)),
    task: patch?.task ?? previous.task,
    execution: patch?.execution ?? previous.execution,
    workspace: patch?.workspace ?? previous.workspace,
  };

  await fs.mkdir(path.dirname(SESSION_FILE), { recursive: true });
  await fs.writeFile(SESSION_FILE, JSON.stringify(next, null, 2));
}
