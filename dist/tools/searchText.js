import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
async function searchInDirectory(directory, searchText, results = []) {
    const entries = await fs.readdir(directory, {
        withFileTypes: true,
    });
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        // Ignore heavy folders
        if (fullPath.includes("node_modules") ||
            fullPath.includes(".git") ||
            fullPath.includes("dist")) {
            continue;
        }
        if (entry.isDirectory()) {
            await searchInDirectory(fullPath, searchText, results);
        }
        else {
            try {
                const content = await fs.readFile(fullPath, "utf-8");
                const lines = content.split("\n");
                lines.forEach((lineContent, index) => {
                    if (lineContent.toLowerCase().includes(searchText.toLowerCase())) {
                        const start = Math.max(0, index - 1);
                        const end = Math.min(lines.length, index + 2);
                        const context = lines.slice(start, end).join("\n");
                        results.push({
                            file: fullPath,
                            line: index + 1,
                            match: lineContent.trim(),
                            context,
                        });
                    }
                });
            }
            catch {
                // Ignore unreadable files
            }
        }
    }
    return results;
}
export const searchTextTool = tool(async ({ text, directory }) => {
    const targetDir = directory?.trim()
        ? path.resolve(directory)
        : process.cwd();
    const results = await searchInDirectory(targetDir, text);
    if (!results.length) {
        return `
No matches found for:
"${text}"
`;
    }
    return results
        .map((result) => `
FILE:
${result.file}

LINE:
${result.line}

MATCH:
${result.match}

CONTEXT:
${result.context}

------------------------
`)
        .join("\n");
}, {
    name: "search_text",
    description: `
Search recursively for text inside files.

Returns:
- file path
- line number
- matching line
- surrounding context

Useful for:
- finding functions
- tracing variables
- exploring codebases
- locating imports
- debugging
`,
    schema: z.object({
        text: z.string().describe("Text to search for"),
        directory: z.string().optional().describe("Directory to search in"),
    }),
});
