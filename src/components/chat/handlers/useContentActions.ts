import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { buildDescriptionBlocksFromContent } from '@/lib/content/description-blocks.client';
import type { ChatPhase, ExtractedProjectData, GeneratedContent } from '@/lib/chat/chat-types';
import type { ArtifactAction } from './types';

type UseContentActionsParams = {
  projectId: string | null;
  extractedData: ExtractedProjectData;
  setPhase: Dispatch<SetStateAction<ChatPhase>>;
  setIsSavingContent: Dispatch<SetStateAction<boolean>>;
  setIsRegenerating: Dispatch<SetStateAction<boolean>>;
  setRegeneratingSection: Dispatch<SetStateAction<'title' | 'description' | 'seo' | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSuccessMessage: Dispatch<SetStateAction<string | null>>;
  setExtractedData: Dispatch<SetStateAction<ExtractedProjectData>>;
  logPreviewEvent: (event: string, details?: Record<string, unknown>) => void;
  onProjectUpdate?: () => void;
  handleGenerate: () => void;
  updateContentEditorOutput: (content: GeneratedContent) => void;
  applyDescriptionBlocks: (blocks: unknown) => Promise<boolean>;
};

export function useContentActions({
  projectId,
  extractedData,
  setPhase,
  setIsSavingContent,
  setIsRegenerating,
  setRegeneratingSection,
  setError,
  setSuccessMessage,
  setExtractedData,
  logPreviewEvent,
  onProjectUpdate,
  handleGenerate,
  updateContentEditorOutput,
  applyDescriptionBlocks,
}: UseContentActionsParams) {
  return useCallback(
    (action: ArtifactAction): boolean => {
      if (action.type === 'accept') {
        const payload = action.payload as {
          title: string;
          description: string;
          seo_title?: string;
          seo_description?: string;
          tags?: string[];
          materials?: string[];
          techniques?: string[];
        };

        if (!payload?.title || !payload?.description) {
          setError('Missing content to save. Please try again.');
          return true;
        }

        setIsSavingContent(true);
        setError(null);

        void (async () => {
          try {
            const response = await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: payload.title,
                description: payload.description,
                description_blocks: buildDescriptionBlocksFromContent({
                  description: payload.description,
                  materials: extractedData.materials_mentioned,
                  techniques: extractedData.techniques_mentioned,
                  duration: extractedData.duration,
                  proudOf: extractedData.proud_of,
                }),
                seo_title: payload.seo_title,
                seo_description: payload.seo_description,
                tags: payload.tags,
                materials: payload.materials,
                techniques: payload.techniques,
              }),
            });

            if (!response.ok) {
              let message = 'Failed to save content. Please try again.';
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
            setSuccessMessage('Content saved to your project.');
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Failed to save content:', err);
            setError(err instanceof Error ? err.message : 'Failed to save content. Please try again.');
          } finally {
            setIsSavingContent(false);
          }
        })();

        return true;
      }

      if (action.type === 'reject') {
        setPhase('review');
        setSuccessMessage('Okay, we can keep refining. Tell me what you want to change.');
        return true;
      }

      if (action.type === 'regenerate' || action.type === 'regenerateSection') {
        const payload = action.payload as {
          section?: 'title' | 'description' | 'seo';
          guidance?: string;
          preserveElements?: string[];
          current?: {
            title?: string;
            description?: string;
            seo_title?: string;
            seo_description?: string;
            tags?: string[];
            materials?: string[];
            techniques?: string[];
          };
        };

        const section = payload?.section;
        if (!section) {
          handleGenerate();
          return true;
        }

        const feedbackParts: string[] = [];
        if (section === 'title') {
          feedbackParts.push('Regenerate only the title.');
        } else if (section === 'description') {
          feedbackParts.push('Regenerate only the description.');
        } else {
          feedbackParts.push('Regenerate only the SEO title and SEO description.');
        }

        feedbackParts.push('Keep all other fields consistent with the current content.');

        if (payload?.guidance) {
          feedbackParts.push(`Guidance: ${payload.guidance}.`);
        }
        if (payload?.preserveElements && payload.preserveElements.length > 0) {
          feedbackParts.push(`Preserve: ${payload.preserveElements.join(', ')}.`);
        }

        if (payload?.current?.title) {
          feedbackParts.push(`Current title: "${payload.current.title}".`);
        }
        if (payload?.current?.description) {
          feedbackParts.push('Use the existing description context when rewriting.');
        }
        if (payload?.current?.tags && payload.current.tags.length > 0) {
          feedbackParts.push(`Tags: ${payload.current.tags.join(', ')}.`);
        }
        if (payload?.current?.materials && payload.current.materials.length > 0) {
          feedbackParts.push(`Materials: ${payload.current.materials.join(', ')}.`);
        }
        if (payload?.current?.techniques && payload.current.techniques.length > 0) {
          feedbackParts.push(`Techniques: ${payload.current.techniques.join(', ')}.`);
        }

        setIsRegenerating(true);
        setRegeneratingSection(section);
        setError(null);

        // Task A5: Add AbortController with timeout for cleanup
        const abortController = new AbortController();
        const regenerateTimeoutMs = 30000; // 30 seconds
        const timeoutId = setTimeout(() => abortController.abort(), regenerateTimeoutMs);

        void (async () => {
          try {
            const previousContent =
              payload?.current?.title && payload?.current?.description
                ? {
                    title: payload.current.title,
                    description: payload.current.description,
                    seo_title: payload.current.seo_title,
                    seo_description: payload.current.seo_description,
                    tags: payload.current.tags,
                    materials: payload.current.materials,
                    techniques: payload.current.techniques,
                  }
                : undefined;

            const response = await fetch('/api/ai/generate-content?action=regenerate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: projectId,
                feedback: feedbackParts.join(' '),
                previous_content: previousContent,
              }),
              signal: abortController.signal, // Task A5: Enable cancellation
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              let message = 'Failed to regenerate content. Please try again.';
              // Task A5: Safely handle non-JSON responses
              const contentType = response.headers.get('content-type');
              if (contentType?.includes('application/json')) {
                try {
                  const data = await response.json();
                  if (data?.error?.message) {
                    message = data.error.message;
                  } else if (data?.message) {
                    message = data.message;
                  }
                } catch {
                  // Ignore JSON parse errors
                }
              }
              throw new Error(message);
            }

            const data = await response.json();

            // Task A5: Validate response structure before using
            if (!data?.content || typeof data.content !== 'object') {
              throw new Error('Invalid response: missing content object.');
            }

            const { title, description } = data.content as Record<string, unknown>;
            if (!title || !description) {
              throw new Error('Invalid response: missing required fields (title, description).');
            }

            updateContentEditorOutput(data.content as GeneratedContent);
            setSuccessMessage(`Regenerated ${section} section.`);
          } catch (err) {
            console.error('[ChatWizard] Regeneration error:', err);

            // Task A5: Specific error messages for different failure types
            if (err instanceof DOMException && err.name === 'AbortError') {
              setError('Regeneration timed out. Please try again.');
            } else if (err instanceof TypeError && err.message.includes('fetch')) {
              setError('Network error. Check your connection and try again.');
            } else {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Failed to regenerate content. Please try again.'
              );
            }
          } finally {
            clearTimeout(timeoutId);
            setIsRegenerating(false);
            setRegeneratingSection(null);
          }
        })();

        return true;
      }

      if (action.type === 'updateDescriptionBlocks') {
        const payload = action.payload as { blocks?: unknown };

        if (!payload?.blocks) {
          setError('Missing description blocks to save.');
          return true;
        }

        void applyDescriptionBlocks(payload.blocks);
        return true;
      }

      if (action.type === 'updateProjectData') {
        const payload = action.payload as {
          project_type?: string;
          materials?: string[];
          techniques?: string[];
        };

        if (
          !payload ||
          (typeof payload.project_type === 'undefined' &&
            typeof payload.materials === 'undefined' &&
            typeof payload.techniques === 'undefined')
        ) {
          setError('Missing project data to update.');
          return true;
        }

        setIsSavingContent(true);
        setError(null);

        void (async () => {
          try {
            const response = await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_type: payload.project_type,
                materials: payload.materials,
                techniques: payload.techniques,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to update project data');
            }

            setExtractedData((prev) => ({
              ...prev,
              project_type: payload.project_type ?? prev.project_type,
              materials_mentioned: payload.materials ?? prev.materials_mentioned,
              techniques_mentioned: payload.techniques ?? prev.techniques_mentioned,
            }));
            const updatedFields = [
              payload.project_type !== undefined && 'project_type',
              payload.materials !== undefined && 'materials',
              payload.techniques !== undefined && 'techniques',
            ].filter(Boolean) as string[];
            logPreviewEvent('projectDataUpdated', { fields: updatedFields });

            setSuccessMessage('Project data updated.');
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Failed to update project data:', err);
            setError(err instanceof Error ? err.message : 'Failed to update project data.');
          } finally {
            setIsSavingContent(false);
          }
        })();

        return true;
      }

      if (action.type === 'updateField') {
        const payload = action.payload as {
          field: string;
          value: string | string[];
          reason?: string;
        };

        if (!payload?.field || payload?.value === undefined) {
          setError('Missing field or value for update.');
          return true;
        }

        setIsSavingContent(true);
        setError(null);

        void (async () => {
          try {
            const updatePayload: Record<string, unknown> = {
              [payload.field]: payload.value,
            };

            if (payload.field === 'description' && typeof payload.value === 'string') {
              updatePayload.description_blocks = buildDescriptionBlocksFromContent({
                description: payload.value,
                materials: extractedData.materials_mentioned,
                techniques: extractedData.techniques_mentioned,
                duration: extractedData.duration,
                proudOf: extractedData.proud_of,
              });
            }

            const response = await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
              throw new Error('Failed to update field');
            }

            if (payload.field === 'materials' && Array.isArray(payload.value)) {
              setExtractedData((prev) => ({
                ...prev,
                materials_mentioned: payload.value as string[],
              }));
              logPreviewEvent('projectDataUpdated', { fields: ['materials'] });
            }
            if (payload.field === 'techniques' && Array.isArray(payload.value)) {
              setExtractedData((prev) => ({
                ...prev,
                techniques_mentioned: payload.value as string[],
              }));
              logPreviewEvent('projectDataUpdated', { fields: ['techniques'] });
            }

            setSuccessMessage(`Updated ${payload.field}.`);
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Failed to update field:', err);
            setError(err instanceof Error ? err.message : 'Failed to update field.');
          } finally {
            setIsSavingContent(false);
          }
        })();

        return true;
      }

      return false;
    },
    [
      applyDescriptionBlocks,
      extractedData,
      handleGenerate,
      logPreviewEvent,
      onProjectUpdate,
      projectId,
      setError,
      setExtractedData,
      setIsRegenerating,
      setIsSavingContent,
      setPhase,
      setRegeneratingSection,
      setSuccessMessage,
      updateContentEditorOutput,
    ]
  );
}
