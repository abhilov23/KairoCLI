import { ChatAnthropic } from "@langchain/anthropic";
export function createAnthropicModel(config) {
    return new ChatAnthropic({
        model: config.model,
        apiKey: config.apiKey,
    });
}
