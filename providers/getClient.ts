import OpenAI from "openai";
import { loadConfig } from "../config/configManager.js";
import { PROVIDER_MAP } from "./providerMap.js";

export function getClient(): { client: OpenAI; model: string; provider: string } {
  const config = loadConfig();
  const provider = PROVIDER_MAP[config.provider];

  let apiKey: string;
  let baseURL: string;
  let model: string;

  if (config.provider === "custom") {
    if (!config.baseURL) throw new Error("Custom provider requires baseURL in config. Run: kairo setup");
    if (!config.model) throw new Error("Custom provider requires model in config. Run: kairo setup");
    apiKey = config.apiKey ?? "custom";
    baseURL = config.baseURL;
    model = config.model;
  } else {
    apiKey = provider.apiKeyEnv ? (process.env[provider.apiKeyEnv] ?? "ollama") : "ollama";
    baseURL = config.baseURL ?? provider.baseURL!;
    model = config.model ?? provider.defaultModel!;
  }

  const client = new OpenAI({ apiKey, baseURL });
  return { client, model, provider: config.provider };
}
