import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const currentDirectoryTool = tool(
  async () => {
    return process.cwd();
  },
  {
    name: "current_directory",

    description:
      "Get the current working directory.",

    schema: z.object({}),
  }
);