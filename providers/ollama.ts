import { ChatOllama } from "@langchain/ollama";

import {
  ProviderConfig,
} from "../config/configManager.js";

export function createOllamaModel(
  config: ProviderConfig
) {

  return new ChatOllama({

    model:
      config.model,

    baseUrl:
      config.baseURL,
  });
}