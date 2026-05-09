import { ChatOpenAI } from '@langchain/openai';
import "dotenv/config";
const model = new ChatOpenAI({
    model: "meta/llama-3.1-70b-instruct",
    apiKey: process.env.NVIDIA_API_KEY,
    configuration: {
        baseURL: "https://integrate.api.nvidia.com/v1",
    },
    streaming: true,
});
const stream = await model.stream("Explain typescript in simple words");
for await (const chunk of stream) {
    process.stdout.write(chunk.content.toString());
}
