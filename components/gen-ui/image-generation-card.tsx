"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Image as ImageIcon,
  Download,
  Clock,
  AlertCircle,
  Sparkles,
  Maximize2,
  ExternalLink,
} from "lucide-react";

interface ImageGenerationArgs {
  prompt: string;
  model?: string;
  size?: string;
  style?: string;
  quality?: string;
}

interface ImageGenerationCardProps {
  args: ImageGenerationArgs;
  result?: {
    success: boolean;
    image_url?: string;
    revised_prompt?: string;
    error?: string;
    execution_time_ms?: number;
  };
  isRunning?: boolean;
}

export function ImageGenerationCard({ args, result, isRunning }: ImageGenerationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const status = isRunning 
    ? "running" 
    : result?.success 
      ? "success" 
      : result?.error 
        ? "error" 
        : "pending";

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden my-3">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-pink-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Image Generation</p>
              {args.model && (
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {args.model}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              &ldquo;{args.prompt.slice(0, 50)}{args.prompt.length > 50 ? "..." : ""}&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-3">
            {status === "running" ? (
              <span className="flex items-center gap-1.5 text-xs text-pink-500 font-medium bg-pink-500/10 px-2.5 py-1 rounded-full">
                <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                Generating
              </span>
            ) : status === "success" ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <Check className="h-3.5 w-3.5" />
                Generated
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
            {/* Prompt */}
            <div className="p-4">
              <div className="rounded-lg bg-secondary/30 border border-border p-3">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Prompt
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {args.prompt}
                </p>
              </div>

              {/* Options */}
              {(args.size || args.style || args.quality) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {args.size && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                      Size: {args.size}
                    </span>
                  )}
                  {args.style && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                      Style: {args.style}
                    </span>
                  )}
                  {args.quality && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                      Quality: {args.quality}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Generated Image */}
            {status === "running" && (
              <div className="px-4 pb-4">
                <div className="relative aspect-square max-w-md mx-auto rounded-lg bg-secondary/30 border border-border overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-pink-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">Creating your image...</p>
                  </div>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            )}

            {result?.image_url && (
              <div className="px-4 pb-4">
                <div className="relative group rounded-lg overflow-hidden border border-border">
                  {/* Loading skeleton */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-secondary/50 animate-pulse" />
                  )}
                  
                  <img
                    src={result.image_url}
                    alt={args.prompt}
                    className={cn(
                      "w-full max-h-[400px] object-contain transition-opacity duration-300",
                      imageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setImageLoaded(true)}
                  />

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowFullscreen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition-colors"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        View
                      </button>
                      <a
                        href={result.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                      <a
                        href={result.image_url}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>

                {/* Revised prompt */}
                {result.revised_prompt && result.revised_prompt !== args.prompt && (
                  <div className="mt-3 rounded-lg bg-secondary/20 border border-border p-3">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                      Revised Prompt
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed">
                      {result.revised_prompt}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {result?.error && (
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
                      Error
                    </span>
                  </div>
                  <p className="text-xs text-red-400/80">
                    {result.error}
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            {result?.execution_time_ms && (
              <div className="px-4 py-2 flex justify-end border-t border-border bg-secondary/20">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {(result.execution_time_ms / 1000).toFixed(1)}s
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && result?.image_url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={result.image_url}
            alt={args.prompt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
