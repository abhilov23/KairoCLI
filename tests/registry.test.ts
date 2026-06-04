import { describe, it, expect } from "vitest";
import { z } from "zod";
import { registry } from "../tools/registry.js";

describe("ToolRegistry", () => {
  it("should register a tool and describe it in OpenAI format", () => {
    registry.register({
      name: "test_tool",
      description: "A test tool",
      parameters: z.object({
        name: z.string(),
      }),
      execute: async ({ name }) => `Hello ${name}`,
    });

    const tools = registry.describe();
    const testTool = tools.find((t) => t.function.name === "test_tool");

    expect(testTool).toBeDefined();
    expect(testTool!.type).toBe("function");
    expect(testTool!.function.description).toBe("A test tool");
    expect(testTool!.function.parameters).toBeDefined();
  });

  it("should execute a tool with valid args and return the result", async () => {
    const result = await registry.execute("test_tool", { name: "World" });
    expect(result).toBe("Hello World");
  });

  it("should throw Zod validation error for invalid args", async () => {
    await expect(
      registry.execute("test_tool", { name: 123 })
    ).rejects.toThrow();
  });

  it("should throw for unknown tool name", async () => {
    await expect(
      registry.execute("nonexistent_tool", {})
    ).rejects.toThrow("Unknown tool: nonexistent_tool");
  });

  it("should list registered tool names", () => {
    const names = registry.list();
    expect(names).toContain("test_tool");
  });

  it("should include type: 'object' for empty parameter schemas", () => {
    registry.register({
      name: "empty_params_tool",
      description: "A tool with no parameters",
      parameters: z.object({}),
      execute: async () => "done",
    });

    const tools = registry.describe();
    const tool = tools.find((t) => t.function.name === "empty_params_tool");

    expect(tool).toBeDefined();
    expect(tool!.function.parameters).toHaveProperty("type", "object");
  });
});
