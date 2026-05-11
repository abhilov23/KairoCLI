import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
export const runScriptTool = tool(async ({ script }) => {
    const command = `pnpm ${script}`;
    const { stdout, stderr } = await execAsync(command, {
        shell: "powershell.exe",
    });
    return stdout || stderr;
}, {
    name: "run_script",
    description: `
Run package manager scripts.

Useful for:
- build
- dev
- test
- lint
- start

Examples:
- dev
- build
- test
- lint
`,
    schema: z.object({
        script: z.string().describe("Script to run"),
    }),
});
