import { getPublicUrl } from './upload';

export type ProjectImageBucket = 'project-images' | 'project-images-draft';

export function buildDraftImageProxyUrl(projectId: string, imageId: string): string {
  return `/api/projects/${projectId}/images/${imageId}/file`;
}

export function resolveProjectImageUrl({
  projectId,
  imageId,
  storagePath,
  isPublished,
}: {
  projectId: string;
  imageId: string;
  storagePath: string;
  isPublished: boolean;
}): string {
  if (!storagePath) return '';

  return isPublished
    ? getPublicUrl('project-images', storagePath)
    : buildDraftImageProxyUrl(projectId, imageId);
}
