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
  shouldDisplayRawOutput,
  tools
} from "./toolRegistry.js";

import { invokeToolByName } from "./toolExecutor.js";

import { extractInlineToolCall } from "./inlineToolParser.js";

import { handleInternalCommand } from "./commandRouter.js";

import {
  loadSessionMessages,
  loadSessionState,
  saveSessionMessages,
} from "../runtime/sessionManager.js";


import { getModel } from "../providers/providerFactory.js";



// UI
import {
  printBanner,
  printAssistant,
  printTool,
  printError,
  printSuccess,
} from "../ui/ui.js";

import {
  HumanMessage,
  BaseMessage,
  ToolMessage,
} from "@langchain/core/messages";

const prompt = promptSync();

async function persistMemory(
  messages: BaseMessage[],
  turnCount: number,
  lastToolName: string | null = null,
  lastError: string | null = null
) {
  await saveSessionMessages(messages, {
    execution: {
      turnCount,
      lastToolName,
      lastError,
      lastUpdatedAt: new Date().toISOString(),
    },
    workspace: {
      cwd: process.cwd(),
      lastUpdatedAt: new Date().toISOString(),
    },
  });
}


async function streamAssistantResponse(
  modelWithTools: any,
  history: BaseMessage[],
  render = false
) {
  const stream = await modelWithTools.stream(history);
  let mergedChunk: any = null;
  let printedPrefix = false;

  for await (const chunk of stream) {
    mergedChunk = mergedChunk ? mergedChunk.concat(chunk) : chunk;

    const piece =
      typeof chunk.content === "string"
        ? chunk.content
        : Array.isArray(chunk.content)
          ? chunk.content
              .map((part: unknown) =>
                typeof part === "string"
                  ? part
                  : typeof part === "object" &&
                      part !== null &&
                      "text" in part &&
                      typeof (part as { text?: unknown }).text === "string"
                    ? (part as { text: string }).text
                    : ""
              )
              .join("")
          : "";

    if (render && piece) {
      if (!printedPrefix) {
        process.stdout.write("\nAI > ");
        printedPrefix = true;
      }
      process.stdout.write(piece);
    }
  }

  if (render && printedPrefix) {
    process.stdout.write("\n");
  }

  return {
    response: mergedChunk,
    didStreamPrint: printedPrefix,
  };
}

export async function startAgent() {
  
  const model = await getModel();
  const modelWithTools = model.bindTools(tools);

  printBanner();
  printSuccess("Type /help for commands. Type exit to quit.");
   
  const session = await loadSessionState();
  const restoredMessages = await loadSessionMessages();

  const messages: BaseMessage[] =
  restoredMessages.length
    ? restoredMessages
    : [systemPrompt];

  let turnCount = session.execution.turnCount ?? 0;
  let lastToolName: string | null = session.execution.lastToolName ?? null;





  while (true) {
    try {
      const promptLabel = `You (${process.cwd()}) > `;
      const input = prompt(promptLabel);

      if (!input.trim()) {
        continue;
      }

      if (input === "exit") {
        await persistMemory(messages, turnCount, lastToolName);
        break;
      }

      const handled = handleInternalCommand(input, messages);

      if (handled) {
        await persistMemory(messages, turnCount, lastToolName);
        continue;
      }

      messages.push(new HumanMessage(input));
      turnCount += 1;

      let {
        response,
        didStreamPrint,
      } = await streamAssistantResponse(modelWithTools, messages);

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
                    await persistMemory(messages, turnCount, lastToolName);

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
                    await persistMemory(messages, turnCount, lastToolName);

                    break;
                  }
                }
              }

              const toolResult = await invokeToolByName(
                inlineToolCall.name as keyof typeof toolMap,
                inlineToolCall.parameters
              );
              lastToolName = inlineToolCall.name;

              if (
                (shouldDisplayRawOutput as readonly string[]).includes(
                  inlineToolCall.name
                )
              ) {
                console.log(toolResult);
              }

              messages.push(
                new ToolMessage({
                  tool_call_id: `inline_${Date.now()}`,

                  content: String(toolResult),
                })
              );

              ({
                response,
                didStreamPrint,
              } = await streamAssistantResponse(modelWithTools, messages));

              continue;
            }
          }

          // FINAL RESPONSE
          if (
            !didStreamPrint &&
            response.content?.toString().trim()
          ) {
            printAssistant(response.content.toString());
          }

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
              await persistMemory(messages, turnCount, lastToolName);

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
              await persistMemory(messages, turnCount, lastToolName);

              break;
            }
          }
        }

        const toolResult = await invokeToolByName(
          toolCall.name as keyof typeof toolMap,
          toolCall.args
        );
        lastToolName = toolCall.name;

        if (
          (shouldDisplayRawOutput as readonly string[]).includes(
            toolCall.name
          )
        ) {
          console.log(toolResult);
        }

        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,

            content: String(toolResult),
          })
        );

        ({
          response,
          didStreamPrint,
        } = await streamAssistantResponse(modelWithTools, messages));
      }

      await persistMemory(messages, turnCount, lastToolName);
    } catch (error) {
      await persistMemory(messages, turnCount, lastToolName, String(error));
      printError(String(error));
    }
  }
}
