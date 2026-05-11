import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
export const changeDirectoryTool = tool(async ({ path: targetPath }) => {
    const resolvedPath = path.resolve(process.cwd(), targetPath);
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
        throw new Error(`${resolvedPath} is not a directory`);
    }
    return resolvedPath;
}, {
    name: "change_directory",
    description: "Change the current working directory.",
    schema: z.object({
        path: z.string().describe("Directory path to change into"),
    }),
});
