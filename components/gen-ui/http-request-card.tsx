"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Globe,
  Send,
  ArrowRight,
  Clock,
  FileJson,
  AlertCircle,
} from "lucide-react";

interface HttpRequestArgs {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface HttpRequestCardProps {
  args: HttpRequestArgs;
  result?: {
    success: boolean;
    status_code?: number;
    response?: unknown;
    headers?: Record<string, string>;
    error?: string;
    execution_time_ms?: number;
  };
  isRunning?: boolean;
}

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  POST: { bg: "bg-blue-500/10", text: "text-blue-500" },
  PUT: { bg: "bg-amber-500/10", text: "text-amber-500" },
  PATCH: { bg: "bg-orange-500/10", text: "text-orange-500" },
  DELETE: { bg: "bg-red-500/10", text: "text-red-500" },
};

const STATUS_COLORS: Record<string, string> = {
  "2": "text-emerald-500",
  "3": "text-blue-500",
  "4": "text-amber-500",
  "5": "text-red-500",
};

function getStatusColor(code?: number): string {
  if (!code) return "text-muted-foreground";
  const firstDigit = Math.floor(code / 100).toString();
  return STATUS_COLORS[firstDigit] || "text-muted-foreground";
}

export function HttpRequestCard({ args, result, isRunning }: HttpRequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const method = (args.method || "GET").toUpperCase();
  const methodStyle = METHOD_COLORS[method] || METHOD_COLORS.GET;
  
  // Parse URL for display
  let hostname = "";
  let pathname = "";
  try {
    const url = new URL(args.url);
    hostname = url.hostname;
    pathname = url.pathname + url.search;
  } catch {
    hostname = args.url;
  }

  const status = isRunning 
    ? "running" 
    : result?.success 
      ? "success" 
      : result?.error 
        ? "error" 
        : "pending";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
          <Globe className="h-5 w-5 text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded",
              methodStyle.bg,
              methodStyle.text
            )}>
              {method}
            </span>
            <p className="text-sm font-medium text-foreground truncate">
              {hostname}
            </p>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
            {pathname || "/"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {status === "running" ? (
            <span className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium bg-indigo-500/10 px-2.5 py-1 rounded-full">
              <Send className="h-3.5 w-3.5 animate-pulse" />
              Sending
            </span>
          ) : result?.status_code ? (
            <span className={cn(
              "flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-full",
              result.success ? "bg-emerald-500/10" : "bg-red-500/10",
              getStatusColor(result.status_code)
            )}>
              {result.status_code}
            </span>
          ) : status === "error" ? (
            <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-500/10 px-2.5 py-1 rounded-full">
              <X className="h-3.5 w-3.5" />
              Failed
            </span>
          ) : null}

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
          {/* Request Details */}
          <div className="p-4 space-y-3">
            {/* Full URL */}
            <div className="rounded-lg bg-secondary/30 border border-border p-3">
              <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                <ArrowRight className="h-3 w-3" />
                Request URL
              </div>
              <p className="text-xs font-mono text-foreground/80 break-all">
                {args.url}
              </p>
            </div>

            {/* Request Headers */}
            {args.headers && Object.keys(args.headers).length > 0 && (
              <div className="rounded-lg bg-secondary/30 border border-border p-3">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Request Headers
                </div>
                <div className="space-y-1">
                  {Object.entries(args.headers).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-xs font-mono">
                      <span className="text-cyan-400">{key}:</span>
                      <span className="text-foreground/70 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body */}
            {args.body && (
              <div className="rounded-lg overflow-hidden border border-border">
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border-b border-border">
                  <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Request Body
                  </span>
                </div>
                <pre className="p-3 bg-[#0d1117] text-[11px] font-mono text-foreground/80 overflow-x-auto max-h-40">
                  {typeof args.body === "string" 
                    ? args.body 
                    : JSON.stringify(args.body, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Response */}
          {result && (
            <div className="border-t border-border">
              <div className="flex items-center justify-between px-4 py-2 bg-secondary/40">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Response
                  </span>
                </div>
                {result.status_code && (
                  <span className={cn(
                    "text-xs font-mono font-bold",
                    getStatusColor(result.status_code)
                  )}>
                    HTTP {result.status_code}
                  </span>
                )}
              </div>

              {/* Response Body */}
              {result.response && (
                <pre className="p-4 bg-[#0d1117] text-[11px] font-mono text-emerald-400/80 overflow-x-auto max-h-60 leading-relaxed">
                  {typeof result.response === "string"
                    ? result.response
                    : JSON.stringify(result.response, null, 2)}
                </pre>
              )}

              {/* Error */}
              {result.error && (
                <div className="p-4 bg-red-500/5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
                      Error
                    </span>
                  </div>
                  <p className="text-xs font-mono text-red-400/80">
                    {result.error}
                  </p>
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
