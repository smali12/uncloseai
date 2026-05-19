"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Play,
  Terminal,
  Copy,
  Clock,
  AlertCircle,
} from "lucide-react";

interface CodeExecutionArgs {
  code: string;
  language: "python" | "javascript" | "bash" | "typescript";
  timeout?: number;
}

interface CodeExecutionCardProps {
  args: CodeExecutionArgs;
  result: {
    success: boolean;
    stdout?: string;
    stderr?: string;
    exit_code?: number;
    error?: string;
    execution_time_ms?: number;
  };
  isRunning?: boolean;
}

const LANGUAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  python: { label: "Python", color: "text-green-400", bgColor: "bg-green-500/10" },
  javascript: { label: "JavaScript", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  typescript: { label: "TypeScript", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  bash: { label: "Shell", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
};

export function CodeExecutionCard({ args, result, isRunning }: CodeExecutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [displayedOutput, setDisplayedOutput] = useState("");
  
  const langConfig = LANGUAGE_CONFIG[args.language] || LANGUAGE_CONFIG.bash;
  const hasOutput = result.stdout || result.stderr || result.error;
  
  // Typewriter effect for output
  useEffect(() => {
    const output = result.stdout || "";
    if (!output) {
      setDisplayedOutput("");
      return;
    }

    let index = 0;
    setDisplayedOutput("");
    
    const timer = setInterval(() => {
      if (index < output.length) {
        setDisplayedOutput(output.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 5);

    return () => clearInterval(timer);
  }, [result.stdout]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(args.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className={cn(
          "w-10 h-10 rounded-xl border flex items-center justify-center",
          langConfig.bgColor,
          "border-current/20"
        )}>
          <Terminal className={cn("h-5 w-5", langConfig.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Code Execution</p>
            <span className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full",
              langConfig.bgColor,
              langConfig.color
            )}>
              {langConfig.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
            {args.code.split("\n")[0].slice(0, 50)}
            {args.code.split("\n")[0].length > 50 ? "..." : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full">
              <Play className="h-3.5 w-3.5 animate-pulse" />
              Running...
            </span>
          ) : result.success ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Check className="h-3.5 w-3.5" />
              Success
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-500/10 px-2.5 py-1 rounded-full">
              <X className="h-3.5 w-3.5" />
              Failed
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
          {/* Code Block */}
          <div className="relative">
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Code
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
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
            <pre className="overflow-x-auto bg-[#0d1117] p-4 max-h-48">
              <code className={cn(
                "text-[12px] font-mono leading-relaxed",
                langConfig.color
              )}>
                {args.code}
              </code>
            </pre>
          </div>

          {/* Output */}
          {hasOutput && (
            <div>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border-t border-border">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Output
                </span>
              </div>

              {/* stdout */}
              {displayedOutput && (
                <pre className="overflow-x-auto bg-[#0d1117] px-4 py-3 text-[12px] font-mono text-emerald-400/80 leading-relaxed max-h-60">
                  {displayedOutput}
                  {displayedOutput.length < (result.stdout?.length || 0) && (
                    <span className="animate-pulse">|</span>
                  )}
                </pre>
              )}

              {/* stderr */}
              {result.stderr && (
                <div className="px-4 py-3 bg-red-500/5 border-t border-red-500/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertCircle className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
                      Stderr
                    </span>
                  </div>
                  <pre className="text-[12px] font-mono text-red-400/80 whitespace-pre-wrap">
                    {result.stderr}
                  </pre>
                </div>
              )}

              {/* error */}
              {result.error && (
                <div className="px-4 py-3 bg-red-500/5 border-t border-red-500/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <X className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
                      Error
                    </span>
                  </div>
                  <pre className="text-[12px] font-mono text-red-400/80 whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border bg-secondary/20">
            <div className="flex items-center gap-3">
              {result.exit_code !== undefined && (
                <span className={cn(
                  "flex items-center gap-1",
                  result.exit_code === 0 ? "text-emerald-500" : "text-red-400"
                )}>
                  Exit code: {result.exit_code}
                </span>
              )}
            </div>
            {result.execution_time_ms && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {result.execution_time_ms.toFixed(0)}ms
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
