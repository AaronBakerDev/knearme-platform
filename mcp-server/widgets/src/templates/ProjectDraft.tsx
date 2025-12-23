/**
 * Project Draft Template.
 *
 * Displays draft project for review and inline editing.
 * Used after create_project_draft and update_project_sections tools.
 *
 * Display: Inline or Fullscreen (for editing)
 */

import { useState } from 'react';
import type { RuntimeContext } from '../runtime';
import { getOpenAIOrMock } from '../runtime';

// ============================================================================
// TYPES
// ============================================================================

interface NarrativeSection {
  label: string;
  field: string;
  value?: string | null;
  placeholder: string;
}

interface ProjectData {
  id: string;
  title: string;
  summary?: string | null;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
  outcome_highlights?: string[] | null;
  project_type?: string;
  city?: string;
  state?: string;
  hero_image_url?: string;
}

interface ProjectDraftData {
  project: ProjectData;
  missing_fields: string[];
}

interface ProjectDraftProps {
  data: unknown;
  context: RuntimeContext;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProjectDraft({ data, context }: ProjectDraftProps) {
  const draftData = data as ProjectDraftData;
  const { project, missing_fields } = draftData;
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const sections: NarrativeSection[] = [
    {
      label: 'Summary',
      field: 'summary',
      value: project.summary,
      placeholder: 'A brief overview of the project (1-2 sentences)',
    },
    {
      label: 'Challenge',
      field: 'challenge',
      value: project.challenge,
      placeholder: 'What problem or constraint did you face?',
    },
    {
      label: 'Solution',
      field: 'solution',
      value: project.solution,
      placeholder: 'How did you solve it? What techniques did you use?',
    },
    {
      label: 'Results',
      field: 'results',
      value: project.results,
      placeholder: "What was the outcome? How did the client react?",
    },
  ];

  const handleEditStart = (section: NarrativeSection) => {
    setEditingField(section.field);
    setEditValue(section.value || '');

    // Request fullscreen for better editing experience
    if (context.displayMode !== 'fullscreen') {
      const bridge = getOpenAIOrMock();
      bridge.requestDisplayMode('fullscreen');
    }
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleEditSave = async () => {
    if (!editingField) return;

    const bridge = getOpenAIOrMock();

    // Call the update tool
    await bridge.callTool('update_project_sections', {
      project_id: project.id,
      [editingField]: editValue,
    });

    // Send follow-up to refresh the view
    bridge.sendFollowUpMessage(
      `I've updated the ${editingField} section. Please show me the updated project.`,
      { project_id: project.id, action: 'refresh' }
    );

    setEditingField(null);
    setEditValue('');
  };

  const handleAskForHelp = (section: NarrativeSection) => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      `Can you help me write the ${section.label.toLowerCase()} section for this project? Here's what I'm working with...`,
      { project_id: project.id, field: section.field, action: 'help_write' }
    );
  };

  const handleManageMedia = () => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      `I'd like to manage the images for project "${project.title}".`,
      { project_id: project.id, action: 'manage_media' }
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-md">
        <div>
          <h2 className="heading-lg">{project.title || 'Untitled Project'}</h2>
          {project.city && project.state && (
            <p className="text-muted">
              {project.project_type && `${project.project_type} • `}
              {project.city}, {project.state}
            </p>
          )}
        </div>
        <span className="badge badge-draft">Draft</span>
      </div>

      {/* Hero image */}
      {project.hero_image_url ? (
        <div
          className="mb-lg"
          style={{
            height: 180,
            borderRadius: 'var(--radius-lg)',
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
      ) : (
        <div
          className="mb-lg"
          style={{
            height: 120,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={handleManageMedia}
        >
          <span className="text-muted">+ Add hero image</span>
        </div>
      )}

      {/* Narrative sections */}
      <div className="flex flex-col gap-md">
        {sections.map((section) => {
          const isMissing = missing_fields.includes(section.field);
          const isEditing = editingField === section.field;

          return (
            <div key={section.field} className="card">
              <div className="flex items-center justify-between mb-sm">
                <span className="heading-sm">{section.label}</span>
                {isMissing && !section.value && (
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-warning)',
                    }}
                  >
                    Required
                  </span>
                )}
              </div>

              {isEditing ? (
                <div>
                  <textarea
                    className="input textarea"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={section.placeholder}
                    autoFocus
                    style={{ minHeight: 120 }}
                  />
                  <div className="flex gap-sm mt-sm">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleEditSave}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={handleEditCancel}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : section.value ? (
                <div>
                  <p
                    className="text-muted"
                    style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                  >
                    {section.value}
                  </p>
                  <button
                    className="btn btn-ghost btn-sm mt-sm"
                    onClick={() => handleEditStart(section)}
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-subtle mb-sm">{section.placeholder}</p>
                  <div className="flex gap-sm">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditStart(section)}
                    >
                      Write
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleAskForHelp(section)}
                    >
                      Help me write this
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Highlights */}
      {project.outcome_highlights && project.outcome_highlights.length > 0 && (
        <div className="card mt-md">
          <span className="heading-sm mb-sm">Key Highlights</span>
          <ul style={{ paddingLeft: 20 }}>
            {project.outcome_highlights.map((highlight, i) => (
              <li key={i} className="text-muted" style={{ marginBottom: 4 }}>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
