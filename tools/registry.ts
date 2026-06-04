import { z, ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

type ToolDefinition<T extends ZodSchema = ZodSchema> = {
  name: string;
  description: string;
  parameters: T;
  execute: (args: z.infer<T>) => Promise<unknown>;
};

interface ToolDescription {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register<T extends ZodSchema>(tool: ToolDefinition<T>) {
    this.tools.set(tool.name, tool as ToolDefinition);
  }

  async execute(name: string, args: unknown): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    const parsed = tool.parameters.parse(args);
    return tool.execute(parsed);
  }

  describe(): ToolDescription[] {
    return Array.from(this.tools.values()).map((t) => {
      let params = zodToJsonSchema(t.parameters as any, { target: "openApi3" }) as Record<string, unknown>;
      // OpenAI requires the parameters schema to have type: "object" at the top level
      if (params && typeof params === "object" && params.type !== "object") {
        params = { type: "object", properties: {}, ...params };
      }
      return {
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: params as Record<string, unknown>,
        },
      };
    });
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }
}

export const registry = new ToolRegistry();
