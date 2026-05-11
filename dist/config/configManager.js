import fs from "fs/promises";
import path from "path";
import os from "os";
// Loading and creating the config file for the module setup
const CONFIG_DIR = path.join(os.homedir(), ".terminal-agent");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
export async function saveConfig(config) {
    await fs.mkdir(CONFIG_DIR, {
        recursive: true,
    });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}
export async function loadConfig() {
    try {
        const raw = await fs.readFile(CONFIG_FILE, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
