import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { buildDescriptionBlocksFromContent } from '@/lib/content/description-blocks.client';
import type { ChatPhase, ExtractedProjectData } from '@/lib/chat/chat-types';
import type { ArtifactAction } from './types';
import type { ValidatableField } from '@/lib/chat/tool-schemas';

type UsePublishActionsParams = {
  projectId: string | null;
  extractedData: ExtractedProjectData;
  setPhase: Dispatch<SetStateAction<ChatPhase>>;
  setIsSavingContent: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSuccessMessage: Dispatch<SetStateAction<string | null>>;
  triggerMilestone: (milestone: 'published') => void;
  onProjectUpdate?: () => void;
};

export function usePublishActions({
  projectId,
  extractedData,
  setPhase,
  setIsSavingContent,
  setError,
  setSuccessMessage,
  triggerMilestone,
  onProjectUpdate,
}: UsePublishActionsParams) {
  return useCallback(
    (action: ArtifactAction): boolean => {
      if (action.type === 'acceptAndPublish') {
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
            const saveResponse = await fetch(`/api/projects/${projectId}`, {
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

            if (!saveResponse.ok) {
              let message = 'Failed to save content. Please try again.';
              try {
                const data = await saveResponse.json();
                if (data?.error?.message) {
                  message = data.error.message;
                } else if (data?.message) {
                  message = data.message;
                }
              } catch {
                // Ignore JSON parse errors
              }
              throw new Error(message);
            }

            const publishResponse = await fetch(`/api/projects/${projectId}/publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!publishResponse.ok) {
              let message = 'Content saved, but publishing failed. You can publish from the dashboard.';
              try {
                const data = await publishResponse.json();
                if (data?.error?.missing) {
                  message = `Cannot publish: ${(data.error.missing as string[]).join(', ')}`;
                } else if (data?.error?.code === 'FORBIDDEN') {
                  message = data.error.message ?? 'Publishing limit reached.';
                } else if (data?.error?.message) {
                  message = data.error.message;
                }
              } catch {
                // Ignore JSON parse errors
              }
              throw new Error(message);
            }

            setPhase('review');
            setSuccessMessage('Project published! Your portfolio is now live.');
            triggerMilestone('published');
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Accept & Publish error:', err);
            setError(err instanceof Error ? err.message : 'Failed to publish. Please try again.');
          } finally {
            setIsSavingContent(false);
          }
        })();

        return true;
      }

      if (action.type === 'validateForPublish') {
        void (async () => {
          try {
            const response = await fetch(`/api/projects/${projectId}/publish?dry_run=true`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              throw new Error('Failed to validate project');
            }

            const { valid, missing } = await response.json();

            if (!valid && missing && missing.length > 0) {
              setError(`Not ready to publish. Missing: ${missing.join(', ')}`);
            } else {
              setSuccessMessage('Ready to publish! All requirements met.');
            }
          } catch (err) {
            console.error('[ChatWizard] Validation error:', err);
            setError('Failed to validate project.');
          }
        })();

        return true;
      }

      /**
       * Validate a specific field for publish requirements.
       * Uses the publish dry-run endpoint with field filtering.
       */
      if (action.type === 'validateField') {
        const payload = action.payload as {
          field: ValidatableField;
        };

        if (!payload?.field) {
          setError('Missing field to validate.');
          return true;
        }

        void (async () => {
          try {
            const response = await fetch(`/api/projects/${projectId}/publish?dry_run=true`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ checkFields: [payload.field] }),
            });

            if (!response.ok) {
              throw new Error('Failed to validate field');
            }

            const { valid, missing } = await response.json();

            if (!valid && missing && missing.length > 0) {
              setError(`${payload.field} validation failed: ${missing.join(', ')}`);
            } else {
              setSuccessMessage(`${payload.field} looks good!`);
            }
          } catch (err) {
            console.error('[ChatWizard] Field validation error:', err);
            setError(`Failed to validate ${payload.field}.`);
          }
        })();

        return true;
      }

      /**
       * Check publish readiness using the QualityChecker agent.
       * Returns detailed feedback including warnings and suggestions.
       */
      if (action.type === 'checkPublishReady') {
        const payload = action.payload as {
          showWarnings?: boolean;
        };

        void (async () => {
          try {
            const response = await fetch(`/api/projects/${projectId}/publish?dry_run=true`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ showWarnings: payload?.showWarnings ?? true }),
            });

            if (!response.ok) {
              throw new Error('Failed to check publish readiness');
            }

            const result = await response.json();

            if (result.ready) {
              setSuccessMessage(result.summary || 'Project is ready to publish!');
            } else {
              const missingItems = result.missing?.join(', ') || 'requirements not met';
              setError(`Not ready: ${missingItems}`);
            }
          } catch (err) {
            console.error('[ChatWizard] Publish readiness check error:', err);
            setError('Failed to check publish readiness.');
          }
        })();

        return true;
      }

      /**
       * Publish the project (without saving content first).
       * Use 'acceptAndPublish' if you need to save + publish in one action.
       */
      if (action.type === 'publish') {
        setIsSavingContent(true);
        setError(null);

        void (async () => {
          try {
            const response = await fetch(`/api/projects/${projectId}/publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              let message = 'Publishing failed. Please try again.';
              try {
                const data = await response.json();
                if (data?.error?.missing) {
                  message = `Cannot publish: ${(data.error.missing as string[]).join(', ')}`;
                } else if (data?.error?.code === 'FORBIDDEN') {
                  message = data.error.message ?? 'Publishing limit reached.';
                } else if (data?.error?.message) {
                  message = data.error.message;
                }
              } catch {
                // Ignore JSON parse errors
              }
              throw new Error(message);
            }

            setPhase('review');
            setSuccessMessage('Project published! Your portfolio is now live.');
            triggerMilestone('published');
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Publish error:', err);
            setError(err instanceof Error ? err.message : 'Failed to publish. Please try again.');
          } finally {
            setIsSavingContent(false);
          }
        })();

        return true;
      }

      /**
       * Archive a project (set status to 'archived').
       * Archived projects are hidden from public view but can be restored.
       */
      if (action.type === 'archiveProject') {
        setIsSavingContent(true);
        setError(null);

        void (async () => {
          try {
            const response = await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'archived' }),
            });

            if (!response.ok) {
              let message = 'Failed to archive project.';
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
              throw new Error(message);
            }

            setPhase('review');
            setSuccessMessage('Project archived. You can restore it anytime from your dashboard.');
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Archive error:', err);
            setError(err instanceof Error ? err.message : 'Failed to archive project.');
          } finally {
            setIsSavingContent(false);
          }
        })();

        return true;
      }

      return false;
    },
    [
      extractedData,
      onProjectUpdate,
      projectId,
      setError,
      setIsSavingContent,
      setPhase,
      setSuccessMessage,
      triggerMilestone,
    ]
  );
}
