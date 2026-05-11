import { availableToolNames } from "./toolRegistry.js";

import { printAssistant } from "../ui/ui.js";

import { BaseMessage } from "@langchain/core/messages";

export function handleInternalCommand(
  input: string,
  messages: BaseMessage[]
): boolean {
  // TOOLS
  if (input === "/tools") {
    console.log("\nAvailable Tools:");

    console.log(availableToolNames.join("\n"));

    return true;
  }

  // CLEAR
  if (input === "/clear") {
    messages.length = 1;

    printAssistant("Memory cleared.");

    return true;
  }

  return false;
}
