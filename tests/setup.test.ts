import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock dependencies ────────────────────────────────────────
// These must be at the top level so vi.mock is hoisted correctly.

const mockGetUserInput = vi.fn();
vi.mock("../ui/ui.js", () => ({
  getUserInput: mockGetUserInput,
}));

const mockLoadConfigAsync = vi.fn();
const mockSaveConfig = vi.fn();
vi.mock("../config/configManager.js", () => ({
  loadConfigAsync: mockLoadConfigAsync,
  saveConfig: mockSaveConfig,
  getConfigDir: () => "/mock/.terminal-agent",
  getConfigFile: () => "/mock/.terminal-agent/config.json",
}));

// ─── Helper ──────────────────────────────────────────────────────

/**
 * Queue values for getUserInput. Each call returns the next item
 * in the array, in FIFO order.
 */
function queueInputs(...values: string[]) {
  const copy = [...values];
  mockGetUserInput.mockImplementation(() => Promise.resolve(copy.shift() ?? ""));
}

function withSilentConsole<T>(fn: () => Promise<T>): Promise<T> {
  const oldLog = console.log;
  console.log = () => {};
  return fn().finally(() => {
    console.log = oldLog;
  });
}

// ─── Tests ───────────────────────────────────────────────────────

describe("runSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing config
    mockLoadConfigAsync.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Standard providers ──

  it("should configure OpenAI with model and no base URL override", async () => {
    queueInputs("1", "gpt-4o", "n");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "openai",
      model: "gpt-4o",
    });
  });

  it("should configure Anthropic with model", async () => {
    queueInputs("2", "claude-sonnet-4-5", "n");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "anthropic",
      model: "claude-sonnet-4-5",
    });
  });

  it("should configure Groq with model", async () => {
    queueInputs("3", "llama-3.3-70b-versatile", "n");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
    });
  });

  it("should configure NVIDIA with model and custom base URL", async () => {
    queueInputs(
      "4",
      "nvidia/llama-3.3-nemotron-super-49b-v1.5",
      "y",
      "https://integrate.api.nvidia.com/v1",
    );

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "nvidia",
      model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  });

  it("should configure Ollama (no API key needed)", async () => {
    queueInputs("5", "llama3.2", "n");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "ollama",
      model: "llama3.2",
    });
  });

  // ── Custom provider ──

  it("should configure custom provider with all fields", async () => {
    queueInputs(
      "6",
      "https://api.linkapi.ai/v1",
      "sk-custom-key-123",
      "gpt-4o",
    );

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "custom",
      baseURL: "https://api.linkapi.ai/v1",
      apiKey: "sk-custom-key-123",
      model: "gpt-4o",
    });
  });

  it("should handle custom provider with empty optional fields", async () => {
    // User enters '6' for custom, then provides only model (empty baseURL and apiKey)
    queueInputs("6", "", "", "my-model");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    // baseURL and apiKey won't be set since they were empty and no existingConfig
    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "custom",
      model: "my-model",
    });
  });

  // ── Invalid input ──

  it("should handle invalid provider choice gracefully", async () => {
    queueInputs("99");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    // Should return early without saving
    expect(mockSaveConfig).not.toHaveBeenCalled();
  });

  // ── Pre-fill from existing config ──

  it("should pre-fill existing values and accept defaults on empty input", async () => {
    mockLoadConfigAsync.mockResolvedValue({
      provider: "openai",
      model: "gpt-4o",
      baseURL: "https://api.openai.com/v1",
    });

    // User selects same provider and presses Enter for model (accepting default),
    // then says "y" for custom base URL and presses Enter (accepting default)
    queueInputs("1", "", "y", "");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "openai",
      model: "gpt-4o",
      baseURL: "https://api.openai.com/v1",
    });
  });

  it("should pre-fill and accept defaults for custom provider", async () => {
    mockLoadConfigAsync.mockResolvedValue({
      provider: "custom",
      baseURL: "https://api.linkapi.ai/v1",
      apiKey: "sk-existing-key",
      model: "gpt-4o",
    });

    // User selects custom (6) and presses Enter on all prompts (accepting defaults)
    queueInputs("6", "", "", "");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "custom",
      baseURL: "https://api.linkapi.ai/v1",
      apiKey: "sk-existing-key",
      model: "gpt-4o",
    });
  });

  it("should allow overwriting pre-filled values", async () => {
    mockLoadConfigAsync.mockResolvedValue({
      provider: "openai",
      model: "gpt-4o",
    });

    // User selects a different provider and enters a new model
    queueInputs("4", "nvidia/llama-3.3-nemotron-super-49b-v1.5", "n");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "nvidia",
      model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    });
  });

  // ── Provider change clears old fields ──

  it("should not carry over baseURL from existing config when switching providers without custom URL", async () => {
    mockLoadConfigAsync.mockResolvedValue({
      provider: "nvidia",
      model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    // Switch to Ollama (5), accept default model, say "n" for custom base URL
    queueInputs("5", "", "n");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "ollama",
      model: "nvidia/llama-3.3-nemotron-super-49b-v1.5", // model carried over
      // baseURL intentionally NOT included because user said "n"
    });
  });

  // ── Edge: API key in config ──

  it("should preserve apiKey when re-configuring custom provider with empty input", async () => {
    mockLoadConfigAsync.mockResolvedValue({
      provider: "custom",
      baseURL: "https://my-proxy.example.com/v1",
      apiKey: "sk-proxy-999",
      model: "claude-3-opus",
    });

    // Re-select custom (6), accept all defaults
    queueInputs("6", "", "", "");

    const { runSetup } = await import("../config/setup.js");
    await withSilentConsole(() => runSetup());

    expect(mockSaveConfig).toHaveBeenCalledWith({
      provider: "custom",
      baseURL: "https://my-proxy.example.com/v1",
      apiKey: "sk-proxy-999",
      model: "claude-3-opus",
    });
  });
});
