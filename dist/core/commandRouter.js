import { registry } from "../tools/registry.js";
import { printInteractiveHelp } from "./cliCommands.js";
export function handleInternalCommand(input, messages) {
    // HELP
    if (input === "/help") {
        printInteractiveHelp();
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
