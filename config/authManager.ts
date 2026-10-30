import fs from "fs/promises";
import path from "path";

import { getConfigDir } from "./configManager.js";

const AUTH_FILE = path.join(getConfigDir(), "auth.json");

export type AuthSession = {
  accessToken: string;
  jwtToken?: string;
  userProfile?: unknown;
  deviceCode?: string;
  createdAt: string;
  loginSessionId?: string;
};

export function getAuthFile(): string {
  return AUTH_FILE;
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await fs.writeFile(AUTH_FILE, JSON.stringify(session, null, 2), {
    mode: 0o600,
  });
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  try {
    const raw = await fs.readFile(AUTH_FILE, "utf-8");
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<boolean> {
  try {
    await fs.unlink(AUTH_FILE);
    return true;
  } catch {
    return false;
  }
}
