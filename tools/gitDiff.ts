import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const gitDiff = {
  name: "git_diff",
  description: `Get git diff for modified files.

Can:
- inspect current code changes
- review modifications
- analyze edits
- inspect a specific file diff

Useful before commits or debugging.`,
  parameters: z.object({
    file: z.string().optional().describe("Optional file path to inspect diff for"),
  }),
  execute: async ({ file }: { file?: string }) => {
    try {
      const command = file?.trim() ? `git diff -- ${file}` : "git diff";
      const { stdout, stderr } = await execAsync(command, {
        shell: "powershell.exe",
      });
      return stdout || stderr || "No git diff found.";
    } catch {
      return `Failed to get git diff.\n\nMake sure:\n- git is installed\n- current directory is a git repository\n`;
    }
  },
};
