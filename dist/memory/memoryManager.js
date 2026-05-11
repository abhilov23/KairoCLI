import fs from "fs/promises";
import path from "path";
import os from "os";
const MEMORY_FILE = path.join(os.homedir(), ".terminal-agent", "history.json");
export async function loadMemory() {
    try {
        const raw = await fs.readFile(MEMORY_FILE, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return [];
    }
}
export async function saveMemory(messages) {
    await fs.mkdir(path.dirname(MEMORY_FILE), { recursive: true });
    await fs.writeFile(MEMORY_FILE, JSON.stringify(messages, null, 2));
}
