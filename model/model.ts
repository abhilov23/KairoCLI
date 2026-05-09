import { ChatOpenAI } from "@langchain/openai";


const model = new ChatOpenAI({
  model: "meta/llama-3.1-70b-instruct",

  apiKey: process.env.NVIDIA_API_KEY,

  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
});

export default model;