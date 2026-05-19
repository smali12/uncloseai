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
  const toolLower = tool.toLowerCase();

  // Sandbox/Dashboard creation - match various naming patterns
  if (
    toolLower.includes("sandbox") ||
    toolLower.includes("dashboard") ||
    toolLower.includes("create_app") ||
    toolLower.includes("createapp") ||
    toolLower.includes("createreact") ||
    toolLower.includes("create_react") ||
    tool === "create_sandbox" ||
    tool === "codeSandbox"
  ) {
    // Extract info from various argument formats
    const sandboxArgs = {
      name: (args as Record<string, unknown>)?.name as string || 
            (args as Record<string, unknown>)?.project_name as string ||
            tool.replace(/^create/i, '').replace(/Dashboard$/i, ' Dashboard').trim() ||
            "New Project",
      language: (args as Record<string, unknown>)?.language as string || "JavaScript",
      framework: (args as Record<string, unknown>)?.framework as string || 
                 (toolLower.includes("react") ? "React" : undefined),
      description: (args as Record<string, unknown>)?.description as string,
      components: (args as Record<string, unknown>)?.components as string[] ||
                  (args as Record<string, unknown>)?.tools as string[],
    };

    return (
      <SandboxCreationCard
        args={sandboxArgs}
        result={result as {
          success: boolean;
          sandbox_id?: string;
          url?: string;
          error?: string;
          execution_time_ms?: number;
        }}
        isRunning={isRunning}
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
