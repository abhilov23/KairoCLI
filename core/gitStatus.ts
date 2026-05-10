import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const gitStatusTool = tool(

  async () => {

    try {

      const {
        stdout,
        stderr,
      } = await execAsync(
        "git status --short",
        {
          shell: "powershell.exe",
        }
      );

      return (
        stdout ||
        stderr ||
        "Working tree clean."
      );

    } catch (error) {

      return `
Failed to get git status.

Make sure:
- git is installed
- current directory is a git repository
`;
    }
  },

  {
    name: "git_status",

    description: `
Get current git repository status.

Shows:
- modified files
- staged files
- untracked files

Useful for:
- checking changes
- understanding workspace state
- reviewing edits
`,
    
    schema: z.object({}),
  }
);