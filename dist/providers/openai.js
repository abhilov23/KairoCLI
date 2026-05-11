import { ChatOpenAI } from "@langchain/openai";
export function createOpenAIModel(config) {
    return new ChatOpenAI({
        model: config.model,
        apiKey: config.apiKey,
    });
}
