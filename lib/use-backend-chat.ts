"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useCallback, useRef } from "react"
import { api } from "@/lib/api"

const BASE_URL = "https://aibackend-production-5e6b.up.railway.app"

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  enableTools?: boolean
  enableCodeExecution?: boolean
}

/**
 * A thin wrapper around `useChat` that adapts the AI SDK's message
 * protocol to your Python backend's /chat/completions endpoint.
 *
 * Handles:
 * - Auth token injection via Authorization header
 * - Custom request body format (message, conversation_id, etc.)
 * - Conversation ID lifecycle
 * - File uploads
 */
export function useBackendChat(options: ChatOptions = {}) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const conversationIdRef = useRef<string | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token")
    }
    return null
  }, [])

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: `${BASE_URL}/chat/completions`,
      fetch: async (url, init) => {
        const token = getToken()
        if (!token) {
          return new Response(JSON.stringify({ detail: "Not authenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        }

        const body = init?.body ? JSON.parse(init.body as string) : {}
        const messages = body.messages || []

        // Extract the last user message for our backend
        const lastUserMessage = [...messages]
          .reverse()
          .find((m: { role: string }) => m.role === "user")
        const userMessageText =
          lastUserMessage?.content?.[0]?.text ||
          (typeof lastUserMessage?.content === "string" ? lastUserMessage.content : "") ||
          ""

        const ourBody = {
          message: userMessageText,
          conversation_id: conversationIdRef.current,
          model: optionsRef.current.model || "hermes",
          temperature: optionsRef.current.temperature ?? 0.7,
          max_tokens: optionsRef.current.maxTokens ?? 2048,
          enable_tools: optionsRef.current.enableTools ?? true,
          enable_code_execution: optionsRef.current.enableCodeExecution ?? false,
          ...(conversationIdRef.current ? {} : { title: userMessageText.slice(0, 60) }),
        }

        return fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(ourBody),
          signal: init?.signal,
        })
      },
    }),
    onData: (part) => {
      const dataPart = part as { type: string; data?: Record<string, unknown> }
      if (
        dataPart.type === "data-conversation" &&
        dataPart.data?.conversation_id &&
        typeof dataPart.data.conversation_id === "string" &&
        !conversationIdRef.current
      ) {
        const cid = dataPart.data.conversation_id
        conversationIdRef.current = cid
        setConversationId(cid)
      }
    },
    onFinish: ({ finishReason }) => {
      console.log("[chat] Finish:", finishReason)
    },
    onError: (error) => {
      console.error("[chat] Error:", error)
    },
  })

  const sendMessageWithFiles = useCallback(
    async (text: string, files?: File[]) => {
      if (files && files.length > 0) {
        setIsUploading(true)
        try {
          let convId = conversationIdRef.current
          if (!convId) {
            const newConv = await api.createConversation(
              text.slice(0, 60),
              optionsRef.current.model || "hermes",
            )
            convId = newConv.id
            conversationIdRef.current = convId
            setConversationId(convId)
          }
          await Promise.all(files.map((file) => api.uploadFile(file, convId!)))
        } catch (error) {
          console.error("[chat] File upload error:", error)
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      chat.sendMessage({ text })
    },
    [chat],
  )

  const loadConversation = useCallback(
    async (id: string | null) => {
      if (id) {
        conversationIdRef.current = id
        setConversationId(id)
        try {
          const data = await api.getConversation(id)
          const uiMessages = data.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            parts: [{ type: "text" as const, text: m.content }],
          }))
          chat.setMessages(uiMessages)
        } catch (error) {
          console.error("[chat] Failed to load conversation:", error)
        }
      } else {
        conversationIdRef.current = null
        setConversationId(null)
        chat.setMessages([])
      }
    },
    [chat],
  )

  return {
    ...chat,
    conversationId,
    setConversationId: loadConversation,
    isUploading,
    sendMessage: sendMessageWithFiles,
  }
}