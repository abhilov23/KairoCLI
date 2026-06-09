import { loadAuthSession } from "../config/authManager.js";
import { getClient } from "../providers/getClient.js";
import process from "process";

const SYNC_API = "http://localhost:3000/api/sessions";

export type SyncSessionData = {
  provider: string;
  model: string;
  tokenCount: number;
  title: string;
  workspace?: string;
};

export async function syncSession(data: SyncSessionData, timeoutMs?: number): Promise<boolean> {
  const authSession = await loadAuthSession();
  if (!authSession?.jwtToken) {
    return false; // Not authenticated for API calls
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? 10_000);

  try {
    const response = await fetch(SYNC_API, {
      signal: controller.signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authSession.jwtToken}`,
      },
      body: JSON.stringify({
        provider: data.provider,
        model: data.model,
        tokenCount: data.tokenCount,
        title: data.title,
        workspace: data.workspace ?? process.cwd(),
        createdAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.warn(
        `⚠️  Failed to sync session: ${response.status}${body.error ? ` — ${body.error}` : ""}`,
      );
      return false;
    }

    return true;
  } catch {
    // Network error or timeout — silently skip, not critical
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
