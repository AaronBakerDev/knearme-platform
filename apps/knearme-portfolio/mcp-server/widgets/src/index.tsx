/**
 * KnearMe Widget Entry Point.
 *
 * This is the main entry point for all ChatGPT widgets.
 * It routes to the appropriate template based on the data received.
 *
 * Templates:
 * - project-draft: Draft review and editing
 * - project-media: Media organization (reorder, hero, labels)
 * - project-status: Status view with quick actions
 * - project-list: List of recent projects
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 */

import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useRuntimeContext, useAutoHeight } from './runtime';

// Templates
import { ProjectDraft } from './templates/ProjectDraft';
import { ProjectMedia } from './templates/ProjectMedia';
import { ProjectStatus } from './templates/ProjectStatus';
import { ProjectList } from './templates/ProjectList';

// Global styles
import './styles/global.css';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Widget data passed from MCP tool responses.
 * The template field determines which component to render.
 */
interface WidgetData {
  /** Template to render */
  template: 'project-draft' | 'project-media' | 'project-status' | 'project-list';
  /** Template-specific data */
  data: unknown;
}

// ============================================================================
// APP COMPONENT
// ============================================================================

function App() {
  const context = useRuntimeContext();
  const heightRef = useAutoHeight();
  const [widgetData, setWidgetData] = useState<WidgetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load widget data from the bridge
  useEffect(() => {
    const loadData = async () => {
      try {
        // In production, data comes from the tool response
        // The bridge provides the _meta data from the last tool call
        // For now, we'll use a placeholder that demonstrates the pattern
        const rawData = (window as unknown as { __WIDGET_DATA__?: WidgetData }).__WIDGET_DATA__;

        if (rawData) {
          setWidgetData(rawData);
        } else {
          // Development fallback: show template selector
          setWidgetData({
            template: 'project-status',
            data: {
              project: {
                id: 'dev-123',
                title: 'Sample Project',
                status: 'draft',
                summary: 'A sample project for development.',
                city: 'Denver',
                state: 'CO',
              },
              missing_fields: ['challenge', 'solution', 'results'],
              can_publish: false,
            },
          });
        }
      } catch (err) {
        console.error('[Widget] Failed to load data:', err);
        setError('Failed to load widget data');
      }
    };

    loadData();
  }, []);

  // Render error state
  if (error) {
    return (
      <div ref={heightRef} className="widget-error">
        <p>{error}</p>
      </div>
    );
  }

  // Render loading state
  if (!widgetData) {
    return (
      <div ref={heightRef} className="widget-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Route to appropriate template
  const renderTemplate = () => {
    switch (widgetData.template) {
      case 'project-draft':
        return <ProjectDraft data={widgetData.data} context={context} />;
      case 'project-media':
        return <ProjectMedia data={widgetData.data} context={context} />;
      case 'project-status':
        return <ProjectStatus data={widgetData.data} context={context} />;
      case 'project-list':
        return <ProjectList data={widgetData.data} context={context} />;
      default:
        return (
          <div className="widget-error">
            <p>Unknown template: {(widgetData as { template: string }).template}</p>
          </div>
        );
    }
  };

  return (
    <div ref={heightRef} className="widget-container">
      {renderTemplate()}
    </div>
  );
}

// ============================================================================
// MOUNT
// ============================================================================

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
