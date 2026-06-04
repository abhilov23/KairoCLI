import { z } from "zod";

export const getTime = {
  name: "get_time",
  description: "Get current system time",
  parameters: z.object({}),
  execute: async (_args: Record<string, never>) => {
    return new Date().toString();
  },
};
