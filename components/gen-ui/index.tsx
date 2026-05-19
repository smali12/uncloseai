"use client";

import { ToolCall } from "@/lib/api";
import { SandboxCreationCard } from "./sandbox-creation-card";
import { WebSearchCard } from "./web-search-card";
import { CodeExecutionCard } from "./code-execution-card";
import { FileOperationCard } from "./file-operation-card";
import { ToolCallCard } from "@/components/tool-call-card";

interface GenUIRendererProps {
  toolCall: ToolCall;
  isRunning?: boolean;
}

/**
 * Generative UI Renderer
 * Routes tool calls to specialized UI components based on tool type
 */
export function GenUIRenderer({ toolCall, isRunning }: GenUIRendererProps) {
  const { tool, args, result } = toolCall;

  // Sandbox creation
  if (tool === "create_sandbox") {
    return (
      <SandboxCreationCard
        args={args as {
          name: string;
          language: string;
          framework?: string;
          description?: string;
          components?: string[];
        }}
        result={result as {
          success: boolean;
          sandbox_id?: string;
          url?: string;
          error?: string;
          execution_time_ms?: number;
        }}
      />
    );
  }

  // Web search
  if (tool === "web_search" || tool === "search_web" || tool === "google_search") {
    return (
      <WebSearchCard
        args={args as {
          query: string;
          num_results?: number;
          search_type?: string;
        }}
        result={result as {
          success: boolean;
          results?: Array<{
            title: string;
            url: string;
            snippet: string;
            favicon?: string;
          }>;
          error?: string;
          execution_time_ms?: number;
        }}
      />
    );
  }

  // Code execution
  if (
    tool === "python_repl" ||
    tool === "js_repl" ||
    tool === "bash_shell" ||
    tool === "execute_code" ||
    tool === "run_code"
  ) {
    const language = tool === "python_repl" 
      ? "python" 
      : tool === "js_repl" 
        ? "javascript" 
        : tool === "bash_shell"
          ? "bash"
          : (args as { language?: string })?.language || "python";
    
    return (
      <CodeExecutionCard
        args={{
          code: (args as { code?: string; script?: string })?.code || 
                (args as { code?: string; script?: string })?.script || "",
          language: language as "python" | "javascript" | "bash" | "typescript",
          timeout: (args as { timeout?: number })?.timeout,
        }}
        result={result}
        isRunning={isRunning}
      />
    );
  }

  // File operations
  if (
    tool === "read_file" ||
    tool === "write_file" ||
    tool === "list_files" ||
    tool === "delete_file"
  ) {
    return (
      <FileOperationCard
        operation={tool as "read_file" | "write_file" | "list_files" | "delete_file"}
        args={args as {
          path?: string;
          content?: string;
          directory?: string;
          recursive?: boolean;
        }}
        result={result as {
          success: boolean;
          content?: string;
          files?: Array<{
            name: string;
            type: "file" | "directory";
            size?: number;
            modified?: string;
          }>;
          error?: string;
          execution_time_ms?: number;
        }}
      />
    );
  }

  // Fallback to generic tool call card
  return <ToolCallCard toolCall={toolCall} />;
}

// Re-export individual cards for direct use
export { SandboxCreationCard } from "./sandbox-creation-card";
export { WebSearchCard } from "./web-search-card";
export { CodeExecutionCard } from "./code-execution-card";
export { FileOperationCard } from "./file-operation-card";
