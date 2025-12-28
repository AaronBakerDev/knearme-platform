/**
 * Shared artifact components and utilities.
 *
 * @see ArtifactError - Error boundary for artifacts
 * @see ArtifactSkeleton - Loading skeleton for artifacts
 * @see SaveStatusBadge - Save status indicator
 */

export { ArtifactError } from './ArtifactError';
export { ArtifactSkeleton } from './ArtifactSkeleton';
export { SaveStatusBadge, SaveIndicator, useSaveStatus } from './SaveStatusBadge';
export type { SaveStatus } from './SaveStatusBadge';
