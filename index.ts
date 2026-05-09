import "dotenv/config";
import promptSync from "prompt-sync";

import model from "./model/model.js";

// Prompts
import systemPrompt from "./prompt/prompt.js";

// Tools
import { getTime } from "./tools/getTime.js";
import { executeCommandTool } from "./tools/execCommand.js";
import { currentDirectoryTool } from "./tools/currentDirectory.js";
import { listDirectoryTool } from "./tools/listDirectory.js";
import { readFileTool } from "./tools/readFile.js";
import { searchTextTool } from "./tools/searchText.js";
import { changeDirectoryTool } from "./tools/changeDirectory.js";

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

const modelWithTools = model.bindTools([
  getTime,
  executeCommandTool,
  currentDirectoryTool,
  listDirectoryTool,
  readFileTool,
  searchTextTool,
  changeDirectoryTool,
]);

const availableToolNames = [
  "get_time",
  "execute_command",
  "current_directory",
  "list_directory",
  "read_file",
  "search_text",
  "change_directory",
];

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

let currentWorkingDirectory = process.cwd();


const toolMap = {
  get_time: getTime,
  execute_command: executeCommandTool,
  current_directory: currentDirectoryTool,
  list_directory: listDirectoryTool,
  read_file: readFileTool,
  search_text: searchTextTool,
  change_directory: changeDirectoryTool,
};

printBanner();

async function main() {
  while (true) {
    try {
      const input = prompt("You > ");

      if (!input.trim()) continue;

      if (input === "exit") break;

      if (input === "/tools" || isToolListQuestion(input)) {
        console.log("\nAvailable Tools:");
        console.log(availableToolNames.join("\n"));
        continue;
      }

      if (input === "/clear") {
        messages.length = 1;

        printAssistant("Memory cleared.");

        continue;
      }

      messages.push(new HumanMessage(input));

      const response = await modelWithTools.invoke(messages);

      messages.push(response);

      // IF NO TOOL CALLS THEN
      if (!response.tool_calls?.length) {
        printAssistant(response.content.toString());

        continue;
      }

      // IF TOOL CALL then HANDLE TOOL CALLS
      for (const toolCall of response.tool_calls) {
        const selectedTool =
          toolMap[
            toolCall.name as keyof typeof toolMap
          ];

        if (!selectedTool) continue;

        printTool(toolCall.name);

        const toolResult = await selectedTool.invoke(
          toolCall.args
        );

        if (toolCall.name === "change_directory") {
         currentWorkingDirectory = toolResult;

           printAssistant(
            `Changed directory to:\n${currentWorkingDirectory}`
           );
             continue;
        }

        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,
            content: String(toolResult),
          })
        );
      }

      // FINAL RESPONSE AFTER TOOL EXECUTION
      const finalResponse =
        await modelWithTools.invoke(messages);

      printAssistant(
        finalResponse.content.toString()
      );

      messages.push(finalResponse);
    } catch (error) {
      printError(String(error));
    }
  }
}

main();