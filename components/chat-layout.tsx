"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, Conversation, FileAttachment } from "@/lib/api";
import { useBackendChat, type ChatOptions } from "@/lib/use-backend-chat";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { ModelSelector, Model } from "@/components/model-selector";
import { Loader2 } from "lucide-react";

export function ChatLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [model, setModel] = useState<Model>(settings.defaultModel as Model);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Use the AI SDK-compatible chat hook
  const {
    messages,
    status,
    error,
    sendMessage,
    stop,
    conversationId,
    setConversationId,
    isUploading,
  } = useBackendChat({
    model,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    enableTools: true,
    enableCodeExecution: true,
  });

  useEffect(() => {
    setModel(settings.defaultModel as Model);
  }, [settings.defaultModel]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error("[chat] Failed to load conversations:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Refresh sidebar when conversation changes (e.g. after first message)
  useEffect(() => {
    if (conversationId) {
      loadConversations();
    }
  }, [conversationId, loadConversations]);

  const deriveTitle = (text: string): string => {
    const words = text.trim().split(/\s+/);
    const snippet = words.slice(0, 6).join(" ");
    return snippet.length < text.trim().length ? snippet + "…" : snippet;
  };

  const handleSelectConversation = (id: string | null) => {
    setConversationId(id);
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    await sendMessage(content, files);
  };

  const handleStop = () => {
    stop();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentTitle = conversationId
    ? conversations.find((c) => c.id === conversationId)?.title
    : null;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onConversationsChange={loadConversations}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-5 h-12 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm">
          <ModelSelector value={model} onChange={setModel} />
          {currentTitle && (
            <p className="text-[13px] text-muted-foreground truncate max-w-xs font-medium">
              {currentTitle}
            </p>
          )}
          <div className="w-32" />
        </header>

        {/* Messages */}
        <ChatMessages
          messages={messages}
          streamingContent=""
          isStreaming={status === "streaming" || status === "submitted"}
          toolCalls={[]}
        />

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStop}
          isLoading={status === "streaming" || status === "submitted"}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
}