'use client'

/**
 * Rich Text Editor for project descriptions using TipTap.
 *
 * Features:
 * - Bold, italic, bullet lists, numbered lists formatting
 * - Word count with minimum requirement indicator (200 words)
 * - Character count display
 * - Mobile-friendly toolbar with touch targets
 * - Autosave callback with debounce support
 * - Placeholder text
 *
 * @see https://tiptap.dev/docs/editor/introduction
 * @see src/app/(dashboard)/projects/[id]/edit/page.tsx - Integration point
 */

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
} from 'lucide-react'

interface RichTextEditorProps {
  /** Initial content (can be HTML or plain text) */
  content: string
  /** Callback when content changes */
  onChange: (html: string) => void
  /** Toolbar layout variant */
  toolbarVariant?: 'full' | 'compact'
  /** Placeholder text shown when editor is empty */
  placeholder?: string
  /** Minimum word count required (shows indicator if below) */
  minWords?: number
  /** Maximum character count (optional hard limit) */
  maxChars?: number
  /** Disable editing */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Count words in a text string.
 * Handles edge cases like multiple spaces and punctuation.
 */
function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  // Split on whitespace and filter out empty strings
  return trimmed.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Toolbar button component with consistent styling and touch targets.
 */
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        // Minimum 44x44px touch target for mobile
        'h-11 w-11 p-0 min-w-[44px]',
        isActive && 'bg-muted text-primary'
      )}
    >
      {children}
    </Button>
  )
}

/**
 * Editor toolbar with formatting buttons.
 */
function EditorToolbar({
  editor,
  disabled,
  variant = 'full',
}: {
  editor: Editor | null
  disabled?: boolean
  variant?: 'full' | 'compact'
}) {
  if (!editor) return null

  const showHistoryControls = variant === 'full'

  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-2 bg-muted/50">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        disabled={disabled}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        disabled={disabled}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        disabled={disabled}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        disabled={disabled}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      {showHistoryControls && (
        <div className="w-px h-6 bg-border mx-1 self-center" />
      )}

      {showHistoryControls && (
        <>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
    </div>
  )
}

/**
 * Word/character count display with progress indicator.
 */
function CountDisplay({
  wordCount,
  charCount,
  minWords,
  maxChars,
}: {
  wordCount: number
  charCount: number
  minWords?: number
  maxChars?: number
}) {
  const isUnderMinWords = minWords && wordCount < minWords
  const isOverMaxChars = maxChars && charCount > maxChars

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30 text-sm">
      <div className="flex items-center gap-4">
        {/* Word count with progress */}
        <span className={cn(isUnderMinWords && 'text-amber-600')}>
          {wordCount} words
          {minWords && (
            <span className="text-muted-foreground">
              {' '}/ {minWords} min
            </span>
          )}
        </span>

        {/* Character count */}
        <span className={cn('text-muted-foreground', isOverMaxChars && 'text-destructive')}>
          {charCount.toLocaleString()} chars
          {maxChars && ` / ${maxChars.toLocaleString()}`}
        </span>
      </div>

      {/* Progress indicator for minimum words */}
      {minWords && (
        <div className="flex items-center gap-2">
          {isUnderMinWords ? (
            <span className="text-amber-600 text-xs">
              {minWords - wordCount} more words needed
            </span>
          ) : (
            <span className="text-green-600 text-xs">
              Minimum reached
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  toolbarVariant = 'full',
  placeholder = 'Describe your project...',
  minWords = 200,
  maxChars,
  disabled = false,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading since we only want basic formatting
        heading: false,
        // Disable code/codeBlock since not relevant for project descriptions
        code: false,
        codeBlock: false,
      }),
      CharacterCount.configure({
        limit: maxChars,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    // Ensure consistent rendering on server/client
    immediatelyRender: false,
  })

  // Update editor content when prop changes (e.g., loading from API)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  // Get counts for display
  const text = editor?.getText() || ''
  const wordCount = countWords(text)
  const charCount = editor?.storage.characterCount.characters() || 0

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <EditorToolbar editor={editor} disabled={disabled} variant={toolbarVariant} />

      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none',
          // Minimum height for comfortable editing
          'min-h-[200px] p-4',
          // Style the placeholder
          '[&_.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.is-editor-empty:first-child::before]:float-left',
          '[&_.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.is-editor-empty:first-child::before]:h-0',
          // Focus styles for the editor content area
          '[&_.ProseMirror]:outline-none',
          '[&_.ProseMirror]:min-h-[160px]',
          // List styles
          '[&_ul]:list-disc [&_ul]:pl-6',
          '[&_ol]:list-decimal [&_ol]:pl-6',
          '[&_li]:my-1',
        )}
      />

      <CountDisplay
        wordCount={wordCount}
        charCount={charCount}
        minWords={minWords}
        maxChars={maxChars}
      />
    </div>
  )
}

export default RichTextEditor
