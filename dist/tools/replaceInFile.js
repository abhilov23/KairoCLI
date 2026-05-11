import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
export const replaceInFileTool = tool(async ({ filePath, search, replace }) => {
    const resolvedPath = path.resolve(filePath);
    // Read existing file
    const fileContent = await fs.readFile(resolvedPath, "utf-8");
    // Check if search text exists
    if (!fileContent.includes(search)) {
        return `
Search text not found in file.

File:
${resolvedPath}
`;
    }
    // Replace only first occurrence
    const updatedContent = fileContent.replace(search, replace);
    // Write updated file
    await fs.writeFile(resolvedPath, updatedContent, "utf-8");
    return `
Successfully updated file:

${resolvedPath}
`;
}, {
    name: "replace_in_file",
    description: `
Replace specific text inside a file.

Useful for:
- refactoring code
- updating configs
- changing variables
- editing small sections safely

Prefer this tool over write_file
when only partial edits are needed.
`,
    schema: z.object({
        filePath: z.string().describe("Path of the file to edit"),
        search: z.string().describe("Exact text to search for"),
        replace: z.string().describe("Replacement text"),
    }),
});
