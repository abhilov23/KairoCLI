import { describe, it, expect, vi, beforeEach } from "vitest";
import { Writable } from "stream";
import { z } from "zod";
import { registry } from "../tools/registry.js";

// ─── Mock helpers ────────────────────────────────────────────────

function textChunk(content: string) {
  return {
    choices: [{ delta: { content }, finish_reason: null }],
  };
}

function toolCallDeltaChunk(
  index: number,
  id: string | undefined,
  functionName: string | undefined,
  functionArgs: string | undefined,
) {
  return {
    choices: [
      {
        delta: {
          tool_calls: [
            {
              index,
              id,
              type: "function" as const,
              function: { name: functionName, arguments: functionArgs },
            },
          ],
        },
        finish_reason: null,
      },
    ],
  };
}

function finishChunk() {
  return {
    choices: [{ delta: {}, finish_reason: "stop" }],
  };
}

async function* buildStream(chunks: any[]): AsyncIterable<any> {
  for (const c of chunks) {
    yield c;
  }
}

function mockClient(...responseChunks: any[][]) {
  let idx = 0;
  const create = vi.fn().mockImplementation(() => {
    const chunks = responseChunks[idx++];
    if (!chunks) throw new Error(`Unexpected API call #${idx}: not enough mock responses`);
    return buildStream(chunks);
  });

  return {
    chat: { completions: { create } },
  };
}

/** Suppress stdout during a test by piping into a blackhole. */
function withSilentStdout<T>(fn: () => Promise<T>): Promise<T> {
  const oldWrite = process.stdout.write.bind(process.stdout);
  const blackhole = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  process.stdout.write = blackhole.write.bind(blackhole);
  return fn().finally(() => {
    process.stdout.write = oldWrite;
  });
}

// vi.mock is hoisted to the top of the file — this is the correct placement
vi.mock("../providers/getClient.js", () => ({
  getClient: vi.fn(),
}));

// ─── streamHandler tests ─────────────────────────────────────────

describe("streamHandler", () => {
  beforeEach(() => {
    registry.register({
      name: "sh_test_tool",
      description: "Stream handler test tool",
      parameters: z.object({ name: z.string() }),
      execute: async ({ name }) => `Hi ${name}`,
    });
  });

  it("should return text-only content (no tool calls)", async () => {
    const { streamResponse } = await import("../core/streamHandler.js");
    const client = mockClient([textChunk("Hello"), textChunk(" world!"), finishChunk()]);

    const result = await withSilentStdout(() => streamResponse(client, "test-model", []));

    expect(result.fullContent).toBe("Hello world!");
    expect(result.toolCalls).toHaveLength(0);
  });

  it("should assemble single tool call from delta chunks", async () => {
    const { streamResponse } = await import("../core/streamHandler.js");
    const client = mockClient([
      toolCallDeltaChunk(0, "call_1", "sh_test_tool", '{"name":'),
      toolCallDeltaChunk(0, undefined, undefined, '"World"}'),
      finishChunk(),
    ]);

    const result = await withSilentStdout(() => streamResponse(client, "test-model", []));

    expect(result.fullContent).toBe("");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].id).toBe("call_1");
    expect(result.toolCalls[0].function.name).toBe("sh_test_tool");
    expect(result.toolCalls[0].function.arguments).toBe('{"name":"World"}');
  });

  it("should assemble multiple parallel tool calls", async () => {
    const { streamResponse } = await import("../core/streamHandler.js");
    const client = mockClient([
      toolCallDeltaChunk(0, "call_1", "sh_test_tool", '{"name":"Alice"}'),
      toolCallDeltaChunk(1, "call_2", "sh_test_tool", '{"name":"Bob"}'),
      finishChunk(),
    ]);

    const result = await withSilentStdout(() => streamResponse(client, "test-model", []));

    expect(result.toolCalls).toHaveLength(2);
    expect(result.toolCalls[0].id).toBe("call_1");
    expect(result.toolCalls[1].id).toBe("call_2");
  });

  it("should produce empty toolCalls array when no tool call completes", async () => {
    const { streamResponse } = await import("../core/streamHandler.js");
    const client = mockClient([
      toolCallDeltaChunk(0, undefined, "sh_test_tool", "{}"),
      finishChunk(),
    ]);

    const result = await withSilentStdout(() => streamResponse(client, "test-model", []));

    expect(result.toolCalls).toHaveLength(0);
  });

  it("should combine content and tool calls in the same response", async () => {
    const { streamResponse } = await import("../core/streamHandler.js");
    const client = mockClient([
      textChunk("Let me check that"),
      toolCallDeltaChunk(0, "call_1", "sh_test_tool", '{"name":"World"}'),
      finishChunk(),
    ]);

    const result = await withSilentStdout(() => streamResponse(client, "test-model", []));

    expect(result.fullContent).toBe("Let me check that");
    expect(result.toolCalls).toHaveLength(1);
  });

  it("should handle empty stream gracefully", async () => {
    const { streamResponse } = await import("../core/streamHandler.js");
    const client = mockClient([finishChunk()]);

    const result = await withSilentStdout(() => streamResponse(client, "test-model", []));

    expect(result.fullContent).toBe("");
    expect(result.toolCalls).toHaveLength(0);
  });
});

