"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Box,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Code2,
  Layers,
  Settings,
  Sparkles,
} from "lucide-react";

interface SandboxCreationArgs {
  name: string;
  language: string;
  framework?: string;
  description?: string;
  components?: string[];
}

interface SandboxCreationCardProps {
  args: SandboxCreationArgs;
  result: {
    success: boolean;
    sandbox_id?: string;
    url?: string;
    error?: string;
    execution_time_ms?: number;
  };
}

const LANGUAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  JavaScript: { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/30" },
  TypeScript: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  Python: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30" },
  Go: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/30" },
  Rust: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
};

const FRAMEWORK_ICONS: Record<string, string> = {
  React: "⚛️",
  Vue: "💚",
  Svelte: "🔥",
  Next: "▲",
  Angular: "🅰️",
  Express: "🚀",
  FastAPI: "⚡",
};

export function SandboxCreationCard({ args, result }: SandboxCreationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const langStyle = LANGUAGE_COLORS[args.language] || { 
    bg: "bg-muted/50", 
    text: "text-muted-foreground",
    border: "border-border"
  };
  const frameworkIcon = args.framework ? FRAMEWORK_ICONS[args.framework] || "📦" : null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
          <Box className="h-5 w-5 text-violet-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Creating Sandbox</p>
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {args.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {result.success ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Check className="h-3.5 w-3.5" />
              Created
            </span>
          ) : result.error ? (
            <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-500/10 px-2.5 py-1 rounded-full">
              <X className="h-3.5 w-3.5" />
              Failed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Creating...
            </span>
          )}

          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Sandbox Info Grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {/* Language */}
            <div className={cn(
              "rounded-lg border p-3",
              langStyle.bg,
              langStyle.border
            )}>
              <div className="flex items-center gap-2 mb-1.5">
                <Code2 className={cn("h-3.5 w-3.5", langStyle.text)} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Language
                </span>
              </div>
              <p className={cn("text-sm font-semibold", langStyle.text)}>
                {args.language}
              </p>
            </div>

            {/* Framework */}
            {args.framework && (
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Framework
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>{frameworkIcon}</span>
                  {args.framework}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {args.description && (
            <div className="px-4 pb-3">
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {args.description}
                </p>
              </div>
            </div>
          )}

          {/* Components */}
          {args.components && args.components.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Components
                </span>
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  {args.components.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {args.components.map((component, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium text-foreground/80 bg-secondary/70 border border-border px-2.5 py-1 rounded-md"
                  >
                    {component}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Result URL */}
          {result.success && result.url && (
            <div className="px-4 pb-4">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Box className="h-4 w-4" />
                Open Sandbox
              </a>
            </div>
          )}

          {/* Error */}
          {result.error && (
            <div className="px-4 pb-4">
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                <p className="text-xs text-red-400 font-mono">
                  {result.error}
                </p>
              </div>
            </div>
          )}

          {/* Execution Time */}
          {result.execution_time_ms && (
            <div className="px-4 pb-3 flex justify-end">
              <span className="text-[10px] text-muted-foreground">
                Completed in {result.execution_time_ms.toFixed(0)}ms
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
