/**
 * Parse AI text to separate thinking blocks from conversational content.
 *
 * Gemini's thinking feature (when enabled with thinkingConfig) outputs
 * internal reasoning with bold headers like:
 *   **Evaluating Current Status**
 *   Internal reasoning text...
 *
 * This parser identifies and extracts these blocks so they can be
 * rendered as collapsible ThinkingBlock components.
 *
 * @see /src/components/chat/ThinkingBlock.tsx
 * @see /src/app/api/chat/route.ts (thinkingConfig)
 */

/**
 * Segment types returned by the parser.
 */
export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'thinking'; header: string; content: string };

/**
 * Common thinking header patterns that indicate AI reasoning.
 * These are typically gerund phrases (verb + -ing).
 */
const THINKING_KEYWORDS = [
  'Commencing',
  'Evaluating',
  'Reassessing',
  'Starting',
  'Clarifying',
  'Refining',
  'Processing',
  'Analyzing',
  'Considering',
  'Reviewing',
  'Checking',
  'Determining',
  'Assessing',
  'Planning',
  'Preparing',
  'Understanding',
  'Formulating',
  'Crafting',
  'Building',
  'Gathering',
];

/**
 * Remove raw tool call markers from text.
 * These appear when tool calls are stringified into text content
 * (e.g., "[Tool: checkPublishReady]" or "[Tool: updateField, args...]").
 */
function stripToolMarkers(text: string): string {
  // Pattern: [Tool: toolName] or [Tool: toolName, args...]
  return text.replace(/\[Tool:\s*[^\]]+\]/g, '').trim();
}

/**
 * Check if a header looks like a thinking header.
 * Must start with a thinking keyword and be a reasonable title.
 */
function isThinkingHeader(header: string): boolean {
  const trimmed = header.trim();
  // Must start with a thinking keyword
  const startsWithKeyword = THINKING_KEYWORDS.some((keyword) =>
    trimmed.startsWith(keyword)
  );
  // Must be title-like (not too long, no code)
  const isTitleLike = trimmed.length < 60 && !trimmed.includes('`');
  return startsWithKeyword && isTitleLike;
}

/**
 * Parse text content to identify and extract thinking blocks.
 *
 * @param text - Raw text content from AI response
 * @returns Array of segments (text or thinking blocks)
 *
 * @example
 * const segments = parseThinking(`
 * **Evaluating Current Status**
 * I'm reviewing the project details...
 *
 * Great! Let me help you with that.
 * `);
 * // Returns:
 * // [
 * //   { type: 'thinking', header: 'Evaluating Current Status', content: "I'm reviewing..." },
 * //   { type: 'text', content: 'Great! Let me help you with that.' }
 * // ]
 */
export function parseThinking(text: string): TextSegment[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const segments: TextSegment[] = [];

  // Pattern: **Header** followed by content until next **Header** or end
  // The header must be on its own line or at start
  const pattern = /(?:^|\n)\*\*([^*\n]+)\*\*\s*\n([\s\S]*?)(?=\n\*\*[^*\n]+\*\*\s*\n|$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Make a copy of text for pattern matching
  const textToMatch = text;

  while ((match = pattern.exec(textToMatch)) !== null) {
    const header = match[1]?.trim() ?? '';
    const content = match[2]?.trim() ?? '';
    const matchStart = match.index;

    // Only treat as thinking if the header looks like a thinking header
    if (isThinkingHeader(header)) {
      // Add any text before this match as regular text
      if (matchStart > lastIndex) {
        const beforeText = stripToolMarkers(text.slice(lastIndex, matchStart));
        if (beforeText) {
          segments.push({ type: 'text', content: beforeText });
        }
      }

      // Add the thinking block
      if (content) {
        segments.push({ type: 'thinking', header, content });
      }

      lastIndex = match.index + match[0].length;
    }
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    const remainingText = stripToolMarkers(text.slice(lastIndex));
    if (remainingText) {
      segments.push({ type: 'text', content: remainingText });
    }
  }

  // If no thinking blocks found, return the whole text as a single segment
  if (segments.length === 0 && text.trim()) {
    const cleanedText = stripToolMarkers(text);
    // Fallback: if stripToolMarkers returns empty but original had content,
    // return the original text to avoid rendering nothing
    const contentToUse = cleanedText || text.trim();
    segments.push({ type: 'text', content: contentToUse });
  }

  return segments;
}

/**
 * Check if text contains any thinking blocks.
 * Useful for quick checks without full parsing.
 */
export function hasThinkingBlocks(text: string): boolean {
  if (!text) return false;

  // Quick check for bold header pattern
  const quickPattern = /\*\*([^*]+)\*\*\s*\n/;
  const match = text.match(quickPattern);

  if (!match || !match[1]) return false;

  // Verify it's actually a thinking header
  return isThinkingHeader(match[1]);
}
