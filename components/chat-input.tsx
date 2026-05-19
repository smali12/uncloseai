"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Square, Paperclip, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileAttachment } from "@/lib/api";

interface PendingFile {
  file: File;
  preview?: string;
}

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  isUploading?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled = false,
  isUploading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: PendingFile[] = Array.from(files).map((file) => ({
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (index: number) => {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = () => {
    if ((message.trim() || pendingFiles.length > 0) && !isLoading && !disabled) {
      onSend(
        message.trim(),
        pendingFiles.length > 0 ? pendingFiles.map((p) => p.file) : undefined
      );
      setMessage("");
      // Revoke object URLs
      pendingFiles.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
      setPendingFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const canSend =
    (message.trim().length > 0 || pendingFiles.length > 0) &&
    !isLoading &&
    !disabled &&
    !isUploading;

  return (
    <div className="px-4 pb-6 pt-2 shrink-0">
      <div className="max-w-3xl mx-auto">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative bg-card rounded-2xl border transition-all duration-150",
            isFocused
              ? "border-border/80 ring-2 ring-ring/10"
              : "border-border",
            isDragging && "border-primary ring-2 ring-primary/20",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          {/* File previews */}
          {pendingFiles.length > 0 && (
            <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2">
              {pendingFiles.map((pf, index) => (
                <div
                  key={index}
                  className="relative group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border"
                >
                  {pf.preview ? (
                    <img
                      src={pf.preview}
                      alt={pf.file.name}
                      className="w-6 h-6 rounded object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center">
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-[11px] text-foreground/80 max-w-[100px] truncate">
                    {pf.file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-0.5 rounded hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              pendingFiles.length > 0
                ? "Add a message or send files..."
                : "Ask anything..."
            }
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent px-4 pt-4 pb-12 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[56px] max-h-[200px] leading-relaxed"
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.md,.py,.js,.ts,.jsx,.tsx,.html,.css"
          />

          {/* Bottom bar inside the input */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2.5 border-t border-border/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <p className="text-[11px] text-muted-foreground/40 select-none">
                Shift+Enter for new line
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(message.trim().length > 0 || pendingFiles.length > 0) && (
                <span className="text-[11px] text-muted-foreground/40 tabular-nums">
                  {pendingFiles.length > 0 && `${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""}`}
                  {pendingFiles.length > 0 && message.length > 0 && " · "}
                  {message.length > 0 && message.length}
                </span>
              )}

              {isUploading ? (
                <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              ) : isLoading ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                  aria-label="Stop generating"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSend}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150",
                    canSend
                      ? "bg-foreground text-background hover:opacity-80 scale-100"
                      : "bg-muted text-muted-foreground/40 cursor-not-allowed scale-95"
                  )}
                  aria-label="Send message"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center">
              <p className="text-sm font-medium text-primary">
                Drop files here
              </p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground/30 text-center mt-3 select-none">
          AI responses may be inaccurate. Always verify important information.
        </p>
      </div>
    </div>
  );
}
