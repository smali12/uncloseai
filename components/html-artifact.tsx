'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Check, Code2, Monitor, Maximize2 } from 'lucide-react'

interface HtmlArtifactProps {
  html: string
  title?: string
}

export function HtmlArtifact({ html, title }: HtmlArtifactProps) {
  const [view, setView] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
  const [iframeHeight, setIframeHeight] = useState(300)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Auto-resize iframe to fit its content
  useEffect(() => {
    if (view !== 'preview') return

    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument
        if (doc) {
          const h = doc.documentElement.scrollHeight
          setIframeHeight(Math.min(Math.max(h, 120), 600))
        }
      } catch {
        // cross-origin guard (shouldn't happen with srcdoc, but just in case)
      }
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [html, view])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenInTab = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // revoke after a short delay to allow the tab to load
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/50 border-b border-border">
        <span className="text-[12px] font-semibold text-foreground">
          {title || 'HTML Artifact'}
        </span>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-background rounded-lg p-0.5 border border-border">
            <button
              onClick={() => setView('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors text-[11px] ${
                view === 'preview'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Preview rendered HTML"
            >
              <Monitor className="h-3 w-3" />
              Preview
            </button>
            <button
              onClick={() => setView('code')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors text-[11px] ${
                view === 'code'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="View HTML source"
            >
              <Code2 className="h-3 w-3" />
              Code
            </button>
          </div>

          {/* Open in new tab */}
          <button
            onClick={handleOpenInTab}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded transition-colors"
            title="Open in new tab"
          >
            <Maximize2 className="h-3 w-3" />
            Expand
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded transition-colors"
            title="Copy HTML to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-background">
        {view === 'preview' ? (
          <iframe
            ref={iframeRef}
            srcDoc={html}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ height: iframeHeight }}
            className="w-full border-0 block"
            title={title || 'HTML preview'}
          />
        ) : (
          <pre className="overflow-x-auto p-4 max-h-96 text-[12px] font-mono text-foreground/80 leading-relaxed bg-secondary/30">
            <code>{html}</code>
          </pre>
        )}
      </div>
    </div>
  )
}