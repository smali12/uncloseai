"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Conversation, api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Settings,
  CheckSquare,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SettingsPanel } from "@/components/settings-panel";

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onConversationsChange: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onConversationsChange,
  isCollapsed,
  onToggleCollapse,
}: ConversationSidebarProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({ open: false, id: "", title: "" });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
  }>({ open: false, id: "" });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleNewChat = () => {
    onSelectConversation(null);
  };

  const handleRename = async () => {
    if (!renameDialog.title.trim()) return;
    setIsLoading(true);
    try {
      await api.renameConversation(renameDialog.id, renameDialog.title.trim());
      onConversationsChange();
      setRenameDialog({ open: false, id: "", title: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await api.deleteConversation(deleteDialog.id);
      if (currentConversationId === deleteDialog.id) {
        onSelectConversation(null);
      }
      onConversationsChange();
      setDeleteDialog({ open: false, id: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => api.deleteConversation(id)));
      if (currentConversationId && ids.includes(currentConversationId)) {
        onSelectConversation(null);
      }
      setSelectedIds(new Set());
      setSelectMode(false);
      onConversationsChange();
      setBulkDeleteDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectedIds(new Set());
    }
    setSelectMode(!selectMode);
  };

  const toggleSelectConversation = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(conversations.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const groupedConversations = groupConversationsByDate(conversations);

  if (isCollapsed) {
    return (
      <>
        <div className="w-14 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-3 gap-2">
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNewChat}
            className="w-8 h-8 flex items-center justify-center rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="w-8 h-8 flex items-center justify-center rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      </>
    );
  }

  return (
    <>
      <div className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-12 border-b border-sidebar-border shrink-0">
          <span className="text-[13px] font-semibold text-sidebar-foreground tracking-tight">
            UncloseAI
          </span>
          <div className="flex items-center gap-0.5">
            {selectMode ? (
              <button
                onClick={toggleSelectMode}
                className="w-7 h-7 flex items-center justify-center rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                aria-label="Exit select mode"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleNewChat}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                  aria-label="New chat"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={toggleSelectMode}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                  aria-label="Select conversations"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={onToggleCollapse}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Select mode actions bar */}
        {selectMode && (
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-sidebar-border shrink-0">
            <span className="text-[11px] text-sidebar-muted">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={selectAll}
                className="text-[11px] text-sidebar-muted hover:text-sidebar-foreground px-1.5 py-0.5 rounded transition-colors"
              >
                Select all
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={deselectAll}
                  className="text-[11px] text-sidebar-muted hover:text-sidebar-foreground px-1.5 py-0.5 rounded transition-colors"
                >
                  Deselect all
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-sidebar-muted">No conversations yet</p>
            </div>
          ) : (
            groupedConversations.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="px-2.5 pt-2 pb-1 text-[10px] font-medium text-sidebar-muted uppercase tracking-[0.1em]">
                  {group.label}
                </p>
                {group.conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === currentConversationId}
                    selectMode={selectMode}
                    isSelected={selectedIds.has(conversation.id)}
                    onSelect={() => {
                      if (selectMode) {
                        toggleSelectConversation(conversation.id);
                      } else {
                        onSelectConversation(conversation.id);
                      }
                    }}
                    onToggleSelect={() =>
                      toggleSelectConversation(conversation.id)
                    }
                    onRename={() =>
                      setRenameDialog({
                        open: true,
                        id: conversation.id,
                        title: conversation.title,
                      })
                    }
                    onDelete={() =>
                      setDeleteDialog({ open: true, id: conversation.id })
                    }
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Bulk delete button at bottom when in select mode */}
        {selectMode && selectedIds.size > 0 && (
          <div className="border-t border-sidebar-border px-2 py-2 shrink-0">
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-1.5 text-xs h-8"
              onClick={() => setBulkDeleteDialog(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selectedIds.size > 1 ? `(${selectedIds.size})` : ""}
            </Button>
          </div>
        )}

        {/* Footer */}
        {!selectMode && (
          <div className="border-t border-sidebar-border px-2 py-2 shrink-0 flex flex-col gap-0.5">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full text-left group"
            >
              <Settings className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:rotate-45 duration-300" />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-sidebar-muted hover:text-red-400 hover:bg-sidebar-accent transition-colors w-full text-left"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialog.open}
        onOpenChange={(open) =>
          !open && setRenameDialog({ open: false, id: "", title: "" })
        }
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">Rename conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={renameDialog.title}
            onChange={(e) =>
              setRenameDialog({ ...renameDialog, title: e.target.value })
            }
            placeholder="Conversation title"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="bg-input border-border"
          />
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setRenameDialog({ open: false, id: "", title: "" })
              }
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleRename} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, id: "" })
        }
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">Delete conversation</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete this conversation? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialog({ open: false, id: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialog}
        onOpenChange={(open) => !open && setBulkDeleteDialog(false)}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">Delete conversations</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete {selectedIds.size} conversation{selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : `Delete (${selectedIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

function ConversationItem({
  conversation,
  isActive,
  selectMode,
  isSelected,
  onSelect,
  onToggleSelect,
  onRename,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  selectMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-100",
        isActive && !selectMode
          ? "bg-sidebar-accent text-sidebar-foreground font-medium"
          : isSelected && selectMode
            ? "bg-sidebar-accent/80 text-sidebar-foreground"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
      onClick={onSelect}
    >
      {selectMode && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect()}
            className="data-[state=checked]:bg-sidebar-foreground data-[state=checked]:text-sidebar data-[state=checked]:border-sidebar-foreground border-sidebar-muted/50"
          />
        </div>
      )}
      <span className="flex-1 truncate text-[13px] leading-snug">{conversation.title}</span>
      {!selectMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-sidebar-muted hover:text-sidebar-foreground hover:bg-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={onRename} className="text-xs gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-xs gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function groupConversationsByDate(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: { label: string; conversations: Conversation[] }[] = [
    { label: "Today", conversations: [] },
    { label: "Yesterday", conversations: [] },
    { label: "Last 7 days", conversations: [] },
    { label: "Last 30 days", conversations: [] },
    { label: "Older", conversations: [] },
  ];

  conversations.forEach((conv) => {
    const date = new Date(conv.updated_at);
    if (date >= today) {
      groups[0].conversations.push(conv);
    } else if (date >= yesterday) {
      groups[1].conversations.push(conv);
    } else if (date >= lastWeek) {
      groups[2].conversations.push(conv);
    } else if (date >= lastMonth) {
      groups[3].conversations.push(conv);
    } else {
      groups[4].conversations.push(conv);
    }
  });

  return groups.filter((g) => g.conversations.length > 0);
}