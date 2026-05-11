import { ChatOpenAI } from "@langchain/openai";
export function createNvidiaModel(config) {
    return new ChatOpenAI({
        model: config.model,
        apiKey: config.apiKey,
        configuration: {
            baseURL: config.baseURL,
        },
    });
}
