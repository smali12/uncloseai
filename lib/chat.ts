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


    console.log("[v0] Chat response status:", response.status, response.ok);

    if (!response.ok) {
      const err = await response
        .json()
        .catch(() => ({ detail: "Stream error" }));
      console.log("[v0] Chat error response:", err);
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
        console.log("[v0] Stream done (reader finished), fullResponse length:", fullResponse.length);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        console.log("[v0] Raw line:", JSON.stringify(line));
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          console.log("[v0] Parsed data:", data);
          if (data === "[DONE]") {
            console.log("[v0] Received [DONE], calling onDone with conversationId:", newConversationId);
            callbacks.onDone(fullResponse, newConversationId);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            console.log("[v0] Parsed JSON:", parsed);
            
            // Handle tool call events
            if (parsed.type === "tool_call" && callbacks.onToolCall) {
              console.log("[v0] Tool call received:", parsed.tool);
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
              console.log("[v0] New conversation ID from stream:", parsed.conversation_id);
              newConversationId = parsed.conversation_id;
            }
          } catch {
            console.log("[v0] Failed to parse JSON from:", data);
            // ignore malformed chunks
          }
        }
      }
    }
    console.log("[v0] Stream ended without [DONE], calling onDone");
    callbacks.onDone(fullResponse, newConversationId);
  } catch (error) {
    console.log("[v0] Stream error:", error);
    callbacks.onError(
      error instanceof Error ? error : new Error("Unknown error")
    );
  }
}
