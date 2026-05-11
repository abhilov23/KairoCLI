import { ChatOllama } from "@langchain/ollama";
export function createOllamaModel(config) {
    return new ChatOllama({
        model: config.model,
        baseUrl: config.baseURL,
    });
}