// ─── toolExecutor tests ──────────────────────────────────────────

describe("toolExecutor", () => {
  beforeEach(() => {
    registry.register({
      name: "te_greet",
      description: "Greet someone",
      parameters: z.object({ name: z.string() }),
      execute: async ({ name }) => `Hello, ${name}!`,
    });
    registry.register({
      name: "te_throw",
      description: "Always throws",
      parameters: z.object({}),
      execute: async () => {
        throw new Error("Intentional failure");
      },
    });
  });

  it("should execute a tool and push result to messages", async () => {
    const { executeToolCall } = await import("../core/toolExecutor.js");
    const messages: any[] = [];
    const alwaysProceed = vi.fn().mockResolvedValue(true);

    const result = await executeToolCall(
      { id: "call_1", type: "function", function: { name: "te_greet", arguments: '{"name":"World"}' } },
      messages,
      alwaysProceed,
    );

    expect(result.cancelled).toBe(false);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("tool");
    expect(JSON.parse(messages[0].content)).toBe("Hello, World!");
  });

  it("should cancel when safety check returns false", async () => {
    const { executeToolCall } = await import("../core/toolExecutor.js");
    const messages: any[] = [];
    const denyAll = vi.fn().mockResolvedValue(false);

    const result = await executeToolCall(
      { id: "call_1", type: "function", function: { name: "te_greet", arguments: '{"name":"World"}' } },
      messages,
      denyAll,
    );

    expect(result.cancelled).toBe(true);
    expect(messages).toHaveLength(1);
    const content = JSON.parse(messages[0].content);
    expect(content.error).toContain("cancelled");
  });

  it("should push error message when tool execution throws", async () => {
    const { executeToolCall } = await import("../core/toolExecutor.js");
    const messages: any[] = [];
    const alwaysProceed = vi.fn().mockResolvedValue(true);

    const result = await executeToolCall(
      { id: "call_1", type: "function", function: { name: "te_throw", arguments: "{}" } },
      messages,
      alwaysProceed,
    );

    expect(result.cancelled).toBe(false);
    expect(messages).toHaveLength(1);
    const content = JSON.parse(messages[0].content);
    expect(content.error).toContain("Intentional failure");
  });

  it("executeToolCalls should process all tool calls even if some fail", async () => {
    const { executeToolCalls } = await import("../core/toolExecutor.js");
    const messages: any[] = [];
    const alwaysProceed = vi.fn().mockResolvedValue(true);

    await executeToolCalls(
      [
        { id: "call_1", type: "function", function: { name: "te_greet", arguments: '{"name":"Alice"}' } },
        { id: "call_2", type: "function", function: { name: "te_greet", arguments: '{"name":"Bob"}' } },
      ],
      messages,
      alwaysProceed,
    );

    expect(messages).toHaveLength(2);
    expect(JSON.parse(messages[0].content)).toBe("Hello, Alice!");
    expect(JSON.parse(messages[1].content)).toBe("Hello, Bob!");
  });

  it("should continue after a cancelled tool call", async () => {
    const { executeToolCalls } = await import("../core/toolExecutor.js");
    const messages: any[] = [];
    const check = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await executeToolCalls(
      [
        { id: "call_1", type: "function", function: { name: "te_greet", arguments: '{"name":"Alice"}' } },
        { id: "call_2", type: "function", function: { name: "te_greet", arguments: '{"name":"Bob"}' } },
      ],
      messages,
      check,
    );

    expect(messages).toHaveLength(2);
    expect(JSON.parse(messages[0].content).error).toContain("cancelled");
    expect(JSON.parse(messages[1].content)).toBe("Hello, Bob!");
  });

  it("should work with default safety check (always proceeds)", async () => {
    const { executeToolCall } = await import("../core/toolExecutor.js");
    const messages: any[] = [];

    const result = await executeToolCall(
      { id: "call_1", type: "function", function: { name: "te_greet", arguments: '{"name":"Test"}' } },
      messages,
    );

    expect(result.cancelled).toBe(false);
    expect(JSON.parse(messages[0].content)).toBe("Hello, Test!");
  });
});

