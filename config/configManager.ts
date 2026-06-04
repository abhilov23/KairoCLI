import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import type { ProviderName } from "../providers/providerMap.js";

const CONFIG_DIR = path.join(os.homedir(), ".terminal-agent");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getConfigFile(): string {
  return CONFIG_FILE;
}

export type KairoConfig = {
  provider: ProviderName;
  model?: string;
  baseURL?: string;
  apiKey?: string;
};

export async function saveConfigAsync(config: KairoConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Keep sync save for simpler use cases
export function saveConfig(config: KairoConfig): void {
  saveConfigAsync(config).catch((err) => {
    console.error("Failed to save config:", err);
  });
}

// Synchronous version for getClient
export function loadConfig(): KairoConfig {
  try {
    const raw = fsSync.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as KairoConfig;
  } catch {
    throw new Error("No configuration found. Run: kairo setup");
  }
}

// Async version for setup / doctor
export async function loadConfigAsync(): Promise<KairoConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as KairoConfig;
  } catch {
    return null;
  }
}
