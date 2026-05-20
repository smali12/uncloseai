"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Database,
  Table,
  Clock,
  AlertCircle,
  Copy,
  CheckCheck,
  Rows3,
} from "lucide-react";

interface DatabaseQueryArgs {
  query: string;
  database?: string;
  params?: unknown[];
}

interface DatabaseQueryCardProps {
  args: DatabaseQueryArgs;
  result?: {
    success: boolean;
    rows?: Record<string, unknown>[];
    row_count?: number;
    columns?: string[];
    error?: string;
    execution_time_ms?: number;
  };
  isRunning?: boolean;
}

// Simple SQL syntax highlighting
function highlightSQL(sql: string): React.ReactNode {
  const keywords = /\b(SELECT|FROM|WHERE|AND|OR|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|CREATE|DROP|ALTER|TABLE|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|CONSTRAINT|UNIQUE|IN|LIKE|BETWEEN|IS|CASE|WHEN|THEN|ELSE|END|UNION|ALL|EXISTS)\b/gi;
  const strings = /('[^']*')/g;
  const numbers = /\b(\d+)\b/g;
  
  let result = sql;
  
  // Replace strings first (to avoid conflicts)
  const stringMatches: string[] = [];
  result = result.replace(strings, (match) => {
    stringMatches.push(match);
    return `__STRING_${stringMatches.length - 1}__`;
  });
  
  // Highlight keywords
  result = result.replace(keywords, '<span class="text-purple-400 font-semibold">$1</span>');
  
  // Highlight numbers
  result = result.replace(numbers, '<span class="text-amber-400">$1</span>');
  
  // Restore strings with highlighting
  stringMatches.forEach((match, i) => {
    result = result.replace(`__STRING_${i}__`, `<span class="text-emerald-400">${match}</span>`);
  });
  
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
}

export function DatabaseQueryCard({ args, result, isRunning }: DatabaseQueryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(args.query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const status = isRunning 
    ? "running" 
    : result?.success 
      ? "success" 
      : result?.error 
        ? "error" 
        : "pending";

  const rows = result?.rows || [];
  const columns = result?.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
          <Database className="h-5 w-5 text-cyan-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Database Query</p>
            {args.database && (
              <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                {args.database}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
            {args.query.slice(0, 60)}{args.query.length > 60 ? "..." : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {status === "running" ? (
            <span className="flex items-center gap-1.5 text-xs text-cyan-500 font-medium bg-cyan-500/10 px-2.5 py-1 rounded-full">
              <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              Querying
            </span>
          ) : status === "success" ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Rows3 className="h-3.5 w-3.5" />
              {result?.row_count ?? rows.length} rows
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
          {/* Query */}
          <div>
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/40 border-b border-border">
              <div className="flex items-center gap-2">
                <Table className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Query
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
            <pre className="p-4 bg-[#0d1117] text-[12px] font-mono leading-relaxed overflow-x-auto">
              {highlightSQL(args.query)}
            </pre>
          </div>

          {/* Results Table */}
          {rows.length > 0 && (
            <div className="border-t border-border">
              <div className="flex items-center justify-between px-4 py-2 bg-secondary/40 border-b border-border">
                <div className="flex items-center gap-2">
                  <Rows3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Results
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {rows.length} row{rows.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/30 border-b border-border">
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2 text-left font-semibold text-foreground/80 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-secondary/20">
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="px-3 py-2 font-mono text-foreground/70 whitespace-nowrap max-w-[200px] truncate"
                          >
                            {row[col] === null ? (
                              <span className="text-muted-foreground italic">null</span>
                            ) : typeof row[col] === "object" ? (
                              JSON.stringify(row[col])
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <div className="px-4 py-2 text-center text-[10px] text-muted-foreground bg-secondary/20 border-t border-border">
                    Showing 10 of {rows.length} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {result?.error && (
            <div className="p-4 bg-red-500/5 border-t border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
                  Error
                </span>
              </div>
              <pre className="text-xs font-mono text-red-400/80 whitespace-pre-wrap">
                {result.error}
              </pre>
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
