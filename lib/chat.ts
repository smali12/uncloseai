const BASE_URL = "https://aibackend-production-5e6b.up.railway.app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolCallEvent {
  toolCallId: string;
  toolName: string;
  args: unknown;       // accumulated from a: deltas, parsed when result arrives
  result?: unknown;
  isError?: boolean;
}

export interface StreamCallbacks {
  onToken: (text: string) => void;
  /** Fired when a tool result (b:) arrives — gives you the complete call + result. */
  onToolCall?: (event: ToolCallEvent) => void;
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
// AI SDK UI Message Stream parser
//
//   0  – text delta          0:"hello"
//   2  – data annotation     2:[{...}]          (our custom metadata)
//   3  – error               3:"message"
//   9  – tool call start     9:{"toolCallId":"...","toolName":"..."}
//   a  – tool call delta     a:{"toolCallId":"...","argsTextDelta":"..."}
//   b  – tool result         b:{"toolCallId":"...","result":...}
//   e  – finish step         e:{"finishReason":"...","isContinued":true}
//   d  – finish message      d:{"finishReason":"stop","usage":{...}}
// ---------------------------------------------------------------------------

function parseLine(
  line: string,
  state: {
    fullResponse: string;
    conversationId: string | undefined;
    // In-flight tool calls: toolCallId → ToolCallEvent
    pendingToolCalls: Map<string, ToolCallEvent>;
  },
  callbacks: StreamCallbacks
): { done: boolean } {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return { done: false };

  const typeCode = line.slice(0, colonIdx);
  const rawValue = line.slice(colonIdx + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    console.warn("[chat] Failed to parse stream line:", rawValue);
    return { done: false };
  }

  switch (typeCode) {
    // ── Text delta ──────────────────────────────────────────────────────────
    case "0": {
      const text = parsed as string;
      state.fullResponse += text;
      callbacks.onToken(text);
      break;
    }

    // ── Data annotation (custom metadata from our Python backend) ──────────
    case "2": {
      const items = parsed as Record<string, unknown>[];
      for (const item of items) {
        if (typeof item.conversation_id === "string" && !state.conversationId) {
          state.conversationId = item.conversation_id;
          console.log("[chat] conversation_id:", state.conversationId);
        }
      }
      break;
    }

    // ── Error ───────────────────────────────────────────────────────────────
    case "3": {
      callbacks.onError(new Error(parsed as string));
      return { done: true };
    }

    // ── Tool call start ─────────────────────────────────────────────────────
    case "9": {
      const { toolCallId, toolName } = parsed as { toolCallId: string; toolName: string };
      state.pendingToolCalls.set(toolCallId, {
        toolCallId,
        toolName,
        args: "",   // will be built up from a: deltas
      });
      console.log("[chat] Tool call started:", toolName, toolCallId);
      break;
    }

    // ── Tool call input delta ────────────────────────────────────────────────
    case "a": {
      const { toolCallId, argsTextDelta } = parsed as {
        toolCallId: string;
        argsTextDelta: string;
      };
      const tc = state.pendingToolCalls.get(toolCallId);
      if (tc) {
        tc.args = (tc.args as string) + argsTextDelta;
      }
      break;
    }

    // ── Tool result ──────────────────────────────────────────────────────────
    case "b": {
      const { toolCallId, result, isError } = parsed as {
        toolCallId: string;
        result: unknown;
        isError?: boolean;
      };
      const tc = state.pendingToolCalls.get(toolCallId);
      if (tc) {
        // Parse accumulated args string into an object
        let parsedArgs: unknown = tc.args;
        try {
          parsedArgs = JSON.parse(tc.args as string);
        } catch {
          // leave as raw string if not valid JSON
        }

        const event: ToolCallEvent = {
          ...tc,
          args: parsedArgs,
          result,
          isError: isError ?? false,
        };

        console.log(
          `[chat] Tool result for ${tc.toolName}:`,
          isError ? "ERROR" : "OK",
          result
        );

        callbacks.onToolCall?.(event);
        state.pendingToolCalls.delete(toolCallId);
      }
      break;
    }

    // ── Finish step ──────────────────────────────────────────────────────────
    case "e": {
      const { finishReason, isContinued } = parsed as {
        finishReason: string;
        isContinued: boolean;
      };
      console.log("[chat] Step finished:", finishReason, "continued:", isContinued);
      // Not exposed to the caller — it's an internal loop marker.
      break;
    }

    // ── Finish message (stream complete) ─────────────────────────────────────
    case "d": {
      const { finishReason } = parsed as { finishReason: string };
      console.log("[chat] Stream finished:", finishReason, "conversationId:", state.conversationId);
      callbacks.onDone(state.fullResponse, state.conversationId);
      return { done: true };
    }

    default:
      console.log("[chat] Unknown type code:", typeCode, parsed);
  }

  return { done: false };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function streamChat(
  message: string,
  conversationId: string | null,
  callbacks: StreamCallbacks,
  options: ChatOptions = {},
  signal?: AbortSignal
) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

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

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Stream error" }));
      callbacks.onError(new Error(err.detail));
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const state = {
      fullResponse: "",
      conversationId: conversationId ?? undefined,
      pendingToolCalls: new Map<string, ToolCallEvent>(),
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Stream closed without a d: finish line — call onDone defensively
        console.warn("[chat] Reader closed without finish line");
        callbacks.onDone(state.fullResponse, state.conversationId);
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const { done: streamDone } = parseLine(trimmed, state, callbacks);
        if (streamDone) return;
      }
    }
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.log("[chat] Stream aborted");
      return;
    }
    callbacks.onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}