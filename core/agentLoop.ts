import { getClient } from "../providers/getClient.js";
import { streamResponse } from "./streamHandler.js";
import { executeToolCalls } from "./toolExecutor.js";
import { ToolCallResult } from "./types.js";
import { handleInternalCommand } from "./commandRouter.js";
import systemPrompt from "../prompt/prompt.js";
import { loadAuthSession } from "../config/authManager.js";
import { syncSession } from "./syncSessions.js";
import {
  getUserInput,
  printBanner,
  printSuccess,
} from "../ui/ui.js";
import {
  loadSessionMessages,
  loadSessionState,
  saveSessionMessages,
} from "../runtime/sessionManager.js";

// ─── Auth context injection ──────────────────────────────────────

async function enrichPromptWithAuth(basePrompt: string): Promise<string> {
  const authSession = await loadAuthSession();
  if (!authSession?.userProfile) return basePrompt;

  const profile = authSession.userProfile as Record<string, unknown>;
  const name = profile.name || profile.displayName || profile.username || "";
  const email = profile.email || "";

  if (!name && !email) return basePrompt;

  return (
    basePrompt +
    `\n\nAuthentication Context:\n` +
    `- User: ${name || "Unknown"}${email ? ` (${email})` : ""}\n` +
    `- Authenticated since: ${new Date(authSession.createdAt).toLocaleString()}\n`
  );
}

// ─── Shared agent loop ───────────────────────────────────────────

async function agentLoop(
  client: any,
  model: string,
  messages: any[],
  safetyCheck?: (tc: ToolCallResult) => Promise<boolean>,
): Promise<void> {
  while (true) {
    const { fullContent, toolCalls } = await streamResponse(client, model, messages);

    // Push assistant response into messages
    messages.push({
      role: "assistant",
      content: fullContent || null,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
    });

    if (toolCalls.length === 0) {
      return; // Normal text response — done
    }

    await executeToolCalls(toolCalls, messages, safetyCheck);
  }
}

// ─── Interactive session ─────────────────────────────────────────

export async function startAgent() {
  const { client, model } = getClient();

  const enrichedPrompt = await enrichPromptWithAuth(systemPrompt);
  const messages: any[] = [{ role: "system", content: enrichedPrompt }];

  const session = await loadSessionState();
  const restoredMessages = await loadSessionMessages();

  if (restoredMessages.length) {
    messages.push(...restoredMessages);
  }

  let turnCount = session.execution.turnCount ?? 0;
  let lastToolName: string | null = session.execution.lastToolName ?? null;

  printBanner();
  printSuccess("Type /help for commands. Type exit to quit.");

  while (true) {
    const promptLabel = `You (${process.cwd()}) > `;
    const userInput = await getUserInput(promptLabel);

    if (!userInput.trim()) continue;

    if (userInput.trim() === "exit") {
      await saveSessionMessages(messages, {
        execution: { turnCount, lastToolName, lastError: null, lastUpdatedAt: new Date().toISOString() },
        workspace: { cwd: process.cwd(), lastUpdatedAt: new Date().toISOString() },
      });

      // Push session data to website for dashboard
      const config = getClient();
      const firstUserMsg = messages.find((m: any) => m.role === "user");
      const title = firstUserMsg?.content?.substring(0, 80) || "Kairo Session";
      await syncSession({
        provider: config.provider,
        model: config.model,
        tokenCount: 0,
        title,
        workspace: process.cwd(),
      }, 5_000);

      break;
    }

    if (userInput.startsWith("/") || userInput === "clear" || userInput === "cls") {
      await handleInternalCommand(userInput.trim(), messages);
      if (userInput === "/clear") messages.length = 1;
      continue;
    }

    messages.push({ role: "user", content: userInput });
    turnCount += 1;

    await agentLoop(client, model, messages);

    await saveSessionMessages(messages, {
      execution: { turnCount, lastToolName, lastError: null, lastUpdatedAt: new Date().toISOString() },
      workspace: { cwd: process.cwd(), lastUpdatedAt: new Date().toISOString() },
    });
  }
}

// ─── Single-task (non‑interactive) mode ──────────────────────────

export async function runTask(task: string) {
  const { client, model } = getClient();
  const enrichedPrompt = await enrichPromptWithAuth(systemPrompt);
  const messages: any[] = [
    { role: "system", content: enrichedPrompt },
    { role: "user", content: task },
  ];

  await agentLoop(client, model, messages);
}
