"use client";

import { FileAttachment } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  File,
  Download,
  X,
} from "lucide-react";

interface FileAttachmentChipProps {
  file: FileAttachment;
  onRemove?: () => void;
  removable?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("text/") || mimeType.includes("json") || mimeType.includes("xml")) return FileCode;
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("word")) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar") || mimeType.includes("7z")) return FileArchive;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileAttachmentChip({
  file,
  onRemove,
  removable = false,
}: FileAttachmentChipProps) {
  const Icon = getFileIcon(file.mime_type);
  const isImage = file.mime_type.startsWith("image/");

  return (
    <div
      className={cn(
        "group relative inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/60 border border-border",
        "hover:bg-secondary transition-colors"
      )}
    >
      {isImage ? (
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-secondary shrink-0">
          <img
            src={file.fetch_url}
            alt={file.file_name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className="flex flex-col min-w-0">
        <span className="text-[12px] font-medium text-foreground truncate max-w-[140px]">
          {file.file_name}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formatFileSize(file.file_size_bytes)}
        </span>
      </div>

      {removable && onRemove ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 p-1 rounded-md hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Remove attachment"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <a
          href={file.fetch_url}
          download={file.file_name}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 p-1 rounded-md hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Download file"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

interface FileAttachmentListProps {
  files: FileAttachment[];
  onRemove?: (index: number) => void;
  removable?: boolean;
}

export function FileAttachmentList({
  files,
  onRemove,
  removable = false,
}: FileAttachmentListProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, index) => (
        <FileAttachmentChip
          key={file.id || index}
          file={file}
          removable={removable}
          onRemove={onRemove ? () => onRemove(index) : undefined}
        />
      ))}
    </div>
  );
}

interface FilePreviewProps {
  file: FileAttachment;
}

export function FilePreview({ file }: FilePreviewProps) {
  const isImage = file.mime_type.startsWith("image/");
  const isPdf = file.mime_type === "application/pdf";

  if (isImage) {
    return (
      <div className="rounded-xl overflow-hidden border border-border my-2 max-w-md">
        <img
          src={file.fetch_url}
          alt={file.file_name}
          className="w-full h-auto max-h-80 object-contain bg-secondary/30"
        />
        <div className="px-3 py-2 border-t border-border bg-card">
          <p className="text-[11px] text-muted-foreground truncate">
            {file.file_name}
          </p>
        </div>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="rounded-xl overflow-hidden border border-border my-2">
        <iframe
          src={file.fetch_url}
          title={file.file_name}
          className="w-full h-96 border-0"
        />
        <div className="px-3 py-2 border-t border-border bg-card flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground truncate">
            {file.file_name}
          </p>
          <a
            href={file.fetch_url}
            download={file.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-foreground hover:underline flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        </div>
      </div>
    );
  }

  return <FileAttachmentChip file={file} />;
}
