import { ToolCall } from "./api";

const BASE_URL = "https://aibackend-production-5e6b.up.railway.app";

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onDone: (fullText: string, conversationId?: string) => void;
  onError: (error: Error) => void;
}

export interface ChatOptions {
  model?: "hermes" | "qwen";
  temperature?: number;
  maxTokens?: number;
  title?: string;
  enableTools?: boolean;
  enableCodeExecution?: boolean;
  fileIds?: string[];
}

export async function streamChat(
  message: string,
  conversationId: string | null,
  callbacks: StreamCallbacks,
  options: ChatOptions = {},
  signal?: AbortSignal
) {

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  if (!token) {
    callbacks.onError(new Error("Not authenticated"));
    return;
  }

  const {
    model = "hermes",
    temperature = 0.7,
    maxTokens = 2048,
    title,
    enableTools = true,
    enableCodeExecution = false,
    fileIds,
  } = options;

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal,
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        model,
        temperature,
        max_tokens: maxTokens,
        title,
        enable_tools: enableTools,
        enable_code_execution: enableCodeExecution,
        file_ids: fileIds,
      }),
    });


    if (!response.ok) {
      const err = await response
        .json()
        .catch(() => ({ detail: "Stream error" }));
      callbacks.onError(new Error(err.detail));
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let buffer = "";
    let newConversationId: string | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            callbacks.onDone(fullResponse, newConversationId);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            
            // Handle tool call events
            if (parsed.type === "tool_call" && callbacks.onToolCall) {
              callbacks.onToolCall(parsed as ToolCall);
              continue;
            }
            
            // Handle regular content
            if (parsed.content) {
              fullResponse += parsed.content;
              callbacks.onToken(parsed.content);
            }
            
            // Capture new conversation ID
            if (parsed.conversation_id && !conversationId) {
              newConversationId = parsed.conversation_id;
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    }
    callbacks.onDone(fullResponse, newConversationId);
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error : new Error("Unknown error")
    );
  }
}
