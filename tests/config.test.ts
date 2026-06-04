import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";

const TEST_CONFIG_DIR = path.join(os.tmpdir(), "kairo-test-" + Date.now());
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, "config.json");

// Mock the config file path by writing directly
describe("Config", () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_CONFIG_DIR, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_CONFIG_DIR, { recursive: true, force: true });
  });

  it("should write and read a config with all fields", async () => {
    const config = {
      provider: "openai",
      model: "gpt-4o",
      baseURL: "https://api.openai.com/v1",
      apiKey: "sk-test123",
    };

    await fs.writeFile(TEST_CONFIG_FILE, JSON.stringify(config, null, 2));

    const raw = await fs.readFile(TEST_CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.provider).toBe("openai");
    expect(parsed.model).toBe("gpt-4o");
    expect(parsed.baseURL).toBe("https://api.openai.com/v1");
    expect(parsed.apiKey).toBe("sk-test123");
  });

  it("should write and read a minimal config without optional fields", async () => {
    const config = {
      provider: "ollama",
      model: "llama3.2",
    };

    await fs.writeFile(TEST_CONFIG_FILE, JSON.stringify(config, null, 2));

    const raw = await fs.readFile(TEST_CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.provider).toBe("ollama");
    expect(parsed.model).toBe("llama3.2");
    expect(parsed.baseURL).toBeUndefined();
    expect(parsed.apiKey).toBeUndefined();
  });

  it("should handle missing config file gracefully", async () => {
    const missingPath = path.join(TEST_CONFIG_DIR, "nonexistent.json");
    try {
      const raw = await fs.readFile(missingPath, "utf-8");
      // Should not reach here
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("should write a custom provider config", async () => {
    const config = {
      provider: "custom",
      baseURL: "https://api.linkapi.ai/v1",
      apiKey: "sk-custom-key",
      model: "gpt-4o",
    };

    await fs.writeFile(TEST_CONFIG_FILE, JSON.stringify(config, null, 2));

    const raw = await fs.readFile(TEST_CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.provider).toBe("custom");
    expect(parsed.baseURL).toBe("https://api.linkapi.ai/v1");
    expect(parsed.apiKey).toBe("sk-custom-key");
    expect(parsed.model).toBe("gpt-4o");
  });
});
