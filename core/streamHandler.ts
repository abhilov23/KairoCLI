import { registry } from "../tools/registry.js";
import { renderMarkdown } from "../ui/render.js";
import { hasMarkdown, ToolCallDelta, ToolCallResult } from "./types.js";

/**
 * Build complete ToolCallResult objects from streaming delta chunks.
 * Deltas for the same tool call (by index) are merged incrementally.
 */
function buildToolCallsFromDelta(deltaToolCalls: ToolCallDelta[]): ToolCallResult[] {
  const acc: Record<number, ToolCallResult> = {};

  for (const tc of deltaToolCalls) {
    if (!acc[tc.index]) {
      acc[tc.index] = { id: "", type: "function", function: { name: "", arguments: "" } };
    }
    if (tc.id) acc[tc.index].id = tc.id;
    if (tc.function?.name) acc[tc.index].function.name += tc.function.name;
    if (tc.function?.arguments) acc[tc.index].function.arguments += tc.function.arguments;
  }

  return Object.values(acc).filter((tc) => tc.id && tc.function.name);
}

export interface StreamResult {
  /** All text content streamed from the model */
  fullContent: string;
  /** Fully assembled tool calls (empty array if no tools were called) */
  toolCalls: ToolCallResult[];
}

/**
 * Stream a chat completion from the OpenAI-compatible API,
 * writing content chunks to stdout in real time and collecting
 * tool call deltas into assembled ToolCallResult objects.
 *
 * If the response has no tool calls and the content contains
 * markdown, renders it to the terminal after streaming completes.
 */
export async function streamResponse(
  client: any,
  model: string,
  messages: any[],
): Promise<StreamResult> {
  const stream = await client.chat.completions.create({
    model,
    messages,
    tools: registry.describe(),
    tool_choice: "auto",
    stream: true,
  });

  let fullContent = "";
  const rawDeltaToolCalls: ToolCallDelta[] = [];

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      process.stdout.write(delta.content);
      fullContent += delta.content;
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        rawDeltaToolCalls.push(tc);
      }
    }
  }

  const toolCalls = buildToolCallsFromDelta(rawDeltaToolCalls);

  // If no tool calls and content has markdown, render it
  if (toolCalls.length === 0) {
    process.stdout.write("\n");
    if (hasMarkdown(fullContent)) {
      process.stdout.write("\n" + renderMarkdown(fullContent) + "\n");
    }
  }

  return { fullContent, toolCalls };
}
