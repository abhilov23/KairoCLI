import { z } from "zod";
import fs from "fs/promises";
import path from "path";

export const replaceInFile = {
  name: "replace_in_file",
  description: `Replace specific text inside a file.

Useful for:
- refactoring code
- updating configs
- changing variables
- editing small sections safely

Prefer this tool over write_file when only partial edits are needed.`,
  parameters: z.object({
    filePath: z.string().describe("Path of the file to edit"),
    search: z.string().describe("Exact text to search for"),
    replace: z.string().describe("Replacement text"),
  }),
  execute: async ({ filePath, search, replace }: { filePath: string; search: string; replace: string }) => {
    const resolvedPath = path.resolve(filePath);
    const fileContent = await fs.readFile(resolvedPath, "utf-8");

    if (!fileContent.includes(search)) {
      return `Search text not found in file.\n\nFile:\n${resolvedPath}\n`;
    }

    const updatedContent = fileContent.replace(search, replace);
    await fs.writeFile(resolvedPath, updatedContent, "utf-8");
    return `Successfully updated file:\n\n${resolvedPath}\n`;
  },
};
