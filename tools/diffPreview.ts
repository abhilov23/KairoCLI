import { z } from "zod";
import fs from "fs/promises";
import { createPatch } from "diff";

async function buildDiffPreview(filePath: string, newContent: string): Promise<string> {
  let oldContent = "";
  try {
    oldContent = await fs.readFile(filePath, "utf-8");
  } catch {
    oldContent = "";
  }

  const patch = createPatch(filePath, oldContent, newContent, "before", "after");
  return patch;
}

export const diffPreview = {
  name: "diff_preview",
  description: "Generate a unified diff preview between existing file content and proposed new content.",
  parameters: z.object({
    filePath: z.string().describe("Target file path"),
    newContent: z.string().describe("Proposed full file content for preview"),
  }),
  execute: async ({ filePath, newContent }: { filePath: string; newContent: string }) => {
    const patch = await buildDiffPreview(filePath, newContent);
    return patch || "No diff generated.";
  },
};
