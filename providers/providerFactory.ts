import {
  loadConfig,
} from "../config/configManager.js";

import {
  createNvidiaModel,
} from "./nvidia.js";

import {
  createOpenAIModel,
} from "./openai.js";

import {
  createAnthropicModel, } from "./antrophic.js";

import {
  createOllamaModel,
} from "./ollama.js";

import { createGroqModel, } from "./grok.js";

export async function getModel() {

  const config =
    await loadConfig();

  if (!config) {

    throw new Error(
      "No configuration found.\nRun: kairo setup"
    );
  }

  const provider =
    config.activeProvider;

  const providerConfig =
    config.providers[
      provider
    ];

  if (!providerConfig) {

    throw new Error(
      `Missing config for provider: ${provider}`
    );
  }

  switch(provider) {

    case "nvidia":

      return createNvidiaModel(
        providerConfig
      );

    case "openai":

      return createOpenAIModel(
        providerConfig
      );

    case "anthropic":

      return createAnthropicModel(
        providerConfig
      );

    case "ollama":

      return createOllamaModel(
        providerConfig
      );

    case "groq":

      return createGroqModel(
        providerConfig
      );

    default:

      throw new Error(
        `Unsupported provider: ${provider}`
      );
  }
}
