import {
  SemanticBlockSchema,
  type BeforeAfterBlock,
  type CalloutBlock,
  type CtaSectionBlock,
  type HeadingBlock,
  type HeroSectionBlock,
  type ImageGalleryBlock,
  type ListBlock,
  type ParagraphBlock,
  type ProcessStepBlock,
  type SemanticBlock,
  type TestimonialBlock,
} from './semantic-blocks.schema';

// =============================================================================
// Block Type Guards
// =============================================================================

export function isTextBlock(
  block: SemanticBlock
): block is ParagraphBlock | HeadingBlock | ListBlock | CalloutBlock {
  return ['paragraph', 'heading', 'list', 'callout'].includes(block.type);
}

export function isImageBlock(
  block: SemanticBlock
): block is
  | HeroSectionBlock
  | BeforeAfterBlock
  | ImageGalleryBlock
  | TestimonialBlock
  | ProcessStepBlock {
  return ['hero-section', 'before-after', 'image-gallery', 'testimonial', 'process-step'].includes(
    block.type
  );
}

export function isActionBlock(
  block: SemanticBlock
): block is CtaSectionBlock {
  return block.type === 'cta-section';
}

// =============================================================================
// Utility Functions
// =============================================================================

export function extractImageIds(blocks: SemanticBlock[]): string[] {
  const ids = new Set<string>();

  for (const block of blocks) {
    switch (block.type) {
      case 'hero-section':
        block.imageIds.forEach((id) => ids.add(id));
        break;
      case 'before-after':
        ids.add(block.beforeImageId);
        ids.add(block.afterImageId);
        break;
      case 'image-gallery':
        block.imageIds.forEach((id) => ids.add(id));
        break;
      case 'testimonial':
        if (block.imageId) ids.add(block.imageId);
        break;
      case 'process-step':
        if (block.imageId) ids.add(block.imageId);
        break;
    }
  }

  return Array.from(ids);
}

function normalizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

export function sanitizeSemanticBlocks(input: unknown): SemanticBlock[] {
  if (!Array.isArray(input)) return [];

  const result: SemanticBlock[] = [];

  for (const item of input) {
    const parsed = SemanticBlockSchema.safeParse(item);
    if (parsed.success) {
      const block = parsed.data;
      switch (block.type) {
        case 'paragraph':
          result.push({ ...block, text: normalizeText(block.text) });
          break;
        case 'heading':
          result.push({ ...block, text: normalizeText(block.text) });
          break;
        case 'callout':
          result.push({
            ...block,
            text: normalizeText(block.text),
            title: block.title ? normalizeText(block.title) : undefined,
          });
          break;
        case 'feature-card':
          result.push({
            ...block,
            title: normalizeText(block.title),
            content: normalizeText(block.content),
          });
          break;
        case 'testimonial':
          result.push({
            ...block,
            quote: normalizeText(block.quote),
            attribution: block.attribution ? normalizeText(block.attribution) : undefined,
          });
          break;
        case 'cta-section':
          result.push({
            ...block,
            heading: normalizeText(block.heading),
            body: block.body ? normalizeText(block.body) : undefined,
            buttonText: normalizeText(block.buttonText),
          });
          break;
        case 'process-step':
          result.push({
            ...block,
            title: normalizeText(block.title),
            content: normalizeText(block.content),
          });
          break;
        default:
          result.push(block);
      }
    }
  }

  return result;
}

export function semanticBlocksToPlainText(blocks: SemanticBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
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
      case 'hero-section':
        if (block.title) parts.push(block.title);
        if (block.subtitle) parts.push(block.subtitle);
        break;
      case 'before-after':
        if (block.caption) parts.push(block.caption);
        break;
      case 'feature-card':
        parts.push(`${block.title}: ${block.content}`);
        break;
      case 'testimonial':
        parts.push(block.quote);
        if (block.attribution) parts.push(`- ${block.attribution}`);
        break;
      case 'cta-section':
        parts.push(block.heading);
        if (block.body) parts.push(block.body);
        break;
      case 'stats':
        parts.push(block.items.map((item) => `${item.label}: ${item.value}`).join('\n'));
        break;
      case 'process-step':
        parts.push(`${block.stepNumber}. ${block.title}: ${block.content}`);
        break;
      case 'materials-list':
        if (block.title) parts.push(block.title);
        parts.push(
          block.items
            .map((item) =>
              item.description ? `${item.name} - ${item.description}` : item.name
            )
            .join('\n')
        );
        break;
    }
  }

  return parts.join('\n\n').trim();
}

export function countBlocksByType(blocks: SemanticBlock[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const block of blocks) {
    counts[block.type] = (counts[block.type] || 0) + 1;
  }

  return counts;
}
