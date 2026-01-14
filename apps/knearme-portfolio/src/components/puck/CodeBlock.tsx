/**
 * Puck CodeBlock Component
 *
 * Client-side syntax highlighting for the Puck visual editor.
 * Uses Shiki for highlighting with lazy loading of languages/themes.
 *
 * Features:
 * - Syntax highlighting for common languages (JS, TS, Python, Bash, etc.)
 * - Optional line numbers
 * - Copy to clipboard button
 * - Optional filename header
 *
 * @see PUCK-027 in PRD for acceptance criteria
 * @see https://shiki.style/guide/install for Shiki browser usage
 * @see src/components/blog/CodeBlock.tsx for server-side Shiki usage
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { codeToHtml } from 'shiki'
import { cn } from '@/lib/utils'
import { Check, Copy } from 'lucide-react'

/**
 * Map of language aliases to Shiki language IDs
 * Matches the blog CodeBlock for consistency
 */
const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  bash: 'bash',
  json: 'json',
  html: 'html',
  css: 'css',
  sql: 'sql',
}

export interface PuckCodeBlockProps {
  /** The code content to display */
  code: string
  /** Programming language for syntax highlighting */
  language: 'javascript' | 'typescript' | 'python' | 'bash' | 'json' | 'html' | 'css' | 'sql'
  /** Whether to show line numbers */
  showLineNumbers: boolean
  /** Optional filename to display in header */
  filename: string
}

/**
 * Escape HTML entities for safe rendering
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * PuckCodeBlock Component
 *
 * Renders code with syntax highlighting for the Puck editor.
 * Highlighting is performed client-side using Shiki with lazy loading.
 */
export function PuckCodeBlock({
  code,
  language,
  showLineNumbers,
  filename,
}: PuckCodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Highlight code using Shiki
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const highlight = async () => {
      try {
        const lang = LANGUAGE_MAP[language] || 'text'
        const html = await codeToHtml(code, {
          lang,
          theme: 'github-dark',
          // Enable line number data attributes for CSS styling
          transformers: showLineNumbers
            ? [
                {
                  name: 'line-numbers',
                  line(node, line) {
                    node.properties['data-line'] = line
                  },
                },
              ]
            : undefined,
        })
        if (isMounted) {
          setHighlightedHtml(html)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('[PuckCodeBlock] Highlighting failed:', error)
        if (isMounted) {
          // Fallback to plain escaped code
          setHighlightedHtml(null)
          setIsLoading(false)
        }
      }
    }

    highlight()

    return () => {
      isMounted = false
    }
  }, [code, language, showLineNumbers])

  // Copy to clipboard handler
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[PuckCodeBlock] Copy failed:', error)
    }
  }, [code])

  // Split code into lines for line number display
  const codeLines = code.split('\n')

  return (
    <div className="relative rounded-lg overflow-hidden bg-[#24292e] font-mono text-sm">
      {/* Header with filename and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1f2428] border-b border-[#2f363d]">
        <div className="flex items-center gap-2">
          {filename ? (
            <span className="text-gray-400 text-xs">{filename}</span>
          ) : (
            <span className="text-gray-500 text-xs uppercase">{language}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'hover:bg-white/10 text-gray-400 hover:text-gray-200'
          )}
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        {isLoading ? (
          // Loading state - show plain code with fade animation
          <div className="relative">
            <pre className="p-4 text-gray-300 animate-pulse">
              <code>{code}</code>
            </pre>
          </div>
        ) : highlightedHtml ? (
          // Highlighted code from Shiki
          <div className="relative">
            {showLineNumbers && (
              // Line numbers column (absolute positioned)
              <div
                className="absolute left-0 top-0 bottom-0 w-12 bg-[#1f2428] border-r border-[#2f363d] select-none"
                aria-hidden="true"
              >
                <div className="p-4 pr-3 text-right text-gray-500 text-xs leading-[1.625]">
                  {codeLines.map((_, index) => (
                    <div key={index}>{index + 1}</div>
                  ))}
                </div>
              </div>
            )}
            <div
              className={cn(
                '[&>pre]:p-4 [&>pre]:m-0 [&>pre]:bg-transparent',
                '[&>pre]:leading-relaxed [&_code]:leading-relaxed',
                showLineNumbers && 'pl-12'
              )}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </div>
        ) : (
          // Fallback - plain escaped code
          <div className="relative">
            {showLineNumbers && (
              <div
                className="absolute left-0 top-0 bottom-0 w-12 bg-[#1f2428] border-r border-[#2f363d] select-none"
                aria-hidden="true"
              >
                <div className="p-4 pr-3 text-right text-gray-500 text-xs leading-[1.625]">
                  {codeLines.map((_, index) => (
                    <div key={index}>{index + 1}</div>
                  ))}
                </div>
              </div>
            )}
            <pre
              className={cn(
                'p-4 text-gray-300 overflow-x-auto',
                showLineNumbers && 'pl-16'
              )}
            >
              <code>{escapeHtml(code)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default PuckCodeBlock
