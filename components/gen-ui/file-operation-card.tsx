"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  FolderTree,
  File,
  Folder,
  FileCode,
  FileJson,
  FileText,
  FileImage,
  Clock,
} from "lucide-react";

interface FileOperationArgs {
  path?: string;
  content?: string;
  directory?: string;
  recursive?: boolean;
}

interface FileItem {
  name: string;
  type: "file" | "directory";
  size?: number;
  modified?: string;
}

interface FileOperationCardProps {
  operation: "read_file" | "write_file" | "list_files" | "delete_file";
  args: FileOperationArgs;
  result: {
    success: boolean;
    content?: string;
    files?: FileItem[];
    error?: string;
    execution_time_ms?: number;
  };
}

const OPERATION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  read_file: { label: "Read File", color: "text-blue-400", icon: FileText },
  write_file: { label: "Write File", color: "text-emerald-400", icon: FileCode },
  list_files: { label: "List Files", color: "text-amber-400", icon: FolderTree },
  delete_file: { label: "Delete File", color: "text-red-400", icon: File },
};

const FILE_ICONS: Record<string, React.ElementType> = {
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  py: FileCode,
  json: FileJson,
  md: FileText,
  txt: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  svg: FileImage,
  gif: FileImage,
};

function getFileIcon(filename: string): React.ElementType {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || File;
}

function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileOperationCard({ operation, args, result }: FileOperationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const config = OPERATION_CONFIG[operation] || OPERATION_CONFIG.read_file;
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className={cn(
          "w-10 h-10 rounded-xl border flex items-center justify-center",
          "bg-secondary/50 border-border"
        )}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{config.label}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
            {args.path || args.directory || "..."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {result.success ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Check className="h-3.5 w-3.5" />
              Done
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
          {/* File Content (for read/write) */}
          {result.content && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Content
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {result.content.length} chars
                </span>
              </div>
              <pre className="overflow-x-auto bg-[#0d1117] p-4 max-h-60 text-[12px] font-mono text-foreground/80 leading-relaxed">
                {result.content}
              </pre>
            </div>
          )}

          {/* File List (for list_files) */}
          {result.files && result.files.length > 0 && (
            <div className="divide-y divide-border/50">
              {result.files.map((file, i) => {
                const FileIcon = file.type === "directory" ? Folder : getFileIcon(file.name);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/20"
                  >
                    <FileIcon className={cn(
                      "h-4 w-4 shrink-0",
                      file.type === "directory" ? "text-amber-400" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "flex-1 text-sm font-mono truncate",
                      file.type === "directory" ? "text-amber-400 font-medium" : "text-foreground/80"
                    )}>
                      {file.name}
                      {file.type === "directory" && "/"}
                    </span>
                    {file.size !== undefined && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error */}
          {result.error && (
            <div className="p-4 bg-red-500/5">
              <div className="rounded-lg border border-red-500/20 p-3">
                <p className="text-xs text-red-400 font-mono">
                  {result.error}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          {result.execution_time_ms && (
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
