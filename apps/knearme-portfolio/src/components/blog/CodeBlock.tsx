/**
 * CodeBlock Component
 *
 * Renders code blocks with syntax highlighting using Shiki.
 * Supports common programming languages: JavaScript, TypeScript, Python, Bash, JSON.
 *
 * Uses server-side highlighting for optimal performance and SEO.
 * The highlighted HTML is generated at build/render time, not on the client.
 *
 * @see PAY-061 in PRD for acceptance criteria
 * @see https://shiki.style/ for Shiki documentation
 */

import { codeToHtml } from 'shiki'

/**
 * Map of common language aliases to Shiki language IDs
 * This handles variations in how languages might be specified in Lexical
 */
const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  json: 'json',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  bash: 'bash',
  // Additional common languages
  html: 'html',
  css: 'css',
  sql: 'sql',
  yaml: 'yaml',
  yml: 'yaml',
  markdown: 'markdown',
  md: 'markdown',
}

/**
 * Supported languages for syntax highlighting
 * These are the primary languages specified in the PRD
 */
const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'bash',
  'json',
  'html',
  'css',
  'sql',
  'yaml',
  'markdown',
]

interface CodeBlockProps {
  /** The code content to highlight */
  code: string
  /** The programming language (optional, will be auto-detected if not provided) */
  language?: string
}

/**
 * Normalize language identifier to Shiki-compatible format
 */
function normalizeLanguage(lang?: string): string {
  if (!lang) return 'text'

  const normalized = lang.toLowerCase().trim()
  const mapped = LANGUAGE_MAP[normalized]

  if (mapped && SUPPORTED_LANGUAGES.includes(mapped)) {
    return mapped
  }

  // If the language is supported directly, use it
  if (SUPPORTED_LANGUAGES.includes(normalized)) {
    return normalized
  }

  // Default to plaintext for unsupported languages
  return 'text'
}

/**
 * Helper function to safely highlight code with fallback
 */
async function getHighlightedHtml(
  code: string,
  language: string
): Promise<{ html: string; success: boolean }> {
  try {
    const html = await codeToHtml(code, {
      lang: language,
      theme: 'github-dark',
    })
    return { html, success: true }
  } catch (error) {
    console.error('[CodeBlock] Syntax highlighting failed:', error)
    // Return escaped code as fallback
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return {
      html: `<pre class="p-4 overflow-x-auto text-sm text-gray-100"><code>${escapedCode}</code></pre>`,
      success: false,
    }
  }
}

/**
 * CodeBlock Component - Server Component for syntax highlighting
 *
 * Renders code with syntax highlighting using Shiki.
 * This is an async Server Component that generates highlighted HTML at render time.
 */
export async function CodeBlock({ code, language }: CodeBlockProps) {
  const normalizedLang = normalizeLanguage(language)
  const { html, success } = await getHighlightedHtml(code, normalizedLang)

  return (
    <div className={`code-block-wrapper not-prose my-6 rounded-lg overflow-hidden ${!success ? 'bg-gray-800' : ''}`}>
      {/* Language badge - only show when highlighting succeeded and language is known */}
      {success && normalizedLang !== 'text' && (
        <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 font-mono border-b border-gray-700">
          {normalizedLang}
        </div>
      )}
      {/* Code content */}
      <div
        className={success ? 'shiki-code overflow-x-auto text-sm [&>pre]:p-4 [&>pre]:m-0 [&>pre]:bg-[#24292e]' : ''}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

/**
 * Inline code component for short code snippets
 * Used for inline code like `const x = 1`
 */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono">
      {children}
    </code>
  )
}

/**
 * Highlight code and return HTML string
 * Utility function for use in content renderers
 *
 * @param code - The code string to highlight
 * @param language - The programming language
 * @returns Object with highlighted HTML and language
 */
export async function highlightCode(
  code: string,
  language?: string
): Promise<{ html: string; language: string }> {
  const normalizedLang = normalizeLanguage(language)

  try {
    const html = await codeToHtml(code, {
      lang: normalizedLang,
      theme: 'github-dark',
    })
    return { html, language: normalizedLang }
  } catch {
    // Return escaped HTML as fallback
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return {
      html: `<pre class="shiki"><code>${escapedCode}</code></pre>`,
      language: normalizedLang,
    }
  }
}

/**
 * HighlightedCodeBlock Component
 * Renders pre-highlighted HTML from highlightCode utility
 */
export function HighlightedCodeBlock({
  highlightedHtml,
  language,
}: {
  highlightedHtml: string
  language: string
}) {
  return (
    <div className="code-block-wrapper not-prose my-6 rounded-lg overflow-hidden">
      {/* Language badge */}
      {language !== 'text' && (
        <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 font-mono border-b border-gray-700">
          {language}
        </div>
      )}
      {/* Highlighted code - Shiki generates pre>code structure */}
      <div
        className="shiki-code overflow-x-auto text-sm [&>pre]:p-4 [&>pre]:m-0 [&>pre]:bg-[#24292e]"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  )
}
