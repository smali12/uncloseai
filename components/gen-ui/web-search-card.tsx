"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Search,
  Globe,
  FileText,
  Link2,
  ExternalLink,
  Clock,
} from "lucide-react";

interface WebSearchArgs {
  query: string;
  num_results?: number;
  search_type?: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
}

interface WebSearchCardProps {
  args: WebSearchArgs;
  result: {
    success: boolean;
    results?: SearchResult[];
    error?: string;
    execution_time_ms?: number;
  };
}

export function WebSearchCard({ args, result }: WebSearchCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const results = result.results || [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
          <Search className="h-5 w-5 text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Web Search</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            &ldquo;{args.query}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-3">
          {result.success ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Globe className="h-3.5 w-3.5" />
              {results.length} results
            </span>
          ) : result.error ? (
            <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-500/10 px-2.5 py-1 rounded-full">
              <X className="h-3.5 w-3.5" />
              Failed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium bg-blue-500/10 px-2.5 py-1 rounded-full">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Searching...
            </span>
          )}

          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Results */}
      {isExpanded && results.length > 0 && (
        <div className="border-t border-border divide-y divide-border/50">
          {results.slice(0, 5).map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary/50 border border-border flex items-center justify-center shrink-0">
                {item.favicon ? (
                  <img
                    src={item.favicon}
                    alt=""
                    className="w-4 h-4 rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </p>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                  <Link2 className="h-3 w-3 shrink-0" />
                  {new URL(item.url).hostname}
                </p>
                {item.snippet && (
                  <p className="text-xs text-foreground/60 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.snippet}
                  </p>
                )}
              </div>
            </a>
          ))}

          {/* Footer */}
          {result.execution_time_ms && (
            <div className="px-4 py-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {result.execution_time_ms.toFixed(0)}ms
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {isExpanded && result.error && (
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
            <p className="text-xs text-red-400 font-mono">
              {result.error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
