import { ChatOpenAI } from "@langchain/openai";


const model = new ChatOpenAI({
  model: process.env.NVIDIA_MODEL,
  apiKey: process.env.NVIDIA_API_KEY,

  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
});

export default model;