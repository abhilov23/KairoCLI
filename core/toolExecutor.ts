import { toolMap } from "./toolRegistry.js";

export async function invokeToolByName(
  name: keyof typeof toolMap,
  args: unknown
) {
  const tool = toolMap[name];

  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  return tool.invoke(args as never);
}
