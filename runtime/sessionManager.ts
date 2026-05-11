import fs from "fs/promises";
import os from "os";
import path from "path";

import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";

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
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type SessionState = {
  messages: StoredMessage[];
  task: TaskState;
  execution: ExecutionState;
  workspace: WorkspaceState;
};

function serializeMessages(messages: BaseMessage[]): StoredMessage[] {
  return messages.map((message) => {
    if (message instanceof HumanMessage) {
      return { role: "user", content: message.content.toString() };
    }

    if (message instanceof AIMessage) {
      return { role: "assistant", content: message.content.toString() };
    }

    if (message instanceof SystemMessage) {
      return { role: "system", content: message.content.toString() };
    }

    if (message instanceof ToolMessage) {
      return { role: "tool", content: message.content.toString() };
    }

    return { role: "assistant", content: message.content.toString() };
  });
}

function deserializeMessages(messages: StoredMessage[]): BaseMessage[] {
  return messages.map((message) => {
    switch (message.role) {
      case "system":
        return new SystemMessage(message.content);
      case "user":
        return new HumanMessage(message.content);
      case "assistant":
        return new AIMessage(message.content);
      case "tool":
        return new ToolMessage({
          tool_call_id: "restored_tool",
          content: message.content,
        });
      default:
        return new HumanMessage(message.content);
    }
  });
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

export async function loadSessionMessages(): Promise<BaseMessage[]> {
  const session = await loadSessionState();
  return deserializeMessages(session.messages);
}

export async function saveSessionMessages(
  messages: BaseMessage[],
  patch?: Partial<Pick<SessionState, "task" | "execution" | "workspace">>
): Promise<void> {
  const previous = await loadSessionState();
  const next: SessionState = {
    ...previous,
    messages: trimMessages(serializeMessages(messages)),
    task: patch?.task ?? previous.task,
    execution: patch?.execution ?? previous.execution,
    workspace: patch?.workspace ?? previous.workspace,
  };

  await fs.mkdir(path.dirname(SESSION_FILE), { recursive: true });
  await fs.writeFile(SESSION_FILE, JSON.stringify(next, null, 2));
}
