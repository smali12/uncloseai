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
}

// ---------------------------------------------------------------------------
// AI SDK Data Stream Protocol parser
//
// Each line from the server is:  {type_code}:{json_value}
//
//   0  – text delta          0:"hello"
//   2  – data annotation     2:[{"key":"value"}]
//   d  – finish message      d:{"finishReason":"stop","usage":{...}}
//   3  – error               3:"something went wrong"
// ---------------------------------------------------------------------------
function parseLine(
  line: string,
  fullResponse: string,
  newConversationId: string | undefined,
  conversationId: string | null,
  callbacks: StreamCallbacks
): { fullResponse: string; newConversationId: string | undefined; done: boolean } {
  if (!line || !line.includes(":")) {
    return { fullResponse, newConversationId, done: false };
  }

  const colonIdx = line.indexOf(":");
  const typeCode = line.slice(0, colonIdx);
  const rawValue = line.slice(colonIdx + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    console.log("[chat] Failed to parse line value:", rawValue);
    return { fullResponse, newConversationId, done: false };
  }

  switch (typeCode) {
    // --- Text delta ---
    case "0": {
      const text = parsed as string;
      console.log("[chat] Text delta:", text);
      fullResponse += text;
      callbacks.onToken(text);
      break;
    }

    // --- Data annotations (array of objects) ---
    case "2": {
      const items = parsed as Record<string, unknown>[];
      for (const item of items) {
        console.log("[chat] Data annotation:", item);

        // Capture conversation ID on new conversations
        if (item.conversation_id && !conversationId) {
          newConversationId = item.conversation_id as string;
          console.log("[chat] New conversation ID:", newConversationId);
        }

        // Tool call events
        if (item.type === "tool_call" && callbacks.onToolCall) {
          console.log("[chat] Tool call received:", item.tool);
          callbacks.onToolCall(item as unknown as ToolCall);
        }
      }
      break;
    }

    // --- Finish message ---
    case "d": {
      const finish = parsed as { finishReason: string };
      console.log("[chat] Stream finished, reason:", finish.finishReason, "conversationId:", newConversationId);
      callbacks.onDone(fullResponse, newConversationId);
      return { fullResponse, newConversationId, done: true };
    }

    // --- Error ---
    case "3": {
      const message = parsed as string;
      console.log("[chat] Stream error from server:", message);
      callbacks.onError(new Error(message));
      return { fullResponse, newConversationId, done: true };
    }

    default:
      console.log("[chat] Unknown type code:", typeCode, "value:", parsed);
  }

  return { fullResponse, newConversationId, done: false };
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
      }),
    });

    console.log("[chat] Response status:", response.status, response.ok);

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Stream error" }));
      console.log("[chat] Error response:", err);
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
        // Reader closed without a `d:` finish line — call onDone defensively
        console.log("[chat] Reader closed without finish line, fullResponse length:", fullResponse.length);
        callbacks.onDone(fullResponse, newConversationId);
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Lines are separated by "\n" in the AI SDK data stream protocol
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep incomplete last line in the buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        console.log("[chat] Raw line:", JSON.stringify(trimmed));

        const result = parseLine(
          trimmed,
          fullResponse,
          newConversationId,
          conversationId,
          callbacks
        );

        fullResponse = result.fullResponse;
        newConversationId = result.newConversationId;

        if (result.done) return; // finish or error — we're done
      }
    }
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.log("[chat] Stream aborted by user");
      return;
    }
    console.log("[chat] Stream error:", error);
    callbacks.onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}