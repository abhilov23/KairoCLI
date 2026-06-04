/** Raw streaming delta chunk for a tool call from the OpenAI API */
export interface ToolCallDelta {
  index: number;
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

/** Fully assembled tool call ready for execution */
export interface ToolCallResult {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/** Check if a string contains markdown syntax */
export function hasMarkdown(text: string): boolean {
  return /```|^#{1,3} |\*\*|^\- /m.test(text);
}
