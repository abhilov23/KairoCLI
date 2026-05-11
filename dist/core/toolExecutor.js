import { toolMap } from "./toolRegistry.js";
export async function invokeToolByName(name, args) {
    const tool = toolMap[name];
    if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
    }
    return tool.invoke(args);
}
