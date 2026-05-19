'use client'

import { useState, useRef, useEffect } from 'react'
import { Message, ToolCall } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'
import { HtmlArtifact } from './html-artifact'
import { GenUIRenderer } from './gen-ui'
import { FilePreview, FileAttachmentList } from './file-attachment'

interface ChatMessagesProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
  toolCalls?: ToolCall[]
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
  toolCalls = [],
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, toolCalls])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 select-none">
        <p className="text-[28px] font-semibold tracking-tight text-foreground/90 text-balance text-center">
          What&apos;s on your mind?
        </p>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Start typing below to begin a conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
        {messages.map((message, i) => (
          <MessageBubble key={message.id} message={message} index={i} />
        ))}

        {/* Tool calls during streaming */}
        {toolCalls.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] flex flex-col gap-2">
              {toolCalls.map((tc, i) => (
                <GenUIRenderer key={i} toolCall={tc} isRunning={isStreaming} />
              ))}
            </div>
          </div>
        )}

        {/* Streaming assistant bubble */}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[72%] group">
              <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 text-sm text-foreground leading-relaxed">
                <MessageContent content={streamingContent} />
              </div>
            </div>
          </div>
        )}

        {/* Thinking dots */}
        {isStreaming && !streamingContent && toolCalls.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user'
  const hasAttachments = message.attachments && message.attachments.length > 0

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] flex flex-col gap-2 items-end">
          {hasAttachments && (
            <FileAttachmentList files={message.attachments!} />
          )}
          <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 text-sm leading-relaxed">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if message contains embedded tool calls (from history)
  const { content, embeddedToolCalls } = parseMessageForToolCalls(message.content)

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] group flex flex-col gap-2">
        {/* Embedded tool calls */}
        {embeddedToolCalls.length > 0 && (
          <div className="flex flex-col gap-2">
            {embeddedToolCalls.map((tc, i) => (
              <GenUIRenderer key={i} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Message content */}
        {content.trim() && (
          <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 text-sm text-foreground leading-relaxed">
            <MessageContent content={content} />
          </div>
        )}

        {/* Attachments from assistant (sandbox-generated files) */}
        {hasAttachments && (
          <div className="flex flex-col gap-2">
            {message.attachments!.map((file, i) => (
              <FilePreview key={i} file={file} />
            ))}
          </div>
        )}

        {/* Action row under assistant messages */}
        {content.trim() && (
          <div className="flex items-center gap-1 pl-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <CopyButton text={content} />
          </div>
        )}
      </div>
    </div>
  )
}

// Parse message content for embedded tool call markers
function parseMessageForToolCalls(content: string): { content: string; embeddedToolCalls: ToolCall[] } {
  const toolCalls: ToolCall[] = []
  
  // Look for tool call JSON blocks: ```tool_call\n{...}\n```
  const toolCallRegex = /```tool_call\n([\s\S]*?)\n```/g
  let match
  let cleanContent = content

  while ((match = toolCallRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      if (parsed.type === 'tool_call' || parsed.tool) {
        toolCalls.push(parsed as ToolCall)
      }
    } catch {
      // Not valid JSON, skip
    }
    cleanContent = cleanContent.replace(match[0], '')
  }

  return { content: cleanContent.trim(), embeddedToolCalls: toolCalls }
}

function MessageContent({ content }: { content: string }) {
  // Split on fenced code blocks
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const inner = part.slice(3, -3)
          const newline = inner.indexOf('\n')
          const language = newline !== -1 ? inner.slice(0, newline).trim() : ''
          const code = newline !== -1 ? inner.slice(newline + 1) : inner

          // Detect HTML artifacts
          if (language === 'html' || language === 'html+template') {
            return (
              <div key={i} className="my-2">
                <HtmlArtifact html={code} title={language === 'html' ? 'HTML Component' : 'HTML Template'} />
              </div>
            )
          }

          return (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              {/* Code header */}
              <div className="flex items-center justify-between px-4 py-2 bg-secondary/70 border-b border-border">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {language || 'plaintext'}
                </span>
                <CopyButton text={code} label="Copy" />
              </div>
              <pre className="overflow-x-auto bg-secondary/30 p-4">
                <code className="text-[12px] font-mono text-foreground/80 leading-relaxed">
                  {code}
                </code>
              </pre>
            </div>
          )
        }

        // Inline: bold **text**, inline code `code`
        return <InlineText key={i} text={part} />
      })}
    </div>
  )
}

function InlineText({ text }: { text: string }) {
  // Split on inline code ticks and bold markers
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)

  return (
    <span className="whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        if (seg.startsWith('`') && seg.endsWith('`')) {
          return (
            <code key={i} className="text-[12px] font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground/80">
              {seg.slice(1, -1)}
            </code>
          )
        }
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={i} className="font-semibold">{seg.slice(2, -2)}</strong>
        }
        return <span key={i}>{seg}</span>
      })}
    </span>
  )
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          {label && <span>Copied</span>}
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  )
}
