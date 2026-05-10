import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs/promises";

import {
  createPatch,
} from "diff";

export async function buildDiffPreview(
  filePath: string,
  newContent: string
): Promise<string> {

  let oldContent = "";

  try {

    oldContent =
      await fs.readFile(
        filePath,
        "utf-8"
      );

  } catch {

    oldContent = "";

  }

  const patch =
    createPatch(
      filePath,
      oldContent,
      newContent,
      "before",
      "after"
    );

  return patch;
}

export const diffPreviewTool = tool(
  async ({ filePath, newContent }) => {
    const patch = await buildDiffPreview(filePath, newContent);
    return patch || "No diff generated.";
  },
  {
    name: "diff_preview",
    description:
      "Generate a unified diff preview between existing file content and proposed new content.",
    schema: z.object({
      filePath: z.string().describe("Target file path"),
      newContent: z
        .string()
        .describe("Proposed full file content for preview"),
    }),
  }
);
