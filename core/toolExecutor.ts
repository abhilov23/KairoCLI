import { registry } from "../tools/registry.js";
import { ToolCallResult } from "./types.js";
import {
  isDangerousCommand,
  askConfirmation,
  isProtectedFile,
} from "./safety.js";
import chalk from "chalk";
import ora from "ora";

export interface ToolExecutionResult {
  /** Whether execution was cancelled by the user */
  cancelled: boolean;
}

/**
 * Run safety checks on a tool call before execution.
 * Returns false if the user declined to proceed.
 */
async function checkSafety(tc: ToolCallResult): Promise<boolean> {
  if (tc.function.name === "execute_command") {
    const args = JSON.parse(tc.function.arguments);
    const command = String(args.command ?? "");
    if (isDangerousCommand(command)) {
      return await askConfirmation(
        `Dangerous command detected:\n${command}\nContinue?`
      );
    }
  }

  if (tc.function.name === "write_file" || tc.function.name === "replace_in_file") {
    const args = JSON.parse(tc.function.arguments);
    const filePath = String(args.filePath ?? args.path ?? "");
    if (isProtectedFile(filePath)) {
      return await askConfirmation(
        `Protected file detected:\n${filePath}\nContinue?`
      );
    }
  }

  return true;
}

/**
 * Execute a single tool call:
 * 1. Run safety checks (or use custom check callback)
 * 2. Show a spinner while executing
 * 3. Push the result message into the messages array
 *
 * @returns Whether execution was cancelled
 */
export async function executeToolCall(
  tc: ToolCallResult,
  messages: any[],
  safetyCheck?: (tc: ToolCallResult) => Promise<boolean>,
): Promise<ToolExecutionResult> {
  const spinner = ora(`Running ${tc.function.name}...`).start();

  try {
    // Safety check
    const checkFn = safetyCheck ?? checkSafety;
    const proceed = await checkFn(tc);
    if (!proceed) {
      spinner.fail(chalk.red(`${tc.function.name} cancelled`));
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify({ error: "Command cancelled by user" }),
      });
      return { cancelled: true };
    }

    const args = JSON.parse(tc.function.arguments);
    const result = await registry.execute(tc.function.name, args);
    spinner.succeed(chalk.dim(`${tc.function.name} done`));
    messages.push({
      role: "tool",
      tool_call_id: tc.id,
      content: JSON.stringify(result),
    });
    return { cancelled: false };
  } catch (err) {
    spinner.fail(chalk.red(`${tc.function.name} failed`));
    messages.push({
      role: "tool",
      tool_call_id: tc.id,
      content: JSON.stringify({ error: String(err) }),
    });
    return { cancelled: false };
  }
}

/**
 * Execute all tool calls in sequence. If a tool call is cancelled
 * by the user, a cancelled message is pushed and execution continues
 * with the remaining tool calls.
 */
export async function executeToolCalls(
  toolCalls: ToolCallResult[],
  messages: any[],
  safetyCheck?: (tc: ToolCallResult) => Promise<boolean>,
): Promise<void> {
  for (const tc of toolCalls) {
    await executeToolCall(tc, messages, safetyCheck);
    // Continue to next tool call even if this one was cancelled
  }
}
