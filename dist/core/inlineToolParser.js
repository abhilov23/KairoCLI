export function extractInlineToolCall(raw) {
    const text = raw.trim();
    const toolCallTaggedMatch = text.match(/<TOOLCALL>\s*([\s\S]*?)\s*<\/TOOLCALL>/i);
    const payload = toolCallTaggedMatch ? toolCallTaggedMatch[1].trim() : text;
    try {
        const parsed = JSON.parse(payload);
        const firstCall = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!firstCall?.name) {
            return null;
        }
        const parameters = firstCall.parameters ?? firstCall.arguments ?? {};
        return {
            name: firstCall.name,
            parameters,
        };
    }
    catch {
        return null;
    }
}
