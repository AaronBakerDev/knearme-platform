type NarrativeInput = {
  summary?: string | null;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
  outcome_highlights?: string[] | null;
};

/**
 * Compose a project description from narrative sections.
 * Returns null if no meaningful content is provided.
 */
export function composeProjectDescription(input: NarrativeInput): string | null {
  const blocks: string[] = [];

  if (input.summary?.trim()) blocks.push(input.summary.trim());
  if (input.challenge?.trim()) blocks.push(`Challenge\n${input.challenge.trim()}`);
  if (input.solution?.trim()) blocks.push(`Solution\n${input.solution.trim()}`);
  if (input.results?.trim()) blocks.push(`Results\n${input.results.trim()}`);

  if (input.outcome_highlights && input.outcome_highlights.length > 0) {
    const lines = input.outcome_highlights
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `- ${item}`);
    if (lines.length > 0) {
      blocks.push(`Outcomes\n${lines.join('\n')}`);
    }
  }

  return blocks.length > 0 ? blocks.join('\n\n') : null;
}
