import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const runScript = {
  name: "run_script",
  description: `Run package manager scripts.

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
- lint`,
  parameters: z.object({
    script: z.string().describe("Script to run"),
  }),
  execute: async ({ script }: { script: string }) => {
    const command = `pnpm ${script}`;
    const { stdout, stderr } = await execAsync(command, {
      shell: "powershell.exe",
    });
    return stdout || stderr;
  },
};
