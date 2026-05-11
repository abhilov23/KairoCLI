import fs from "fs/promises";

import { loadConfig, getConfigFile } from "../config/configManager.js";
import { availableToolNames } from "./toolRegistry.js";

const CLI_NAME = "kairo";

export function printCliHelp() {
  console.log(`
KairoCLI

Usage:
  ${CLI_NAME}                 Start interactive assistant
  ${CLI_NAME} setup           Configure provider and model
  ${CLI_NAME} doctor          Check CLI configuration health
  ${CLI_NAME} help            Show this help
  ${CLI_NAME} version         Show CLI version
`);
}

export function printInteractiveHelp() {
  console.log(`
Interactive Commands:
  /help     Show this help
  /tools    Show available tools
  /clear    Clear chat memory
  clear     Clear terminal screen
  cls       Clear terminal screen
  exit      Exit KairoCLI

Available Tools:
${availableToolNames.map((name) => `  - ${name}`).join("\n")}
`);
}

export function printCliVersion() {
  const version = process.env.npm_package_version ?? "dev";
  console.log(`kairo ${version}`);
}

export async function runDoctor(): Promise<void> {
  const configPath = getConfigFile();
  const config = await loadConfig();

  console.log("KairoCLI Doctor\n");
  console.log(`- Node version: ${process.version}`);
  console.log(`- Platform: ${process.platform}`);
  console.log(`- Config path: ${configPath}`);

  try {
    await fs.access(configPath);
    console.log("- Config file: found");
  } catch {
    console.log("- Config file: missing (run `kairo setup`)");
  }

  if (!config) {
    console.log("- Active provider: not configured");
    return;
  }

  const activeProvider = config.activeProvider;
  const providerConfig = config.providers[activeProvider];
  const hasApiKey = Boolean(providerConfig?.apiKey);
  const hasModel = Boolean(providerConfig?.model);

  console.log(`- Active provider: ${activeProvider}`);
  console.log(`- Model configured: ${hasModel ? "yes" : "no"}`);
  console.log(`- API key configured: ${hasApiKey ? "yes" : "no"}`);
}
