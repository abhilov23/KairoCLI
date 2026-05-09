import { tool } from "@langchain/core/tools";
import { z } from "zod";

import fs from "fs/promises";
import path from "path";
import process from "process";

async function searchInDirectory(
  directory: string,
  searchText: string,
  results: string[] = []
): Promise<string[]> {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });

  const ignoredDirectories = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".cache",
  ];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    // Skip ignored directories
    if (
      ignoredDirectories.some((dir) =>
        fullPath.includes(dir)
      )
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      await searchInDirectory(
        fullPath,
        searchText,
        results
      );
    } else {
      try {
        const content = await fs.readFile(
          fullPath,
          "utf-8"
        );

        if (
          content
            .toLowerCase()
            .includes(searchText.toLowerCase())
        ) {
          results.push(fullPath);
        }
      } catch {
        // Ignore unreadable/binary files
      }
    }
  }

  return results;
}

export const searchTextTool = tool(
  async ({ text, directory }) => {
    const normalizedDirectory =
      directory?.trim().toLowerCase();

    const targetDir =
      !normalizedDirectory ||
      normalizedDirectory ===
        "current_directory" ||
      normalizedDirectory === "." ||
      normalizedDirectory === "./"
        ? process.cwd()
        : directory!;

    const results =
      await searchInDirectory(
        targetDir,
        text
      );

    if (!results.length) {
      return `No files found containing "${text}"`;
    }

    return results.join("\n");
  },

  {
    name: "search_text",

    description: `
Search for text recursively inside files.

Useful for:
- finding function usage
- locating variables
- searching codebases
- exploring projects
`,

    schema: z.object({
      text: z.string().describe(
        "Text to search for"
      ),

      directory: z
        .string()
        .optional()
        .describe(
          "Directory to search in"
        ),
    }),
  }
);
``