import { getClient } from "../providers/getClient.js";
import { streamResponse } from "./streamHandler.js";
import { executeToolCalls } from "./toolExecutor.js";
import { handleInternalCommand } from "./commandRouter.js";
import systemPrompt from "../prompt/prompt.js";
import { getUserInput, printBanner, printSuccess, } from "../ui/ui.js";
import { loadSessionMessages, loadSessionState, saveSessionMessages, } from "../runtime/sessionManager.js";
// ─── Shared agent loop ───────────────────────────────────────────
async function agentLoop(client, model, messages, safetyCheck) {
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
    const messages = [{ role: "system", content: systemPrompt }];
    const session = await loadSessionState();
    const restoredMessages = await loadSessionMessages();
    if (restoredMessages.length) {
        messages.push(...restoredMessages);
    }
    let turnCount = session.execution.turnCount ?? 0;
    let lastToolName = session.execution.lastToolName ?? null;
    printBanner();
    printSuccess("Type /help for commands. Type exit to quit.");
    while (true) {
        const promptLabel = `You (${process.cwd()}) > `;
        const userInput = await getUserInput(promptLabel);
        if (!userInput.trim())
            continue;
        if (userInput.trim() === "exit") {
            await saveSessionMessages(messages, {
                execution: { turnCount, lastToolName, lastError: null, lastUpdatedAt: new Date().toISOString() },
                workspace: { cwd: process.cwd(), lastUpdatedAt: new Date().toISOString() },
            });
            break;
        }
        if (userInput.startsWith("/") || userInput === "clear" || userInput === "cls") {
            handleInternalCommand(userInput.trim(), messages);
            if (userInput === "/clear")
                messages.length = 1;
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
export async function runTask(task) {
    const { client, model } = getClient();
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: task },
    ];
    await agentLoop(client, model, messages);
}
