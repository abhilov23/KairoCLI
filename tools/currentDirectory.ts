import { z } from "zod";

export const currentDirectory = {
  name: "current_directory",
  description: "Get the current working directory.",
  parameters: z.object({}),
  execute: async () => {
    return process.cwd();
  },
};
