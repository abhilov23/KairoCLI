import { ChatAnthropic } from "@langchain/anthropic";

import {
  ProviderConfig,
} from "../config/configManager.js";

export function createAnthropicModel(
  config: ProviderConfig
) {

  return new ChatAnthropic({

    model:
      config.model,

    apiKey:
      config.apiKey,
  });
}