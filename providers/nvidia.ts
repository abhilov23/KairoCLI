import { ChatOpenAI }
from "@langchain/openai";

import {
  ProviderConfig,
} from "../config/configManager.js";

export function createNvidiaModel(
  config: ProviderConfig
) {

  return new ChatOpenAI({

    model:
      config.model,

    apiKey:
      config.apiKey,

    configuration: {
      baseURL:
        config.baseURL,
    },
  });
}