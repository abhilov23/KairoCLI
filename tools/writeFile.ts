import { tool } from "@langchain/core/tools";
import { z } from "zod";

import fs from "fs/promises";
import path from "path";

export const writeFileTool = tool(
  async ({ filePath, content }) => {
    const resolvedPath = path.resolve(filePath);

    // Ensure parent directories exist
    await fs.mkdir(
      path.dirname(resolvedPath),
      { recursive: true }
    );

    await fs.writeFile(
      resolvedPath,
      content,
      "utf-8"
    );

    return `File written successfully:\n${resolvedPath}`;
  },

  {
    name: "write_file",

    description: `
Create or overwrite files with content.

Useful for:
- creating code files
- editing configs
- generating documentation
- saving outputs
`,

    schema: z.object({
      filePath: z.string().describe(
        "Path of the file to write"
      ),

      content: z.string().describe(
        "Content to write into the file"
      ),
    }),
  }
);