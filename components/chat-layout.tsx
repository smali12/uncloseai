"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  // Tracks the conversation ID that is actively being streamed into.
  // Using a ref avoids stale-closure bugs inside async callbacks — the ref
  // always holds the latest value even if state hasn't re-rendered yet.
  const activeConversationIdRef = useRef<string | null>(null);

  // When the stream completes for a brand-new conversation we already have
  // all messages in local state — no need to refetch from the API.
  const skipNextConversationLoad = useRef(false);

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

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoadingConversation(true);
    try {
      const data = await api.getConversation(conversationId);
      setMessages(data.messages);
      if (data.conversation.model) {
        setModel(data.conversation.model as Model);
      }
    } catch (error) {
      console.error("[chat] Failed to load conversation:", error);
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      if (skipNextConversationLoad.current) {
        skipNextConversationLoad.current = false;
        return;
      }
      loadConversation(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId, loadConversation]);

  const handleSelectConversation = (id: string | null) => {
    activeConversationIdRef.current = id;
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
    // Resolve the conversation ID we'll actually use for this request.
    // We track it in a local variable AND a ref so async callbacks can
    // always read the up-to-date value without stale closures.
    let activeConvId = currentConversationId;

    // Upload files first if any
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        // Files need a conversation ID — create one if we don't have one yet.
        if (!activeConvId) {
          const newConv = await api.createConversation(deriveTitle(content), model);
          activeConvId = newConv.id;
          // Keep state and ref in sync immediately so downstream code is consistent.
          activeConversationIdRef.current = activeConvId;
          setCurrentConversationId(activeConvId);
          await loadConversations();
        }
        await Promise.all(files.map((file) => api.uploadFile(file, activeConvId!)));
      } catch (error) {
        console.error("[chat] File upload error:", error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Optimistically add the user message to the UI.
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId || "",
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

    // Update the ref so the callbacks below always see the correct ID.
    activeConversationIdRef.current = activeConvId;

    await streamChat(
      content,
      // Pass the local var, not the state value — state may not have flushed
      // yet if we just created a conversation for file uploads above.
      activeConvId,
      {
        onToken: (token) => {
          setStreamingContent((prev) => prev + token);
        },

        onToolCall: (tc) => {
          console.log("[chat] Tool call received:", tc.tool);
          setToolCalls((prev) => [...prev, tc]);
        },

        onDone: async (fullText, serverConversationId) => {
          console.log(
            "[chat] onDone — fullText length:", fullText.length,
            "serverConvId:", serverConversationId
          );
          setIsStreaming(false);
          setAbortController(null);

          // The server may have created a new conversation and sent its ID
          // back via the stream. Fall back to whatever we were already using.
          const resolvedId =
            serverConversationId || activeConversationIdRef.current || null;

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

          // If the server returned a brand-new conversation ID, select it now
          // and skip the history reload (we already have messages in state).
          if (serverConversationId && !activeConversationIdRef.current) {
            skipNextConversationLoad.current = true;
            activeConversationIdRef.current = serverConversationId;
            setCurrentConversationId(serverConversationId);
          }

          // Refresh the sidebar list.
          const convs = await api.listConversations();
          setConversations(convs);

          // Auto-rename if the server still has a generic placeholder title.
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
          console.error("[chat] Stream error:", error);
          setIsStreaming(false);
          setAbortController(null);
          setToolCalls([]);
          // Remove the optimistic user message on failure.
          setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        },
      },
      {
        model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        enableTools: true,
        enableCodeExecution: true,
        // Only send a title hint when the server needs to create the conversation.
        title: !activeConvId ? deriveTitle(content) : undefined,
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