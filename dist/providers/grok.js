import { ChatOpenAI } from "@langchain/openai";
export function createGroqModel(config) {
    return new ChatOpenAI({
        model: config.model,
        apiKey: config.apiKey,
        configuration: {
            baseURL: config.baseURL,
        },
    });
}
