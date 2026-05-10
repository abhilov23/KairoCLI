import promptSync from "prompt-sync";

// Prompts
import systemPrompt from "../prompt/prompt.js";

import {
  isDangerousCommand,
  askConfirmation,
  isProtectedFile,
} from "./safety.js";

import {
  toolMap,
  modelWithTools,
  shouldDisplayRawOutput,
} from "./toolRegistory.js";

import { invokeToolByName } from "./toolExecutor.js";

import { extractInlineToolCall } from "./inlineToolParser.js";

import { handleInternalCommand } from "./commandRouter.js";

// UI
import {
  printBanner,
  printAssistant,
  printTool,
  printError,
} from "../ui/ui.js";

import {
  HumanMessage,
  BaseMessage,
  ToolMessage,
} from "@langchain/core/messages";

const prompt = promptSync();

const messages: BaseMessage[] = [systemPrompt];

export async function startAgent() {
  printBanner();

  while (true) {
    try {
      const input = prompt("You > ");

      if (!input.trim()) {
        continue;
      }

      const handled = handleInternalCommand(input, messages);

      if (handled) {
        continue;
      }

      messages.push(new HumanMessage(input));

      let response = await modelWithTools.invoke(messages);

      while (true) {
        messages.push(response);

        // NO TOOL CALL
        if (!response.tool_calls?.length) {
          const inlineToolCall = extractInlineToolCall(
            response.content.toString()
          );

          // INLINE TOOL CALL
          if (inlineToolCall) {
            const selectedTool =
              toolMap[inlineToolCall.name as keyof typeof toolMap];

            if (selectedTool) {
              printTool(inlineToolCall.name);

              // SAFETY CHECKS
              if (inlineToolCall.name === "execute_command") {
                const command = String(
                  inlineToolCall.parameters.command ?? ""
                );

                const dangerous = isDangerousCommand(command);

                if (dangerous) {
                  const confirmed = askConfirmation(
                    `Dangerous command detected:\n${command}\nContinue?`
                  );

                  if (!confirmed) {
                    printAssistant("Command cancelled.");

                    break;
                  }
                }
              }

              if (
                inlineToolCall.name === "write_file" ||
                inlineToolCall.name === "replace_in_file"
              ) {
                const filePath = String(inlineToolCall.parameters.filePath);

                const protectedFile = isProtectedFile(filePath);

                if (protectedFile) {
                  const confirmed = askConfirmation(
                    `Protected file detected:\n${filePath}\nContinue?`
                  );

                  if (!confirmed) {
                    printAssistant("File operation cancelled.");

                    break;
                  }
                }
              }

              const toolResult = await invokeToolByName(
                inlineToolCall.name as keyof typeof toolMap,
                inlineToolCall.parameters
              );

              if (shouldDisplayRawOutput.includes(inlineToolCall.name)) {
                console.log(toolResult);
              }

              messages.push(
                new ToolMessage({
                  tool_call_id: `inline_${Date.now()}`,

                  content: String(toolResult),
                })
              );

              response = await modelWithTools.invoke(messages);

              continue;
            }
          }

          // FINAL RESPONSE
          printAssistant(response.content.toString());

          break;
        }

        // SINGLE TOOL CALL
        const toolCall = response.tool_calls[0];

        if (!toolCall) {
          break;
        }

        const selectedTool = toolMap[toolCall.name as keyof typeof toolMap];

        if (!selectedTool) {
          break;
        }

        printTool(toolCall.name);

        // SAFETY CHECKS
        if (toolCall.name === "execute_command") {
          const command = String(toolCall.args.command ?? "");

          const dangerous = isDangerousCommand(command);

          if (dangerous) {
            const confirmed = askConfirmation(
              `Dangerous command detected:\n${command}\nContinue?`
            );

            if (!confirmed) {
              printAssistant("Command cancelled.");

              break;
            }
          }
        }

        if (
          toolCall.name === "write_file" ||
          toolCall.name === "replace_in_file"
        ) {
          const filePath = String(toolCall.args.filePath ?? "");

          const protectedFile = isProtectedFile(filePath);

          if (protectedFile) {
            const confirmed = askConfirmation(
              `Protected file detected:\n${filePath}\nContinue?`
            );

            if (!confirmed) {
              printAssistant("File operation cancelled.");

              break;
            }
          }
        }

        const toolResult = await invokeToolByName(
          toolCall.name as keyof typeof toolMap,
          toolCall.args
        );

        if (shouldDisplayRawOutput.includes(toolCall.name)) {
          console.log(toolResult);
        }

        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,

            content: String(toolResult),
          })
        );

        response = await modelWithTools.invoke(messages);
      }
    } catch (error) {
      printError(String(error));
    }
  }
}
