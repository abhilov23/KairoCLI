import promptSync from "prompt-sync";
import { saveConfig, loadConfig, } from "./configManager.js";
const prompt = promptSync();
export async function runSetup() {
    console.log("\nKairoCLI Setup\n");
    console.log(`Select Provider:

1. NVIDIA
2. OpenAI
3. Anthropic
4. Ollama
5. Groq
`);
    const providerChoice = prompt("Choice: ");
    const providerMap = {
        "1": "nvidia",
        "2": "openai",
        "3": "anthropic",
        "4": "ollama",
        "5": "groq",
    };
    const provider = providerMap[providerChoice];
    if (!provider) {
        console.log("\nInvalid provider.\n");
        return;
    }
    let apiKey;
    let baseURL;
    const model = prompt("\nEnter model name: ");
    // OLLAMA DOES NOT NEED API KEY
    if (provider !== "ollama") {
        apiKey = prompt("Enter API Key: ");
    }
    // OPTIONAL BASE URL
    const useCustomBaseURL = prompt("Custom Base URL? (y/n): ");
    if (useCustomBaseURL
        .toLowerCase() === "y") {
        baseURL = prompt("Enter Base URL: ");
    }
    // LOAD EXISTING CONFIG
    const existingConfig = await loadConfig();
    const updatedConfig = {
        activeProvider: provider,
        providers: {
            ...(existingConfig?.providers ||
                {}),
            [provider]: {
                apiKey,
                baseURL,
                model,
            },
        },
    };
    await saveConfig(updatedConfig);
    console.log(`\nConfiguration saved successfully.

Active Provider:
${provider}

Model:
${model}
`);
}
