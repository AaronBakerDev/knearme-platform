import type { DescriptionBlock } from './description-blocks';
import { sanitizeDescriptionBlocks } from './description-blocks';

function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeText(paragraph))
    .filter(Boolean);
}

export function parseDescriptionBlocksFromHtml(html: string): DescriptionBlock[] {
  const trimmed = html.trim();
  if (!trimmed) return [];

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    const paragraphs = splitParagraphs(trimmed);
    return sanitizeDescriptionBlocks(
      paragraphs.map((text) => ({ type: 'paragraph', text }))
    );
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, 'text/html');
  const blocks: DescriptionBlock[] = [];

  const nodes = Array.from(doc.body.childNodes);

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeText(node.textContent);
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    const tag = node.tagName.toLowerCase();
    const textContent = normalizeText(node.textContent);

    if (!textContent) return;

    if (tag === 'h2' || tag === 'h3') {
      blocks.push({
        type: 'heading',
        level: tag === 'h2' ? '2' : '3',
        text: textContent,
      });
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(node.querySelectorAll('li'))
        .map((li) => normalizeText(li.textContent))
        .filter(Boolean);
      if (items.length > 0) {
        blocks.push({
          type: 'list',
          style: tag === 'ol' ? 'number' : 'bullet',
          items,
        });
      }
      return;
    }

    if (tag === 'blockquote') {
      blocks.push({
        type: 'quote',
        text: textContent,
      });
      return;
    }

    blocks.push({ type: 'paragraph', text: textContent });
  });

  if (blocks.length === 0) {
    const paragraphs = splitParagraphs(trimmed);
    blocks.push(...paragraphs.map((text) => ({ type: 'paragraph' as const, text })));
  }

  return sanitizeDescriptionBlocks(blocks);
}

export function buildDescriptionBlocksFromContent({
  description,
  materials,
  techniques,
  duration,
  proudOf,
}: {
  description: string;
  materials?: string[];
  techniques?: string[];
  duration?: string;
  proudOf?: string;
}): DescriptionBlock[] {
  const blocks = parseDescriptionBlocksFromHtml(description);

  if (materials && materials.length > 0) {
    blocks.push({ type: 'heading', level: '2', text: 'Materials Used' });
    blocks.push({ type: 'list', style: 'bullet', items: materials });
  }

  if (techniques && techniques.length > 0) {
    blocks.push({ type: 'heading', level: '2', text: 'Techniques' });
    blocks.push({ type: 'list', style: 'bullet', items: techniques });
  }

  if (duration) {
    blocks.push({ type: 'callout', variant: 'info', title: 'Timeline', text: duration });
  }

  if (proudOf) {
    blocks.push({ type: 'callout', variant: 'tip', title: 'Proud Of', text: proudOf });
  }

  return sanitizeDescriptionBlocks(blocks);
}
