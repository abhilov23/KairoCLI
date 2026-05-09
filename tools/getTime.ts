import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const getTime = tool(
  async () => {
    return new Date().toString();
  },
  {
    name: "get_time",

    description: "Get current system time",

    schema: z.object({}),
  }
);