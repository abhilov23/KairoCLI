import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
export const listDirectoryTool = tool(async ({ directory }) => {
    try {
        const targetDir = directory || process.cwd();
        const files = await fs.readdir(targetDir);
        const detailedFiles = await Promise.all(files.map(async (file) => {
            const fullPath = path.join(targetDir, file);
            const stats = await fs.stat(fullPath);
            return {
                name: file,
                type: stats.isDirectory() ? "directory" : "file",
            };
        }));
        return JSON.stringify(detailedFiles, null, 2);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown directory error";
        return `Failed to list directory "${directory || process.cwd()}": ${message}`;
    }
}, {
    name: "list_directory",
    description: "List files and folders in a directory.",
    schema: z.object({
        directory: z.string().optional(),
    }),
});
