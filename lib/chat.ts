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
        console.log("[v0] Reader done, fullResponse length:", fullResponse.length);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        console.log("[v0] Raw SSE line:", line);
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          console.log("[v0] Data payload:", data);
          if (data === "[DONE]") {
            console.log("[v0] Received [DONE], calling onDone with fullResponse length:", fullResponse.length, "conversationId:", newConversationId);
            callbacks.onDone(fullResponse, newConversationId);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            console.log("[v0] Parsed SSE:", parsed);
            
            // Capture new conversation ID first (sent at the start of stream)
            if (parsed.conversation_id && !newConversationId) {
              console.log("[v0] Got conversation_id:", parsed.conversation_id);
              newConversationId = parsed.conversation_id;
              continue;
            }
            
            // Handle tool call events
            if (parsed.type === "tool_call" && callbacks.onToolCall) {
              console.log("[v0] Got tool_call:", parsed.tool);
              callbacks.onToolCall(parsed as ToolCall);
              continue;
            }
            
            // Handle final event (tool execution complete summary)
            if (parsed.type === "final") {
              console.log("[v0] Got final event");
              // The final event contains tool_calls summary, we can ignore it
              // since we've already handled individual tool calls
              continue;
            }
            
            // Handle regular content
            if (parsed.content) {
              console.log("[v0] Got content token:", parsed.content.substring(0, 50));
              fullResponse += parsed.content;
              callbacks.onToken(parsed.content);
            }
          } catch (e) {
            console.log("[v0] Failed to parse SSE data:", data, e);
            // ignore malformed chunks
          }
        }
      }
    }
    console.log("[v0] Stream ended without [DONE], calling onDone anyway");
    callbacks.onDone(fullResponse, newConversationId);
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error : new Error("Unknown error")
    );
  }
}
