"use client";

import { useState } from "react";
import { API_BASE_URL, ToolCall } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SandboxPreview } from "@/components/sandbox-preview";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Terminal,
  Code2,
  FileText,
  Globe,
  Package,
  FolderOpen,
  Play,
} from "lucide-react";

interface ToolCallCardProps {
  toolCall: ToolCall;
}

function resolveArtifactUrl(artifact: string): string {
  if (!artifact) return "";
  if (artifact.startsWith("http://") || artifact.startsWith("https://")) {
    return artifact;
  }
  if (artifact.startsWith("/")) {
    return `${API_BASE_URL}${artifact}`;
  }
  return `${API_BASE_URL}/${artifact}`;
}

function getArtifactLanguage(toolName: string, artifactUrl: string): "react" | "html" {
  const lower = artifactUrl.toLowerCase();
  if (toolName.includes("react") || lower.endsWith(".tsx") || lower.endsWith(".jsx")) {
    return "react";
  }
  return "html";
}

const TOOL_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  python_repl: { label: "Python", icon: Code2, color: "text-yellow-500" },
  js_repl: { label: "JavaScript", icon: Code2, color: "text-yellow-400" },
  bash_shell: { label: "Shell", icon: Terminal, color: "text-green-500" },
  react_build: { label: "React Build", icon: Play, color: "text-cyan-500" },
  read_file: { label: "Read File", icon: FileText, color: "text-blue-400" },
  write_file: { label: "Write File", icon: FileText, color: "text-blue-500" },
  list_files: { label: "List Files", icon: FolderOpen, color: "text-amber-500" },
  pip_install: { label: "pip install", icon: Package, color: "text-orange-500" },
  npm_install: { label: "npm install", icon: Package, color: "text-red-500" },
  web_fetch: { label: "Web Fetch", icon: Globe, color: "text-purple-500" },
};

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { tool, result } = toolCall;
  const meta = TOOL_META[tool] || {
    label: tool,
    icon: Terminal,
    color: "text-muted-foreground",
  };
  const Icon = meta.icon;

  const hasOutput =
    result.stdout || result.stderr || result.content || result.error;
  const hasArtifacts = result.artifacts && result.artifacts.length > 0;
  const previewArtifact = result.artifacts?.find((artifact) => {
    const lower = artifact.toLowerCase();
    return lower.endsWith(".html") || lower.endsWith(".htm") || lower.includes("preview");
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-2">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
      >
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center bg-secondary",
            meta.color
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{meta.label}</p>
          {result.execution_time_ms && (
            <p className="text-[11px] text-muted-foreground">
              {result.execution_time_ms.toFixed(0)}ms
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {result.success ? (
            <span className="flex items-center gap-1.5 text-[11px] text-green-500 font-medium">
              <Check className="h-3 w-3" />
              Success
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
              <X className="h-3 w-3" />
              Failed
            </span>
          )}

          {hasOutput && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          )}
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && hasOutput && (
        <div className="border-t border-border">
          {/* stdout */}
          {result.stdout && (
            <div className="px-4 py-3 border-b border-border/50 last:border-b-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Output
              </p>
              <pre className="text-[12px] font-mono text-foreground/80 whitespace-pre-wrap break-all bg-secondary/30 rounded-lg p-3 max-h-60 overflow-auto">
                {result.stdout}
              </pre>
            </div>
          )}

          {/* stderr */}
          {result.stderr && (
            <div className="px-4 py-3 border-b border-border/50 last:border-b-0">
              <p className="text-[10px] font-medium text-red-400 uppercase tracking-wider mb-2">
                Stderr
              </p>
              <pre className="text-[12px] font-mono text-red-400/80 whitespace-pre-wrap break-all bg-red-500/5 rounded-lg p-3 max-h-40 overflow-auto">
                {result.stderr}
              </pre>
            </div>
          )}

          {/* content (for simpler tools) */}
          {result.content && !result.stdout && (
            <div className="px-4 py-3 border-b border-border/50 last:border-b-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Result
              </p>
              <pre className="text-[12px] font-mono text-foreground/80 whitespace-pre-wrap break-all bg-secondary/30 rounded-lg p-3 max-h-60 overflow-auto">
                {result.content}
              </pre>
            </div>
          )}

          {/* error */}
          {result.error && (
            <div className="px-4 py-3 border-b border-border/50 last:border-b-0">
              <p className="text-[10px] font-medium text-red-400 uppercase tracking-wider mb-2">
                Error
              </p>
              <pre className="text-[12px] font-mono text-red-400 whitespace-pre-wrap break-all bg-red-500/5 rounded-lg p-3">
                {result.error}
              </pre>
            </div>
          )}

          {/* artifacts */}
          {hasArtifacts && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Artifacts
              </p>
              <div className="flex flex-wrap gap-2">
                {result.artifacts!.map((artifact, i) => {
                  const artifactUrl = resolveArtifactUrl(artifact);
                  const filename = artifact.split("/").pop() || artifact;
                  return (
                    <a
                      key={i}
                      href={artifactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-[12px] text-foreground/80 transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      {filename}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline sandbox preview for web artifacts */}
      {isExpanded && previewArtifact && (
        <div className="px-4 pb-4">
          <SandboxPreview
            url={resolveArtifactUrl(previewArtifact)}
            title="Sandbox Preview"
            language={getArtifactLanguage(tool, previewArtifact)}
          />
        </div>
      )}
    </div>
  );
}
