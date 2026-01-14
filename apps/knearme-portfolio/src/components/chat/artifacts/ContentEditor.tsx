'use client';

/**
 * ContentEditor artifact.
 *
 * Inline editor for AI-generated content inside chat.
 * Reuses the TipTap RichTextEditor with a compact toolbar.
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md for specification
 */

import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { FileText } from 'lucide-react';
import { Input, Textarea, Button } from '@/components/ui';
import { RichTextEditor } from '@/components/edit/RichTextEditor';
import { cn } from '@/lib/utils';
import type { ContentEditorData } from '@/types/artifacts';

/**
 * Allowed HTML tags for sanitized description content.
 * Matches TipTap StarterKit output minus dangerous elements.
 */
const ALLOWED_TAGS = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'];

interface ContentEditorProps {
  /** Initial content from tool output */
  data: ContentEditorData;
  /** Callback for artifact actions */
  onAction?: (action: { type: string; payload?: unknown }) => void;
  /** Optional additional className */
  className?: string;
  /**
   * Whether a save operation is in progress.
   * Disables buttons to prevent duplicate submissions.
   * @see /src/components/chat/ChatWizard.tsx isSavingContent state
   */
  isSaving?: boolean;
}

const TITLE_MIN = 5;
const TITLE_MAX = 100;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 5000;
const SEO_TITLE_MIN = 30;
const SEO_TITLE_MAX = 60;
const SEO_DESCRIPTION_MIN = 120;
const SEO_DESCRIPTION_MAX = 160;

/**
 * Strip HTML tags to get plain text for character counting.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Only allows safe formatting tags from TipTap output.
 */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [], // No attributes allowed
  });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