// ─── agentLoop integration tests ─────────────────────────────────

describe("agentLoop", () => {
  beforeEach(() => {
    registry.register({
      name: "al_greet",
      description: "Greet someone",
      parameters: z.object({ name: z.string() }),
      execute: async ({ name }) => `Hello, ${name}!`,
    });
    registry.register({
      name: "al_throw",
      description: "Always throws",
      parameters: z.object({}),
      execute: async () => {
        throw new Error("Intentional failure");
      },
    });
  });

  it("should complete a text-only response (no tool calls)", async () => {
    const { getClient } = await import("../providers/getClient.js");
    const client = mockClient([textChunk("Hello from the AI!"), finishChunk()]);
    (getClient as any).mockReturnValue({ client, model: "test-model" });

    const { runTask } = await import("../core/agentLoop.js");

    await withSilentStdout(() => runTask("Say hello"));

    // Stream was called once for the text-only response
    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  it("should execute a tool and continue the loop with a follow-up response", async () => {
    const { getClient } = await import("../providers/getClient.js");

    const client = mockClient(
      [toolCallDeltaChunk(0, "call_1", "al_greet", '{"name":"World"}'), finishChunk()],
      [textChunk("Done!"), finishChunk()],
    );
    (getClient as any).mockReturnValue({ client, model: "test-model" });

    const { runTask } = await import("../core/agentLoop.js");

    await withSilentStdout(() => runTask("Greet the world"));

    // Two API calls: tool response + follow-up text
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it("should handle tool execution errors gracefully", async () => {
    const { getClient } = await import("../providers/getClient.js");

    const client = mockClient(
      [toolCallDeltaChunk(0, "call_1", "al_throw", "{}"), finishChunk()],
      [textChunk("Tool failed but handled."), finishChunk()],
    );
    (getClient as any).mockReturnValue({ client, model: "test-model" });

    const { runTask } = await import("../core/agentLoop.js");

    await withSilentStdout(() => runTask("Run the failing tool"));

    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it("should cycle through multiple tool calls in one response", async () => {
    const { getClient } = await import("../providers/getClient.js");

    const client = mockClient(
      [
        toolCallDeltaChunk(0, "call_1", "al_greet", '{"name":"Alice"}'),
        toolCallDeltaChunk(1, "call_2", "al_greet", '{"name":"Bob"}'),
        finishChunk(),
      ],
      [textChunk("Both greeted!"), finishChunk()],
    );
    (getClient as any).mockReturnValue({ client, model: "test-model" });

    const { runTask } = await import("../core/agentLoop.js");

    await withSilentStdout(() => runTask("Greet Alice and Bob"));

    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it("should produce correct arguments via tool call streaming assembly", async () => {
    const { getClient } = await import("../providers/getClient.js");

    const client = mockClient(
      [
        toolCallDeltaChunk(0, "call_1", "al_greet", '{"name":'),
        toolCallDeltaChunk(0, undefined, undefined, '"World"}'),
        finishChunk(),
      ],
      [textChunk("Greeted!"), finishChunk()],
    );
    (getClient as any).mockReturnValue({ client, model: "test-model" });

    const { runTask } = await import("../core/agentLoop.js");

    await withSilentStdout(() => runTask("Greet the world with streaming"));

    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);

    // Verify the tool result was included in the second API call's messages
    const secondCallMessages = client.chat.completions.create.mock.calls[1][0].messages;
    const toolMessages = secondCallMessages.filter((m: any) => m.role === "tool");
    expect(toolMessages).toHaveLength(1);
    expect(JSON.parse(toolMessages[0].content)).toBe("Hello, World!");
  });
});
