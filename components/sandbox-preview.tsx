"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Maximize2, Minimize2, Code2, Eye } from "lucide-react";

interface SandboxPreviewProps {
  url: string;
  title?: string;
  language?: "react" | "html";
}

export function SandboxPreview({
  url,
  title = "Preview",
  language = "html",
}: SandboxPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden my-3 transition-all duration-200",
        isExpanded && "fixed inset-4 z-50 m-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                activeTab === "preview"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                activeTab === "code"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2 className="h-3 w-3" />
              Source
            </button>
          </div>

          <span className="text-[12px] text-muted-foreground font-medium">
            {title}
          </span>

          {language === "react" && (
            <span className="text-[10px] font-medium text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              React
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={cn("bg-white", isExpanded ? "h-[calc(100%-44px)]" : "h-80")}>
        {activeTab === "preview" ? (
          <iframe
            src={url}
            title={title}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm bg-secondary/20">
            <p>View source at <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{url}</a></p>
          </div>
        )}
      </div>

      {/* Expanded overlay backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
