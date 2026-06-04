import { z } from "zod";
import fs from "fs/promises";
import path from "path";

export const writeFile = {
  name: "write_file",
  description: `Create or overwrite files with content.

Useful for:
- creating code files
- editing configs
- generating documentation
- saving outputs`,
  parameters: z.object({
    filePath: z.string().describe("Path of the file to write"),
    content: z.string().describe("Content to write into the file"),
  }),
  execute: async ({ filePath, content }: { filePath: string; content: string }) => {
    const resolvedPath = path.resolve(filePath);
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, content, "utf-8");
    return `File written successfully:\n${resolvedPath}`;
  },
};
