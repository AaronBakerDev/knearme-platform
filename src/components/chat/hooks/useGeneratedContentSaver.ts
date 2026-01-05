import { useCallback, useEffect, type MutableRefObject } from 'react';
import type { UIMessage } from 'ai';
import type { ChatPhase, ExtractedProjectData } from '@/lib/chat/chat-types';
import type { GeneratePortfolioContentOutput } from '@/lib/chat/tool-schemas';
import { buildDescriptionBlocksFromContent } from '@/lib/content/description-blocks.client';
import { logger } from '@/lib/logging';

interface UseGeneratedContentSaverParams {
  projectId: string | null;
  messages: UIMessage[];
  extractedData: ExtractedProjectData;
  processedGeneratedToolCalls: MutableRefObject<Set<string>>;
  setPhase: (phase: ChatPhase) => void;
  setIsSavingContent: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  openFormPanel: () => void;
  onProjectUpdate?: () => void;
}

export function useGeneratedContentSaver({
  projectId,
  messages,
  extractedData,
  processedGeneratedToolCalls,
  setPhase,
  setIsSavingContent,
  setError,
  setSuccessMessage,
  openFormPanel,
  onProjectUpdate,
}: UseGeneratedContentSaverParams) {
  const saveGeneratedContent = useCallback(
    async (content: GeneratePortfolioContentOutput) => {
      if (!projectId || !content?.success) return;

      setIsSavingContent(true);
      setError(null);

      try {
        const payload: Record<string, unknown> = {
          title: content.title,
          description: content.description,
          description_blocks: buildDescriptionBlocksFromContent({
            description: content.description,
            materials: extractedData.materials_mentioned,
            techniques: extractedData.techniques_mentioned,
            duration: extractedData.duration,
            proudOf: extractedData.proud_of,
          }),
          seo_title: content.seoTitle || undefined,
          seo_description: content.seoDescription || undefined,
          tags: content.tags,
        };

        if (extractedData.materials_mentioned?.length) {
          payload.materials = extractedData.materials_mentioned;
        }

        if (extractedData.techniques_mentioned?.length) {
          payload.techniques = extractedData.techniques_mentioned;
        }

        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let message = 'Failed to save draft. Please try again.';
          try {
            const data = await response.json();
            if (data?.error?.message) {
              message = data.error.message;
            } else if (data?.message) {
              message = data.message;
            }
          } catch {
            // Ignore JSON parse errors and keep fallback message.
          }
          throw new Error(message);
        }

        setPhase('review');
        setSuccessMessage('Draft saved to your project.');
        onProjectUpdate?.();
        openFormPanel();
      } catch (err) {
        logger.error('[ChatWizard] Failed to save draft', { error: err });
        setError(err instanceof Error ? err.message : 'Failed to save draft. Please try again.');
      } finally {
        setIsSavingContent(false);
      }
    },
    [
      projectId,
      extractedData,
      setIsSavingContent,
      setError,
      setPhase,
      setSuccessMessage,
      onProjectUpdate,
      openFormPanel,
    ]
  );

  useEffect(() => {
    if (!projectId || messages.length === 0) return;

    for (const message of messages) {
      if (!message.parts || message.parts.length === 0) continue;

      for (const part of message.parts) {
        if (part.type !== 'tool-generatePortfolioContent') continue;
        const toolPart = part as {
          state?: string;
          toolCallId?: string;
          output?: unknown;
        };

        if (toolPart.state !== 'output-available' || !toolPart.output || !toolPart.toolCallId) {
          continue;
        }

        if (processedGeneratedToolCalls.current.has(toolPart.toolCallId)) {
          continue;
        }

        processedGeneratedToolCalls.current.add(toolPart.toolCallId);

        const output = toolPart.output as GeneratePortfolioContentOutput;
        if (!output.success) {
          if (output.error) {
            setError(output.error);
          }
          continue;
        }

        void saveGeneratedContent(output);
      }
    }
  }, [messages, projectId, saveGeneratedContent, processedGeneratedToolCalls, setError]);
}