export function ContentEditor({ data, onAction, className, isSaving }: ContentEditorProps) {
  const [title, setTitle] = useState(data.title || '');
  const [description, setDescription] = useState(data.description || '');
  const [seoTitle, setSeoTitle] = useState(data.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(data.seo_description || '');

  // Task B2: Track if user has made edits
  const [hasEdited, setHasEdited] = useState(false);

  const editable = data.editable !== false;
  const canRegenerate = editable && Boolean(onAction);

  // Task B2: Track edits on field change
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
    setHasEdited(true);
  };

  const handleDescriptionChange = (html: string) => {
    setDescription(html);
    setHasEdited(true);
  };

  const handleSeoTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeoTitle(event.target.value);
    setHasEdited(true);
  };

  const handleSeoDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSeoDescription(event.target.value);
    setHasEdited(true);
  };

  const descriptionText = useMemo(() => stripHtml(description), [description]);
  const descriptionLength = descriptionText.length;

  // Task A2: Use trim().length consistently for both min and max checks
  const trimmedTitleLength = title.trim().length;
  const titleError =
    trimmedTitleLength < TITLE_MIN
      ? `Title should be at least ${TITLE_MIN} characters.`
      : trimmedTitleLength > TITLE_MAX
        ? `Title should be under ${TITLE_MAX} characters.`
        : null;

  const descriptionError =
    descriptionLength < DESCRIPTION_MIN
      ? `Description should be at least ${DESCRIPTION_MIN} characters.`
      : descriptionLength > DESCRIPTION_MAX
        ? `Description should be under ${DESCRIPTION_MAX} characters.`
        : null;

  // Task A3: Add minimum validation for SEO fields when non-empty
  const trimmedSeoTitleLength = seoTitle.trim().length;
  const seoTitleError =
    trimmedSeoTitleLength > 0 && trimmedSeoTitleLength < SEO_TITLE_MIN
      ? `SEO title should be at least ${SEO_TITLE_MIN} characters when provided.`
      : trimmedSeoTitleLength > SEO_TITLE_MAX
        ? `SEO title should be under ${SEO_TITLE_MAX} characters.`
        : null;

  const trimmedSeoDescriptionLength = seoDescription.trim().length;
  const seoDescriptionError =
    trimmedSeoDescriptionLength > 0 && trimmedSeoDescriptionLength < SEO_DESCRIPTION_MIN
      ? `SEO description should be at least ${SEO_DESCRIPTION_MIN} characters when provided.`
      : trimmedSeoDescriptionLength > SEO_DESCRIPTION_MAX
        ? `SEO description should be under ${SEO_DESCRIPTION_MAX} characters.`
        : null;

  const isValid = !titleError && !descriptionError && !seoTitleError && !seoDescriptionError;

  const handleAccept = () => {
    // Task A1: Sanitize HTML content before sending to prevent XSS
    onAction?.({
      type: 'accept',
      payload: {
        title: title.trim(),
        description: sanitizeHtml(description),
        seo_title: seoTitle.trim() || undefined,
        seo_description: seoDescription.trim() || undefined,
        tags: data.tags,
        materials: data.materials,
        techniques: data.techniques,
      },
    });
  };

  const handleAcceptAndPublish = () => {
    // Task A1: Sanitize HTML content before sending to prevent XSS
    onAction?.({
      type: 'acceptAndPublish',
      payload: {
        title: title.trim(),
        description: sanitizeHtml(description),
        seo_title: seoTitle.trim() || undefined,
        seo_description: seoDescription.trim() || undefined,
        tags: data.tags,
        materials: data.materials,
        techniques: data.techniques,
      },
    });
  };

  const handleReject = () => {
    onAction?.({ type: 'reject' });
  };

  const handleRegenerate = (section: 'title' | 'description' | 'seo') => {
    if (!canRegenerate) return;
    onAction?.({
      type: 'regenerate',
      payload: {
        section,
        current: {
          title,
          description,
          seo_title: seoTitle,
          seo_description: seoDescription,
          tags: data.tags,
          materials: data.materials,
          techniques: data.techniques,
        },
      },
    });
  };

  const previewTitle = seoTitle.trim() || title.trim() || 'Project title';
  const previewDescription = seoDescription.trim() || descriptionText || 'Short description...';

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm',
        'animate-canvas-item-in',
        className
      )}
      data-testid="content-editor"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Content Editor</h4>
        </div>
        {!editable && (
          <span className="text-xs text-muted-foreground">Read-only</span>
        )}
      </div>

      <div className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <label className="font-medium" htmlFor="content-editor-title">Title</label>
              {canRegenerate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleRegenerate('title')}
                  data-testid="regenerate-title"
                >
                  Regenerate
                </Button>
              )}
            </div>
            <span
              className={cn(
                'text-xs',
                titleError ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {trimmedTitleLength}/{TITLE_MAX}
            </span>
          </div>
          <Input
            id="content-editor-title"
            value={title}
            onChange={handleTitleChange}
            disabled={!editable}
            placeholder="Project title"
            className={cn(titleError && 'border-destructive focus-visible:ring-destructive')}
            data-testid="title"
          />
          {titleError && (
            <p className="text-xs text-destructive">{titleError}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <label className="font-medium">Description</label>
            {canRegenerate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleRegenerate('description')}
                data-testid="regenerate-description"
              >
                Regenerate
              </Button>
            )}
          </div>
          <RichTextEditor
            content={description}
            onChange={handleDescriptionChange}
            placeholder="Describe the project..."
            minWords={0}
            maxChars={DESCRIPTION_MAX}
            disabled={!editable}
            toolbarVariant="compact"
            className={cn(descriptionError && 'border-destructive focus-within:ring-destructive')}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={cn(descriptionError && 'text-destructive')}>
              {descriptionLength.toLocaleString()}/{DESCRIPTION_MAX} characters
            </span>
            <span>{DESCRIPTION_MIN} character minimum</span>
          </div>
          {descriptionError && (
            <p className="text-xs text-destructive">{descriptionError}</p>
          )}
        </div>

        {/* SEO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>SEO</span>
            {canRegenerate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleRegenerate('seo')}
                data-testid="regenerate-seo"
              >
                Regenerate
              </Button>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="content-editor-seo-title">SEO Title</label>
              <span
                className={cn(
                  'text-xs',
                  seoTitleError ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {trimmedSeoTitleLength}/{SEO_TITLE_MAX}
              </span>
            </div>
            <Input
              id="content-editor-seo-title"
              value={seoTitle}
              onChange={handleSeoTitleChange}
              disabled={!editable}
              placeholder="SEO title"
              className={cn(seoTitleError && 'border-destructive focus-visible:ring-destructive')}
            />
            {seoTitleError && (
              <p className="text-xs text-destructive">{seoTitleError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="content-editor-seo-description">SEO Description</label>
              <span
                className={cn(
                  'text-xs',
                  seoDescriptionError ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {trimmedSeoDescriptionLength}/{SEO_DESCRIPTION_MAX}
              </span>
            </div>
            <Textarea
              id="content-editor-seo-description"
              value={seoDescription}
              onChange={handleSeoDescriptionChange}
              disabled={!editable}
              placeholder="SEO description"
              className={cn(
                'min-h-[90px]',
                seoDescriptionError && 'border-destructive focus-visible:ring-destructive'
              )}
            />
            {seoDescriptionError && (
              <p className="text-xs text-destructive">{seoDescriptionError}</p>
            )}
          </div>

          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">Search preview</div>
            <div className="text-sm font-medium text-primary">
              {truncate(previewTitle || 'Project title', SEO_TITLE_MAX)}
            </div>
            <div className="text-xs text-muted-foreground">
              {truncate(previewDescription || 'Short description...', SEO_DESCRIPTION_MAX)}
            </div>
          </div>
        </div>
      </div>

      {editable && (
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            type="button"
          >
            Reject
          </Button>
          <Button
            variant="outline"
            onClick={handleAccept}
            type="button"
            disabled={!isValid || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            onClick={handleAcceptAndPublish}
            type="button"
            disabled={!isValid || isSaving}
            className={cn(
              // Task B2: Visual cue for fast-path when content is unedited
              !hasEdited && isValid && 'ring-2 ring-primary ring-offset-2 animate-pulse'
            )}
          >
            {isSaving ? 'Publishing...' : !hasEdited ? 'Looks good! Publish' : 'Accept & Publish'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ContentEditor;
