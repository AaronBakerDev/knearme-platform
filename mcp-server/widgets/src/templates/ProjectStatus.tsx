/**
 * Project Status Template.
 *
 * Displays project status with missing fields and quick actions.
 * Used after create_project_draft and get_project_status tools.
 *
 * Display: Inline
 */

import type { RuntimeContext } from '../runtime';
import { getOpenAIOrMock } from '../runtime';

// ============================================================================
// TYPES
// ============================================================================

interface ProjectData {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  summary?: string;
  city?: string;
  state?: string;
  project_type?: string;
  hero_image_url?: string;
  images?: Array<{
    id: string;
    url: string;
    image_type?: string;
  }>;
}

interface ProjectStatusData {
  project: ProjectData;
  missing_fields: string[];
  can_publish: boolean;
}

interface ProjectStatusProps {
  data: unknown;
  context: RuntimeContext;
}

// ============================================================================
// HELPERS
// ============================================================================

const fieldLabels: Record<string, string> = {
  title: 'Title',
  summary: 'Summary',
  challenge: 'Challenge',
  solution: 'Solution',
  results: 'Results',
  project_type: 'Project Type',
  city: 'City',
  state: 'State',
  hero_image_id: 'Hero Image',
  images: 'Images',
};

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'draft':
      return 'badge badge-draft';
    case 'published':
      return 'badge badge-published';
    case 'archived':
      return 'badge badge-archived';
    default:
      return 'badge';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProjectStatus({ data }: ProjectStatusProps) {
  const statusData = data as ProjectStatusData;
  const { project, missing_fields, can_publish } = statusData;

  const handleEditContent = () => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      `I'd like to edit the content for project "${project.title}". Can you help me with the narrative sections?`,
      { project_id: project.id, action: 'edit_content' }
    );
  };

  const handleManageMedia = () => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      `I'd like to manage the images for project "${project.title}".`,
      { project_id: project.id, action: 'manage_media' }
    );
  };

  const handlePublish = () => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      `Please publish project "${project.title}" now.`,
      { project_id: project.id, action: 'publish' }
    );
  };

  const completionPercent = Math.round(
    ((Object.keys(fieldLabels).length - missing_fields.length) /
      Object.keys(fieldLabels).length) *
      100
  );

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="heading-md truncate">{project.title || 'Untitled Project'}</h2>
          {project.city && project.state && (
            <p className="text-muted text-subtle">
              {project.city}, {project.state}
            </p>
          )}
        </div>
        <span className={getStatusBadgeClass(project.status)}>
          {project.status}
        </span>
      </div>

      {/* Hero image preview */}
      {project.hero_image_url && (
        <div
          className="mb-md"
          style={{
            height: 120,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'var(--color-bg-subtle)',
          }}
        >
          <img
            src={project.hero_image_url}
            alt={project.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Summary */}
      {project.summary && (
        <p className="text-muted mb-md" style={{ fontSize: 'var(--font-size-sm)' }}>
          {project.summary}
        </p>
      )}

      {/* Progress */}
      <div className="mb-md">
        <div className="flex items-center justify-between mb-sm">
          <span className="text-subtle">Completion</span>
          <span className="text-subtle">{completionPercent}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Missing fields */}
      {missing_fields.length > 0 && (
        <div className="mb-md">
          <p className="text-subtle mb-sm">Missing to publish:</p>
          <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
            {missing_fields.map((field) => (
              <span
                key={field}
                style={{
                  padding: '2px 8px',
                  background: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {fieldLabels[field] || field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card-footer">
        <button className="btn btn-secondary btn-sm" onClick={handleEditContent}>
          Edit Content
        </button>
        <button className="btn btn-secondary btn-sm" onClick={handleManageMedia}>
          Manage Media
        </button>
        {can_publish && (
          <button className="btn btn-primary btn-sm" onClick={handlePublish}>
            Publish
          </button>
        )}
      </div>
    </div>
  );
}
