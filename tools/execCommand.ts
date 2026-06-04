import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const executeCommand = {
  name: "execute_command",
  description: `Execute Windows PowerShell terminal commands and return the output as plain text.

Use this tool for:
- listing files and directories
- checking system information
- diagnostics
- reading terminal output
- safe shell operations

Prefer PowerShell-compatible commands.
Avoid bash-only commands unless explicitly requested.`,
  parameters: z.object({
    command: z.string().describe("The PowerShell command to execute"),
  }),
  execute: async ({ command }: { command: string }) => {
    try {
      const { stdout, stderr } = await execAsync(`${command} | Out-String`, {
        shell: "powershell.exe",
      });

      if (stderr && stderr.trim()) {
        return `Error:\n${stderr}`;
      }

      return stdout.trim() || "Command executed successfully.";
    } catch (error: any) {
      return `Command execution failed:\n${error.message}`;
    }
  },
};
