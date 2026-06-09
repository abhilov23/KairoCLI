import { registry } from "../tools/registry.js";
import { printInteractiveHelp } from "./cliCommands.js";
import type OpenAI from "openai";
import {loginCommand, whoamiCommand, logoutCommand} from "./login.js";


export async function handleInternalCommand(
  input: string,
  messages: OpenAI.ChatCompletionMessageParam[]
): Promise<boolean> {
  // HELP
  if (input === "/help") {
    printInteractiveHelp();
    return true;
  }

  if(input === '/login'){
   await loginCommand();
    return true;
  }

  if(input === '/whoami'){
   await whoamiCommand();
    return true;
  }

  if(input === '/logout'){
   await logoutCommand();
    return true;
  }

  // TOOLS
  if (input === "/tools") {
    console.log("\nAvailable Tools:");
    console.log(registry.list().join("\n"));
    return true;
  }

  // CLEAR
  if (input === "/clear") {
    messages.length = 1; // Keep system prompt
    console.log("\nMemory cleared.\n");
    return true;
  }

  // CLEAR SCREEN
  if (input === "clear" || input === "cls") {
    console.clear();
    return true;
  }

  return false;
}
