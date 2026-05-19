"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, Conversation, Message, ToolCall } from "@/lib/api";
import { streamChat } from "@/lib/chat";
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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [model, setModel] = useState<Model>(settings.defaultModel as Model);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

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
      console.error("[v0] Failed to load conversations:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoadingConversation(true);
    try {
      const data = await api.getConversation(conversationId);
      setMessages(data.messages);
      if (data.conversation.model) {
        setModel(data.conversation.model as Model);
      }
    } catch (error) {
      console.error("[v0] Failed to load conversation:", error);
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId, loadConversation]);

  const handleSelectConversation = (id: string | null) => {
    setCurrentConversationId(id);
    setStreamingContent("");
    setIsStreaming(false);
    setToolCalls([]);
  };

  const deriveTitle = (text: string): string => {
    const words = text.trim().split(/\s+/);
    const snippet = words.slice(0, 6).join(" ");
    return snippet.length < text.trim().length ? snippet + "…" : snippet;
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    let fileIds: string[] | undefined;

    // Upload files first if any
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        // Need a conversation ID to upload files
        let convId = currentConversationId;
        if (!convId) {
          // Create conversation first
          const newConv = await api.createConversation(deriveTitle(content), model);
          convId = newConv.id;
          setCurrentConversationId(convId);
          await loadConversations();
        }

        const uploadPromises = files.map((file) => api.uploadFile(file, convId!));
        const uploadedFiles = await Promise.all(uploadPromises);
        fileIds = uploadedFiles.map((f) => f.id);
      } catch (error) {
        console.error("[v0] File upload error:", error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversationId || "",
      user_id: "",
      role: "user",
      content,
      model: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setStreamingContent("");
    setToolCalls([]);
    setIsStreaming(true);

    const controller = new AbortController();
    setAbortController(controller);

    await streamChat(
      content,
      currentConversationId,
      {
        onToken: (token) => {

          console.log("[v0] Token received:", token.slice(0, 50));
          setStreamingContent((prev) => prev + token);
        },
        onToolCall: (tc) => {
          console.log("[v0] Tool call in layout:", tc.tool);
          setToolCalls((prev) => [...prev, tc]);
        },
        onDone: async (fullText, serverConversationId) => {
          console.log("[v0] onDone called, fullText length:", fullText.length, "serverConvId:", serverConversationId);
          setIsStreaming(false);
          setAbortController(null);

          // Resolve the real conversation ID — either the one the server
          // returned in the stream, or the one we already had.
          const resolvedId = serverConversationId || currentConversationId || null;

          const assistantMessage: Message = {
            id: `temp-assistant-${Date.now()}`,
            conversation_id: resolvedId || "",
            user_id: "",
            role: "assistant",
            content: fullText,
            model,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent("");
          setToolCalls([]);

          // If the server gave us a brand-new conversation ID, select it now
          // so the sidebar highlights the right item and subsequent messages
          // are sent to the correct thread.
          if (serverConversationId && !currentConversationId) {
            setCurrentConversationId(serverConversationId);
          }

          const convs = await api.listConversations();
          setConversations(convs);

          // Auto-rename if the conversation still has a generic title
          if (resolvedId) {
            const existing = convs.find((c) => c.id === resolvedId);
            if (
              existing &&
              (existing.title === "New Chat" ||
                existing.title === "New conversation" ||
                existing.title === "")
            ) {
              const newTitle = deriveTitle(content);
              await api.renameConversation(resolvedId, newTitle);
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === resolvedId ? { ...c, title: newTitle } : c
                )
              );
            }
          }
        },
        onError: (error) => {
          console.error("[v0] Chat error:", error);
          setIsStreaming(false);
          setAbortController(null);
          setToolCalls([]);
          setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        },
      },
      {
        model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        title: !currentConversationId ? deriveTitle(content) : undefined,
        enableCodeExecution: true,
      fileIds,
      },
      controller.signal
    );
  };


  const handleStop = () => {
    abortController?.abort();
    setIsStreaming(false);
    setAbortController(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentTitle = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)?.title
    : null;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
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
        {isLoadingConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            toolCalls={toolCalls}
          />
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStop}
          isLoading={isStreaming}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
}
