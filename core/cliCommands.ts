import fs from "fs/promises";
import { loadConfigAsync, getConfigFile } from "../config/configManager.js";
import { PROVIDER_MAP } from "../providers/providerMap.js";
import { registry } from "../tools/registry.js";

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
  ${CLI_NAME} --task <text>   Run a single task non-interactively
`);
}

export function printInteractiveHelp() {
  console.log(`
Interactive Commands:
  /help     Show this help
  /tools    Show available tools
  /login    Login to your account 
  /logout   Clear cached auth session
  /whoami   Show current auth session info
  /clear    Clear chat memory
  clear     Clear terminal screen
  cls       Clear terminal screen
  exit      Exit KairoCLI

Available Tools:
${registry.list().map((name) => `  - ${name}`).join("\n")}
`);
}

export function printCliVersion() {
  const version = process.env.npm_package_version ?? "dev";
  console.log(`kairo ${version}`);
}

export async function runDoctor(): Promise<void> {
  const configPath = getConfigFile();
  const config = await loadConfigAsync();

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

  // Detect old config format (pre-refactor with activeProvider/providers)
  if ((config as any).activeProvider) {
    const oldConfig = config as any;
    const oldProvider = oldConfig.activeProvider;
    const oldProviderConfig = oldConfig.providers?.[oldProvider];
    console.log("- Config format: outdated (v1.x)");        console.log(`- Detected provider: ${oldProvider}`);
        if (oldProviderConfig?.model) console.log(`- Detected model: ${oldProviderConfig.model}`);
        if (oldProviderConfig?.baseURL) console.log(`- Detected base URL: ${oldProviderConfig.baseURL}`);
        console.log(`- Detected API key: ${oldProviderConfig?.apiKey ? "yes (stored in config)" : "no"}`);
    console.log("");
    console.log("  The config file uses the old format from a previous version.");
    console.log("  Run `kairo setup` to re-configure with the new format.");
    return;
  }

  const provider = config.provider;
  if (!provider) {
    console.log("- Active provider: not set");
    console.log("  Run `kairo setup` to configure a provider.");
    return;
  }

  const providerInfo = PROVIDER_MAP[provider];
  if (!providerInfo) {
    console.log(`- Active provider: ${provider} (unknown)`);
    console.log("  Run `kairo setup` to choose a valid provider.");
    return;
  }

  console.log(`- Active provider: ${provider}`);

  if (provider === "custom") {
    if (config.baseURL) {
      try {
        new URL(config.baseURL);
        console.log("  - Base URL: ✓");
      } catch {
        console.log("  - Base URL: ✗ (invalid URL)");
      }
    } else {
      console.log("  - Base URL: ✗ (not set)");
    }

    if (config.apiKey) {
      console.log("  - API Key: ✓");
    } else {
      console.log("  - API Key: ✗ (not set)");
    }

    if (config.model) {
      console.log("  - Model: ✓");
    } else {
      console.log("  - Model: ✗ (not set)");
    }
  } else if (provider === "ollama") {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("http://localhost:11434/api/tags", {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        console.log("  - Ollama endpoint: ✓ (reachable)");
      } else {
        console.log("  - Ollama endpoint: ✗ (returned status " + res.status + ")");
      }
    } catch {
      console.log("  - Ollama endpoint: ✗ (not reachable at http://localhost:11434)");
    }

    if (config.model) {
      console.log(`  - Model: ${config.model}`);
    } else {
      console.log("  - Model: using default (" + providerInfo.defaultModel + ")");
    }
  } else {
    // Standard providers (openai, anthropic, groq, nvidia)
    const envVar = providerInfo.apiKeyEnv;
    if (envVar) {
      const apiKey = process.env[envVar];
      if (apiKey && apiKey.trim().length > 0) {
        console.log(`  - ${envVar}: ✓`);
      } else {
        console.log(`  - ${envVar}: ✗ (not set)`);
      }
    }

    if (config.model) {
      console.log(`  - Model: ${config.model}`);
    } else {
      console.log(`  - Model: using default (${providerInfo.defaultModel})`);
    }
  }
}
