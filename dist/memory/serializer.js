import { HumanMessage, AIMessage, SystemMessage, ToolMessage, } from "@langchain/core/messages";
export function serializeMessages(messages) {
    return messages.map((message) => {
        if (message instanceof HumanMessage) {
            return {
                role: "user",
                content: message.content.toString(),
            };
        }
        if (message instanceof AIMessage) {
            return {
                role: "assistant",
                content: message.content.toString(),
            };
        }
        if (message instanceof SystemMessage) {
            return {
                role: "system",
                content: message.content.toString(),
            };
        }
        if (message instanceof ToolMessage) {
            return {
                role: "tool",
                content: message.content.toString(),
            };
        }
        return {
            role: "assistant",
            content: message.content.toString(),
        };
    });
}
export function deserializeMessages(messages) {
    return messages.map((message) => {
        switch (message.role) {
            case "system":
                return new SystemMessage(message.content);
            case "user":
                return new HumanMessage(message.content);
            case "assistant":
                return new AIMessage(message.content);
            case "tool":
                return new ToolMessage({
                    tool_call_id: "restored_tool",
                    content: message.content,
                });
            default:
                return new HumanMessage(message.content);
        }
    });
}
