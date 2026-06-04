import { z } from "zod";
import fs from "fs/promises";

export const readFile = {
  name: "read_file",
  description: "Read the contents of a file.",
  parameters: z.object({
    path: z.string(),
  }),
  execute: async ({ path }: { path: string }) => {
    try {
      const content = await fs.readFile(path, "utf-8");
      return content;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown read error";
      return `Failed to read file "${path}": ${message}`;
    }
  },
};
