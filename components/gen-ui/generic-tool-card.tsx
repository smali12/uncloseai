"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ToolCall } from "@/lib/api";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Wrench,
  Loader2,
  Clock,
  Code,
  AlertCircle,
  Copy,
  CheckCheck,
} from "lucide-react";

interface GenericToolCardProps {
  toolCall: ToolCall;
  isRunning?: boolean;
}

// Tool name to display name mapping
function formatToolName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function GenericToolCard({ toolCall, isRunning }: GenericToolCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dots, setDots] = useState("");

  const { tool, args, result } = toolCall;
  const hasArgs = args && Object.keys(args).length > 0;
  const hasResult = result && (result.content || result.stdout || result.stderr || result.error);

  // Animate dots while running
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(timer);
  }, [isRunning]);

  const handleCopy = async () => {
    const content = JSON.stringify({ tool, args, result }, null, 2);
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine status
  const status = isRunning 
    ? "running" 
    : result?.success 
      ? "success" 
      : result?.error 
        ? "error" 
        : "pending";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
      >
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl border flex items-center justify-center transition-colors",
          status === "running" && "bg-blue-500/10 border-blue-500/30",
          status === "success" && "bg-emerald-500/10 border-emerald-500/30",
          status === "error" && "bg-red-500/10 border-red-500/30",
          status === "pending" && "bg-secondary/50 border-border"
        )}>
          {status === "running" ? (
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          ) : status === "success" ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : status === "error" ? (
            <X className="h-5 w-5 text-red-400" />
          ) : (
            <Wrench className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {formatToolName(tool)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
            {isRunning ? `Executing${dots}` : tool}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {status === "running" ? (
            <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium bg-blue-500/10 px-2.5 py-1 rounded-full">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Running
            </span>
          ) : status === "success" ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Check className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : status === "error" ? (
            <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-500/10 px-2.5 py-1 rounded-full">
              <AlertCircle className="h-3.5 w-3.5" />
              Failed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-secondary px-2.5 py-1 rounded-full">
              Pending
            </span>
          )}

          {(hasArgs || hasResult) && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (hasArgs || hasResult) && (
        <div className="border-t border-border">
          {/* Arguments */}
          {hasArgs && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 bg-secondary/40 border-b border-border">
                <div className="flex items-center gap-2">
                  <Code className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Arguments
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-[#0d1117] overflow-x-auto">
                <pre className="p-4 text-[12px] font-mono text-cyan-300/90 leading-relaxed">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Result */}
          {hasResult && (
            <div className={cn(hasArgs && "border-t border-border")}>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/40 border-b border-border">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Result
                </span>
              </div>
              
              {/* stdout */}
              {result.stdout && (
                <div className="bg-[#0d1117] overflow-x-auto">
                  <pre className="p-4 text-[12px] font-mono text-emerald-400/80 leading-relaxed max-h-60 overflow-y-auto">
                    {result.stdout}
                  </pre>
                </div>
              )}

              {/* content */}
              {result.content && !result.stdout && (
                <div className="bg-[#0d1117] overflow-x-auto">
                  <pre className="p-4 text-[12px] font-mono text-foreground/80 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {result.content}
                  </pre>
                </div>
              )}

              {/* stderr */}
              {result.stderr && (
                <div className="bg-amber-500/5 border-t border-amber-500/20 overflow-x-auto">
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                    <AlertCircle className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">
                      Stderr
                    </span>
                  </div>
                  <pre className="px-4 pb-3 text-[12px] font-mono text-amber-400/80 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {result.stderr}
                  </pre>
                </div>
              )}

              {/* error */}
              {result.error && (
                <div className="bg-red-500/5 border-t border-red-500/20 overflow-x-auto">
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                    <X className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
                      Error
                    </span>
                  </div>
                  <pre className="px-4 pb-3 text-[12px] font-mono text-red-400/80 leading-relaxed whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {result?.execution_time_ms && (
            <div className="px-4 py-2 flex justify-end border-t border-border bg-secondary/20">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {result.execution_time_ms.toFixed(0)}ms
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
