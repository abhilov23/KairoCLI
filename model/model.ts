import { ChatOpenAI } from "@langchain/openai";


const model = new ChatOpenAI({
  model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",

  apiKey: process.env.NVIDIA_API_KEY,

  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
});

export default model;