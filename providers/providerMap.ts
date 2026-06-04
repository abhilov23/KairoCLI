export const PROVIDER_MAP = {
  openai: {
    baseURL: "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    defaultModel: "gpt-4o",
  },
  anthropic: {
    baseURL: "https://api.anthropic.com/v1",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    defaultModel: "claude-sonnet-4-5",
  },
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    defaultModel: "llama-3.3-70b-versatile",
  },
  nvidia: {
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKeyEnv: "NVIDIA_API_KEY",
    defaultModel: "meta/llama-3.3-70b-instruct",
  },
  ollama: {
    baseURL: "http://localhost:11434/v1",
    apiKeyEnv: null,
    defaultModel: "llama3.2",
  },
  custom: {
    baseURL: null,
    apiKeyEnv: null,
    defaultModel: null,
  },
} as const;

export type ProviderName = keyof typeof PROVIDER_MAP;
