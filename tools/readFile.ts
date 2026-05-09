import { tool } from "@langchain/core/tools";
import { z } from "zod";

import fs from "fs/promises";

export const readFileTool = tool(
  async ({ path }) => {
    try {
      const content = await fs.readFile(path, "utf-8");
      return content;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown read error";
      return `Failed to read file "${path}": ${message}`;
    }
  },

  {
    name: "read_file",

    description:
      "Read the contents of a file.",

    schema: z.object({
      path: z.string(),
    }),
  }
);
