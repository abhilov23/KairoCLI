import "dotenv/config";
import promptSync from "prompt-sync";
import model from "./model/model.js"
// Prompts
import systemPrompt from "./prompt/prompt.js";

//Tools 
import { getTime } from "./tools/getTime.js";
import { executeCommandTool } from "./tools/execCommand.js";



import {
  HumanMessage,
  BaseMessage,
  AIMessage,
  ToolMessage,
} from "@langchain/core/messages";


const prompt = promptSync();


const modelWithTools = model.bindTools([getTime, executeCommandTool]);

const messages: BaseMessage[] = [systemPrompt];



async function main() {
  while (true) {
    const input = prompt("You > ");

    if (!input.trim()) continue;

    if (input === "exit") break;

    messages.push(new HumanMessage(input));

    const response = await modelWithTools.invoke(messages);

    messages.push(response);

    // TOOL CALL DETECTED
    if (response.tool_calls?.length) {
      let executedCommand = false;
      const commandOutputs: string[] = [];

      for (const toolCall of response.tool_calls) {
        if (toolCall.name === "get_time") {
          const toolResult = await getTime.invoke(toolCall.args);
          console.log(toolResult);

          messages.push(
            new ToolMessage({
              tool_call_id: toolCall.id!,
              content: toolResult,
            })
          );
        } else if (toolCall.name === "execute_command") {
          const toolResult = await executeCommandTool.invoke(toolCall.args);
          executedCommand = true;
          commandOutputs.push(toolResult);

          messages.push(
            new ToolMessage({
              tool_call_id: toolCall.id!,
              content: toolResult,
            })
          );
        }
      }

      if (executedCommand) {
        console.log(commandOutputs.join("\n").trim() || "(no output)");
        continue;
      }

      // FINAL RESPONSE AFTER TOOL
      const finalResponse = await modelWithTools.invoke(messages);

      console.log(finalResponse.content);

      messages.push(finalResponse);
    } else {
      console.log(response.content);
    }
  }
}

main();
