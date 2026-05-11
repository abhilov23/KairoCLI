import { availableToolNames } from "./toolRegistry.js";
import { printAssistant } from "../ui/ui.js";
export function handleInternalCommand(input, messages) {
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
    // CLEAR SCREEN
    if (input === "clear" || input === "cls") {
        console.clear();
        return true;
    }
    return false;
}
