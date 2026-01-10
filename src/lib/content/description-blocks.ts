import { z } from 'zod';

const MAX_TEXT_LENGTH = 2000;
const MAX_LIST_ITEMS = 20;
const MAX_BLOCKS = 200;
const MAX_STATS = 8;

const textSchema = z.string().trim().min(1).max(MAX_TEXT_LENGTH);

const paragraphBlock = z.object({
  type: z.literal('paragraph'),
  text: textSchema,
});

/**
 * Heading levels as strings for Gemini API compatibility.
 * Gemini requires enum values to be strings, not numbers.
 * We convert to numbers during preprocessing before HTML rendering.
 *
 * IMPORTANT: Use z.enum() instead of z.union([z.literal()]) because
 * Vercel AI SDK converts z.union to anyOf with numeric enum values
 * which fails Gemini validation.
 *
 * @see preprocessBlocks() for string→number conversion
 */
const headingLevelSchema = z.enum(['2', '3']);

const headingBlock = z.object({
  type: z.literal('heading'),
  level: headingLevelSchema,
  text: textSchema,
});

const listBlock = z.object({
  type: z.literal('list'),
  style: z.enum(['bullet', 'number']),
  items: z.array(textSchema).max(MAX_LIST_ITEMS),
});

const calloutBlock = z.object({
  type: z.literal('callout'),
  variant: z.enum(['info', 'tip', 'warning']),
  title: z.string().trim().max(120).optional(),
  text: textSchema,
});

const statsBlock = z.object({
  type: z.literal('stats'),
  items: z.array(
    z.object({
      label: z.string().trim().min(1).max(80),
      value: z.string().trim().min(1).max(60),
    })
  ).max(MAX_STATS),
});

const quoteBlock = z.object({
  type: z.literal('quote'),
  text: textSchema,
  cite: z.string().trim().max(120).optional(),
});

const descriptionBlockSchema = z.discriminatedUnion('type', [
  paragraphBlock,
  headingBlock,
  listBlock,
  calloutBlock,
  statsBlock,
  quoteBlock,
]);

export const descriptionBlocksSchema = z.array(descriptionBlockSchema).max(MAX_BLOCKS);

/** Output type of a single description block (after transforms are applied) */
export type DescriptionBlock = z.output<typeof descriptionBlockSchema>;

function normalizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Preprocess input to normalize block fields.
 * - Converts heading level from number to string (for Gemini API compatibility)
 * - Adds default variant to callouts
 */
function preprocessBlocks(input: unknown): unknown {
  if (!Array.isArray(input)) return input;
  return input.map((block) => {
    if (typeof block === 'object' && block !== null && 'type' in block) {
      const b = block as Record<string, unknown>;
      // Convert heading level to string (Gemini sends strings, legacy code may send numbers)
      if (b.type === 'heading' && typeof b.level === 'number') {
        return { ...b, level: String(b.level) };
      }
      // Add default variant to callouts
      if (b.type === 'callout' && !b.variant) {
        return { ...b, variant: 'info' };
      }
    }
    return block;
  });
}

export function sanitizeDescriptionBlocks(input: unknown): DescriptionBlock[] {
  const preprocessed = preprocessBlocks(input);
  const parsed = descriptionBlocksSchema.safeParse(preprocessed);
  if (!parsed.success) return [];

  const cleaned = parsed.data
    .map((block) => {
      switch (block.type) {
        case 'paragraph': {
          const text = normalizeText(block.text);
          return text ? { ...block, text } : null;
        }
        case 'heading': {
          const text = normalizeText(block.text);
          return text ? { ...block, text } : null;
        }
        case 'list': {
          const items = block.items
            .map((item) => normalizeText(item))
            .filter(Boolean);
          return items.length > 0 ? { ...block, items } : null;
        }
        case 'callout': {
          const text = normalizeText(block.text);
          if (!text) return null;
          const title = block.title ? normalizeText(block.title) : undefined;
          return { ...block, text, title };
        }
        case 'stats': {
          const items = block.items
            .map((item) => ({
              label: normalizeText(item.label),
              value: normalizeText(item.value),
            }))
            .filter((item) => item.label && item.value);
          return items.length > 0 ? { ...block, items } : null;
        }
        case 'quote': {
          const text = normalizeText(block.text);
          if (!text) return null;
          const cite = block.cite ? normalizeText(block.cite) : undefined;
          return { ...block, text, cite };
        }
        default:
          return null;
      }
    })
    .filter((block) => block !== null) as DescriptionBlock[];

  return cleaned;
}

export function blocksToPlainText(blocks: DescriptionBlock[]): string {
  const parts: string[] = [];

  blocks.forEach((block) => {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
        parts.push(block.text);
        break;
      case 'list':
        parts.push(block.items.join('\n'));
        break;
      case 'callout':
        parts.push(`${block.title ? `${block.title}: ` : ''}${block.text}`);
        break;
      case 'stats':
        parts.push(
          block.items.map((item) => `${item.label}: ${item.value}`).join('\n')
        );
        break;
      case 'quote':
        parts.push(block.text);
        if (block.cite) {
          parts.push(`— ${block.cite}`);
        }
        break;
      default:
        break;
    }
  });

  return parts.join('\n\n').trim();
}

/**
 * Check if a string contains HTML tags.
 *
 * Used to determine whether to render description as HTML or plain text.
 * Extracted from public page components for reuse.
 *
 * @param text - Text to check for HTML tags
 * @returns true if text contains HTML-like patterns
 */
export function hasHtmlTags(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

export function blocksToHtml(blocks: DescriptionBlock[]): string {
  const htmlParts: string[] = [];

  blocks.forEach((block) => {
    switch (block.type) {
      case 'paragraph':
        htmlParts.push(`<p>${escapeHtml(block.text)}</p>`);
        break;
      case 'heading': {
        const tag = block.level === '2' ? 'h2' : 'h3';
        htmlParts.push(`<${tag}>${escapeHtml(block.text)}</${tag}>`);
        break;
      }
      case 'list': {
        const tag = block.style === 'number' ? 'ol' : 'ul';
        const items = block.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('');
        htmlParts.push(`<${tag}>${items}</${tag}>`);
        break;
      }
      case 'callout': {
        const title = block.title
          ? `<strong>${escapeHtml(block.title)}:</strong> `
          : '';
        htmlParts.push(`<p>${title}${escapeHtml(block.text)}</p>`);
        break;
      }
      case 'stats': {
        block.items.forEach((item) => {
          htmlParts.push(
            `<p><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</p>`
          );
        });
        break;
      }
      case 'quote': {
        const cite = block.cite ? `<cite>${escapeHtml(block.cite)}</cite>` : '';
        htmlParts.push(
          `<blockquote><p>${escapeHtml(block.text)}</p>${cite}</blockquote>`
        );
        break;
      }
      default:
        break;
    }
  });

  return htmlParts.join('');
}
