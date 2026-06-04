import { saveConfig, loadConfigAsync } from "./configManager.js";
import { getUserInput } from "../ui/ui.js";
import type { ProviderName } from "../providers/providerMap.js";

const PROVIDER_CHOICES: { key: string; name: ProviderName; label: string }[] = [
  { key: "1", name: "openai", label: "OpenAI" },
  { key: "2", name: "anthropic", label: "Anthropic" },
  { key: "3", name: "groq", label: "Groq" },
  { key: "4", name: "nvidia", label: "NVIDIA" },
  { key: "5", name: "ollama", label: "Ollama" },
  { key: "6", name: "custom", label: "Custom" },
];

export async function runSetup() {
  console.log("\nKairoCLI Setup\n");

  const existingConfig = await loadConfigAsync();

  // Provider selection
  console.log("Select Provider:\n");
  for (const c of PROVIDER_CHOICES) {
    const marker = existingConfig?.provider === c.name ? " (current)" : "";
    console.log(`  ${c.key}. ${c.label}${marker}`);
  }
  console.log("");

  const providerChoice = await getUserInput("Choice: ");
  const entry = PROVIDER_CHOICES.find((c) => c.key === providerChoice);
  if (!entry) {
    console.log("\nInvalid provider.\n");
    return;
  }

  const provider: ProviderName = entry.name;
  const isCustom = provider === "custom";

  let baseURL: string | undefined;
  let apiKey: string | undefined;
  let model: string | undefined;

  if (isCustom) {
    // For custom provider, prompt for all three fields
    baseURL = await getUserInput(
      `Enter your API base URL (e.g. https://api.linkapi.ai/v1)${existingConfig?.baseURL ? ` [${existingConfig.baseURL}]` : ""}: `
    );
    if (!baseURL.trim() && existingConfig?.baseURL) {
      baseURL = existingConfig.baseURL;
    }

    apiKey = await getUserInput(
      `Enter your API key${existingConfig?.apiKey ? " [stored]" : ""}: `
    );
    if (!apiKey.trim() && existingConfig?.apiKey) {
      apiKey = existingConfig.apiKey;
    }

    model = await getUserInput(
      `Enter the model name (e.g. gpt-4o)${existingConfig?.model ? ` [${existingConfig.model}]` : ""}: `
    );
    if (!model.trim() && existingConfig?.model) {
      model = existingConfig.model;
    }
  } else {
    // For standard providers, just prompt for model
    model = await getUserInput(
      `Enter model name${existingConfig?.model ? ` [${existingConfig.model}]` : ""}: `
    );
    if (!model.trim() && existingConfig?.model) {
      model = existingConfig.model;
    }

    // Optional base URL override
    const useCustomBaseURL = await getUserInput("Custom Base URL? (y/n): ");
    if (useCustomBaseURL.toLowerCase() === "y") {
      baseURL = await getUserInput(
        `Enter Base URL${existingConfig?.baseURL ? ` [${existingConfig.baseURL}]` : ""}: `
      );
      if (!baseURL.trim() && existingConfig?.baseURL) {
        baseURL = existingConfig.baseURL;
      }
    }
  }

  const config = {
    provider,
    ...(model ? { model } : {}),
    ...(baseURL ? { baseURL } : {}),
    ...(apiKey ? { apiKey } : {}),
  };

  saveConfig(config);

  console.log(`\nConfiguration saved successfully.\n`);
  console.log(`Provider: ${provider}`);
  if (model) console.log(`Model: ${model}`);
  if (baseURL) console.log(`Base URL: ${baseURL}`);
  console.log("");
}
