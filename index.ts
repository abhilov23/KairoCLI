import "dotenv/config";
import promptSync from "prompt-sync";

import model from "./model/model.js";

// Prompts
import systemPrompt from "./prompt/prompt.js";

import {
  toolMap,
  availableToolNames,
  modelWithTools,
  shouldDisplayRawOutput
} from "./core/toolRegistory.js";


// UI
import {
  printBanner,
  printAssistant,
  printTool,
  printError,
} from "./ui/ui.js";

import {
  HumanMessage,
  BaseMessage,
  ToolMessage,
} from "@langchain/core/messages";

const prompt = promptSync();




function isToolListQuestion(input: string) {
  const normalized = input.toLowerCase();

  return (
    normalized.includes("tools available") ||
    normalized.includes("available tools") ||
    normalized.includes("what tools") ||
    normalized.includes("which tools") ||
    normalized.includes("tool names")
  );
}

const messages: BaseMessage[] = [systemPrompt];


async function invokeToolByName(
  name: keyof typeof toolMap,
  args: unknown
) {
  const tool = toolMap[name];

  if (!tool) {
    throw new Error(
      `Unknown tool: ${name}`
    );
  }

  return tool.invoke(args as never);
}

function extractInlineToolCall(raw: string): {
  name: string;
  parameters: Record<string, unknown>;
} | null {
  const text = raw.trim();

  if (
    !text.startsWith("{") ||
    !text.endsWith("}")
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(text) as {
      name?: string;
      parameters?: Record<
        string,
        unknown
      >;
    };

    if (
      !parsed.name ||
      !parsed.parameters
    ) {
      return null;
    }

    return {
      name: parsed.name,
      parameters: parsed.parameters,
    };
  } catch {
    return null;
  }
}

printBanner();

async function main() {
  while (true) {
    try {
      const input = prompt("You > ");

      if (!input.trim()) {
        continue;
      }

      // EXIT
      if (input === "exit") {
        break;
      }

      // SHOW TOOLS
      if (
        input === "/tools" ||
        isToolListQuestion(input)
      ) {
        console.log(
          "\nAvailable Tools:"
        );

        console.log(
          availableToolNames.join("\n")
        );

        continue;
      }

      // CLEAR MEMORY
      if (input === "/clear") {
        messages.length = 1;

        printAssistant(
          "Memory cleared."
        );

        continue;
      }

      messages.push(
        new HumanMessage(input)
      );

      let response =
        await modelWithTools.invoke(
          messages
        );

      while (true) {
        messages.push(response);

        // NO TOOL CALL
        if (
          !response.tool_calls?.length
        ) {
          const inlineToolCall =
            extractInlineToolCall(
              response.content.toString()
            );

          // INLINE TOOL CALL
          if (inlineToolCall) {
            const selectedTool =
              toolMap[
                inlineToolCall.name as keyof typeof toolMap
              ];

            if (selectedTool) {
              printTool(
                inlineToolCall.name
              );

              const toolResult =
                await invokeToolByName(
                  inlineToolCall.name as keyof typeof toolMap,
                  inlineToolCall.parameters
                );

              if (
                shouldDisplayRawOutput.includes(
                  inlineToolCall.name
                )
              ) {
                console.log(
                  toolResult
                );
              }

              messages.push(
                new ToolMessage({
                  tool_call_id:
                    `inline_${Date.now()}`,

                  content:
                    String(toolResult),
                })
              );

              response =
                await modelWithTools.invoke(
                  messages
                );

              continue;
            }
          }

          // FINAL RESPONSE
          printAssistant(
            response.content.toString()
          );

          break;
        }

        // SINGLE TOOL CALL
        const toolCall =
          response.tool_calls[0];

        if (!toolCall) {
          break;
        }

        const selectedTool =
          toolMap[
            toolCall.name as keyof typeof toolMap
          ];

        if (!selectedTool) {
          break;
        }

        printTool(toolCall.name);

        const toolResult =
          await invokeToolByName(
            toolCall.name as keyof typeof toolMap,
            toolCall.args
          );

        if (
          shouldDisplayRawOutput.includes(
            toolCall.name
          )
        ) {
          console.log(toolResult);
        }

        messages.push(
          new ToolMessage({
            tool_call_id:
              toolCall.id!,

            content:
              String(toolResult),
          })
        );

        response =
          await modelWithTools.invoke(
            messages
          );
      }
    } catch (error) {
      printError(String(error));
    }
  }
}

main();