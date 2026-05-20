"use client";

import { ToolCall } from "@/lib/api";
import { SandboxCreationCard } from "./sandbox-creation-card";
import { WebSearchCard } from "./web-search-card";
import { CodeExecutionCard } from "./code-execution-card";
import { FileOperationCard } from "./file-operation-card";
import { GenericToolCard } from "./generic-tool-card";
import { HttpRequestCard } from "./http-request-card";
import { DatabaseQueryCard } from "./database-query-card";
import { ImageGenerationCard } from "./image-generation-card";

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
  if (
    tool === "web_search" || 
    tool === "search_web" || 
    tool === "google_search" ||
    tool === "search" ||
    toolLower.includes("web_search") ||
    toolLower.includes("websearch")
  ) {
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
    tool === "run_code" ||
    tool === "python" ||
    tool === "javascript" ||
    tool === "bash" ||
    toolLower.includes("repl") ||
    toolLower.includes("execute") ||
    toolLower.includes("run_code")
  ) {
    const language = tool === "python_repl" || tool === "python"
      ? "python" 
      : tool === "js_repl" || tool === "javascript"
        ? "javascript" 
        : tool === "bash_shell" || tool === "bash"
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
    tool === "delete_file" ||
    tool === "file_read" ||
    tool === "file_write" ||
    toolLower.includes("read_file") ||
    toolLower.includes("write_file") ||
    toolLower.includes("list_file")
  ) {
    const operation = toolLower.includes("read") 
      ? "read_file" 
      : toolLower.includes("write") 
        ? "write_file" 
        : toolLower.includes("list") 
          ? "list_files" 
          : "delete_file";
    
    return (
      <FileOperationCard
        operation={operation}
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

  // HTTP/API requests
  if (
    tool === "http_request" ||
    tool === "api_request" ||
    tool === "fetch" ||
    tool === "request" ||
    tool === "web_fetch" ||
    toolLower.includes("http") ||
    toolLower.includes("api_call") ||
    toolLower.includes("fetch")
  ) {
    return (
      <HttpRequestCard
        args={args as {
          url: string;
          method?: string;
          headers?: Record<string, string>;
          body?: unknown;
        }}
        result={result as {
          success: boolean;
          status_code?: number;
          response?: unknown;
          headers?: Record<string, string>;
          error?: string;
          execution_time_ms?: number;
        }}
        isRunning={isRunning}
      />
    );
  }

  // Database queries
  if (
    tool === "sql_query" ||
    tool === "database_query" ||
    tool === "query_db" ||
    tool === "db_query" ||
    tool === "execute_sql" ||
    toolLower.includes("sql") ||
    toolLower.includes("database") ||
    toolLower.includes("query_db")
  ) {
    return (
      <DatabaseQueryCard
        args={args as {
          query: string;
          database?: string;
          params?: unknown[];
        }}
        result={result as {
          success: boolean;
          rows?: Record<string, unknown>[];
          row_count?: number;
          columns?: string[];
          error?: string;
          execution_time_ms?: number;
        }}
        isRunning={isRunning}
      />
    );
  }

  // Image generation
  if (
    tool === "generate_image" ||
    tool === "image_generation" ||
    tool === "create_image" ||
    tool === "dall_e" ||
    tool === "dalle" ||
    tool === "stable_diffusion" ||
    tool === "midjourney" ||
    toolLower.includes("image") && (toolLower.includes("generat") || toolLower.includes("creat"))
  ) {
    return (
      <ImageGenerationCard
        args={args as {
          prompt: string;
          model?: string;
          size?: string;
          style?: string;
          quality?: string;
        }}
        result={result as {
          success: boolean;
          image_url?: string;
          revised_prompt?: string;
          error?: string;
          execution_time_ms?: number;
        }}
        isRunning={isRunning}
      />
    );
  }

  // Fallback to improved generic tool card
  return <GenericToolCard toolCall={toolCall} isRunning={isRunning} />;
}

// Re-export individual cards for direct use
export { SandboxCreationCard } from "./sandbox-creation-card";
export { WebSearchCard } from "./web-search-card";
export { CodeExecutionCard } from "./code-execution-card";
export { FileOperationCard } from "./file-operation-card";
export { GenericToolCard } from "./generic-tool-card";
export { HttpRequestCard } from "./http-request-card";
export { DatabaseQueryCard } from "./database-query-card";
export { ImageGenerationCard } from "./image-generation-card";
