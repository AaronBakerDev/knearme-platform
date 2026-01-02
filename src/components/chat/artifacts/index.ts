/**
 * Artifact components for rendering tool parts as rich UI.
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md for full specification
 */

// Main dispatcher
export { ArtifactRenderer, isArtifactPart } from './ArtifactRenderer';

// Artifact components
export { ProjectDataCard } from './ProjectDataCard';
export { ImageGalleryArtifact } from './ImageGalleryArtifact';
export { ContentEditor } from './ContentEditor';
export { BusinessSearchResultsArtifact } from './BusinessSearchResultsArtifact';

// Shared components
export { ArtifactSkeleton } from './shared/ArtifactSkeleton';
export { ArtifactError } from './shared/ArtifactError';
export { SaveStatusBadge, SaveIndicator, useSaveStatus } from './shared/SaveStatusBadge';
export type { SaveStatus } from './shared/SaveStatusBadge';
