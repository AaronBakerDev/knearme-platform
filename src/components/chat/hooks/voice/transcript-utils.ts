export type TranscriptMergeInput = {
  currentText: string;
  incomingText: string;
  isFinal: boolean;
};

export function mergeTranscriptText({
  currentText,
  incomingText,
  isFinal,
}: TranscriptMergeInput): string {
  if (!incomingText) return currentText;

  if (incomingText.length >= currentText.length || isFinal) {
    return incomingText;
  }

  if (!currentText.includes(incomingText)) {
    return `${currentText} ${incomingText}`.trim();
  }

  return currentText;
}

export function shouldCommitTranscript(text: string, lastText: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return trimmed !== lastText;
}
