import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
export const gitDiffTool = tool(async ({ file }) => {
    try {
        const command = file?.trim()
            ? `git diff -- ${file}`
            : "git diff";
        const { stdout, stderr, } = await execAsync(command, {
            shell: "powershell.exe",
        });
        return (stdout ||
            stderr ||
            "No git diff found.");
    }
    catch {
        return `
Failed to get git diff.

Make sure:
- git is installed
- current directory is a git repository
`;
    }
}, {
    name: "git_diff",
    description: `
Get git diff for modified files.

Can:
- inspect current code changes
- review modifications
- analyze edits
- inspect a specific file diff

Useful before commits or debugging.
`,
    schema: z.object({
        file: z
            .string()
            .optional()
            .describe("Optional file path to inspect diff for"),
    }),
});
