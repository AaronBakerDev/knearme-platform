/**
 * Project List Template.
 *
 * Displays a list of contractor's recent projects.
 * Used after list_contractor_projects tool.
 *
 * Display: Inline
 */

import type { RuntimeContext } from '../runtime';
import { getOpenAIOrMock } from '../runtime';

// ============================================================================
// TYPES
// ============================================================================

interface ProjectSummary {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  project_type?: string;
  city?: string;
  state?: string;
  hero_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProjectListData {
  projects: ProjectSummary[];
  count: number;
  has_more: boolean;
}

interface ProjectListProps {
  data: unknown;
  context: RuntimeContext;
}

// ============================================================================
// HELPERS
// ============================================================================

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

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProjectList({ data }: ProjectListProps) {
  const listData = data as ProjectListData;
  const { projects, count, has_more } = listData;

  const handleSelectProject = (project: ProjectSummary) => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      `Show me the status of project "${project.title}"`,
      { project_id: project.id, action: 'view_status' }
    );
  };

  const handleCreateNew = () => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      'I want to create a new project.',
      { action: 'create_new' }
    );
  };

  const handleLoadMore = () => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      'Show me more projects.',
      { action: 'load_more', offset: count }
    );
  };

  if (projects.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p className="text-muted mb-md">No projects yet.</p>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          Create Your First Project
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-md">
        <h2 className="heading-sm">Your Projects</h2>
        <button className="btn btn-primary btn-sm" onClick={handleCreateNew}>
          + New
        </button>
      </div>

      {/* Project list */}
      <div className="card" style={{ padding: 0 }}>
        <ul className="list">
          {projects.map((project) => (
            <li
              key={project.id}
              className="list-item list-item-clickable"
              onClick={() => handleSelectProject(project)}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: 'var(--color-bg-subtle)',
                  flexShrink: 0,
                }}
              >
                {project.hero_image_url ? (
                  <img
                    src={project.hero_image_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-text-subtle)',
                      fontSize: 'var(--font-size-lg)',
                    }}
                  >
                    {project.title?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-sm">
                  <span className="heading-sm truncate" style={{ flex: 1 }}>
                    {project.title || 'Untitled'}
                  </span>
                  <span className={getStatusBadgeClass(project.status)}>
                    {project.status}
                  </span>
                </div>
                <div className="text-subtle">
                  {project.project_type && (
                    <span>{project.project_type}</span>
                  )}
                  {project.project_type && project.city && ' • '}
                  {project.city && project.state && (
                    <span>
                      {project.city}, {project.state}
                    </span>
                  )}
                  {(project.project_type || project.city) && project.updated_at && ' • '}
                  {project.updated_at && (
                    <span>{formatDate(project.updated_at)}</span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: 'var(--color-text-subtle)' }}>›</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Load more */}
      {has_more && (
        <div className="mt-md" style={{ textAlign: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleLoadMore}>
            Load More
          </button>
        </div>
      )}

      {/* Count */}
      <p className="text-subtle mt-sm" style={{ textAlign: 'center' }}>
        Showing {projects.length} of {has_more ? 'many' : count} projects
      </p>
    </div>
  );
}
