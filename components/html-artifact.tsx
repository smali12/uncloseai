'use client'

import { useState } from 'react'
import { Copy, Check, Code2, Monitor } from 'lucide-react'
import DOMPurify from 'dompurify'

interface HtmlArtifactProps {
  html: string
  title?: string
}

export function HtmlArtifact({ html, title }: HtmlArtifactProps) {
  const [view, setView] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'button', 'input', 'form', 'label', 'ul', 'ol', 'li',
      'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
      'strong', 'em', 'b', 'i', 'code', 'pre', 'section', 'article',
      'header', 'footer', 'nav', 'main', 'aside', 'blockquote', 'br', 'hr',
      'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'text',
      'style'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'width', 'height', 'viewBox', 'data-*', 'aria-*',
      'onclick', 'onchange', 'type', 'name', 'value', 'placeholder',
      'disabled', 'checked', 'selected'
    ],
    KEEP_CONTENT: true,
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-foreground">
            {title || 'HTML Artifact'}
          </span>
        </div>

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
          <div className="min-h-72 max-h-96 overflow-auto">
            <div
              className="p-6 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />
          </div>
        ) : (
          <pre className="overflow-x-auto p-4 max-h-96 text-[12px] font-mono text-foreground/80 leading-relaxed bg-secondary/30">
            <code>{html}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
