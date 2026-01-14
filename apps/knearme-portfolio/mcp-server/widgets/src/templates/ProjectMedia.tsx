/**
 * Project Media Template.
 *
 * Manages project images - reorder, set hero, add labels.
 * Used after add_project_media and get_project_status tools.
 *
 * Display: Fullscreen (for better image management)
 */

import React, { useState, useEffect } from 'react';
import type { RuntimeContext } from '../runtime';
import { getOpenAIOrMock } from '../runtime';

// ============================================================================
// TYPES
// ============================================================================

interface ProjectImage {
  id: string;
  url: string;
  thumbnail_url?: string;
  image_type?: 'before' | 'after' | 'progress' | 'detail' | null;
  alt_text?: string | null;
  display_order: number;
  is_hero?: boolean;
}

interface ProjectData {
  id: string;
  title: string;
  hero_image_id?: string | null;
}

interface ProjectMediaData {
  project: ProjectData;
  images: ProjectImage[];
}

interface ProjectMediaProps {
  data: unknown;
  context: RuntimeContext;
}

// ============================================================================
// HELPERS
// ============================================================================

const imageTypeLabels: Record<string, string> = {
  before: 'Before',
  after: 'After',
  progress: 'Progress',
  detail: 'Detail',
};

const imageTypeColors: Record<string, string> = {
  before: '#dc2626',
  after: '#16a34a',
  progress: '#ca8a04',
  detail: '#2563eb',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProjectMedia({ data, context }: ProjectMediaProps) {
  const mediaData = data as ProjectMediaData;
  const { project, images: initialImages } = mediaData;

  const [images, setImages] = useState<ProjectImage[]>(initialImages);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Request fullscreen on mount
  useEffect(() => {
    if (context.displayMode !== 'fullscreen') {
      const bridge = getOpenAIOrMock();
      bridge.requestDisplayMode('fullscreen');
    }
  }, [context.displayMode]);

  const selectedImage = images.find((img) => img.id === selectedId);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = images.findIndex((img) => img.id === draggedId);
    const targetIndex = images.findIndex((img) => img.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    if (!draggedItem) return;
    newImages.splice(targetIndex, 0, draggedItem);

    setImages(newImages);
  };

  const handleDragEnd = async () => {
    if (!draggedId) return;

    const bridge = getOpenAIOrMock();
    const newOrder = images.map((img) => img.id);

    await bridge.callTool('reorder_project_media', {
      project_id: project.id,
      image_ids: newOrder,
    });

    setDraggedId(null);
  };

  const handleSetHero = async (imageId: string) => {
    const bridge = getOpenAIOrMock();

    await bridge.callTool('set_project_hero_media', {
      project_id: project.id,
      hero_image_id: imageId,
    });

    bridge.sendFollowUpMessage(
      'I set a new hero image for the project.',
      { project_id: project.id, action: 'set_hero' }
    );
  };

  const handleSetLabel = async (imageId: string, imageType: string | null) => {
    const bridge = getOpenAIOrMock();

    await bridge.callTool('set_project_media_labels', {
      project_id: project.id,
      labels: [{ image_id: imageId, image_type: imageType }],
    });

    // Update local state
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? { ...img, image_type: imageType as ProjectImage['image_type'] }
          : img
      )
    );
  };

  const handleAddMore = () => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      "I'd like to add more images to this project.",
      { project_id: project.id, action: 'add_images' }
    );
  };

  const handleDone = () => {
    const bridge = getOpenAIOrMock();
    bridge.sendFollowUpMessage(
      "I'm done organizing the images. Show me the project status.",
      { project_id: project.id, action: 'done_media' }
    );
    bridge.requestDisplayMode('inline');
  };

  if (images.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <p className="text-muted mb-md">No images added yet.</p>
        <button className="btn btn-primary" onClick={handleAddMore}>
          Add Images
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <h2 className="heading-md">Manage Images</h2>
          <p className="text-subtle">{project.title}</p>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-secondary btn-sm" onClick={handleAddMore}>
            + Add More
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDone}>
            Done
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Image grid */}
        <div
          style={{
            flex: 1,
            padding: 'var(--space-md)',
            overflowY: 'auto',
          }}
        >
          <p className="text-subtle mb-sm">
            Drag to reorder. First image is shown first in the gallery.
          </p>
          <div className="image-grid">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`image-grid-item ${
                  selectedId === image.id ? 'image-grid-item-selected' : ''
                }`}
                draggable
                onDragStart={() => handleDragStart(image.id)}
                onDragOver={(e) => handleDragOver(e, image.id)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedId(image.id)}
                style={{
                  cursor: 'pointer',
                  opacity: draggedId === image.id ? 0.5 : 1,
                  position: 'relative',
                }}
              >
                <img
                  src={image.thumbnail_url || image.url}
                  alt={image.alt_text || `Image ${index + 1}`}
                  style={{ pointerEvents: 'none' }}
                />

                {/* Order badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    fontSize: 'var(--font-size-xs)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {index + 1}
                </div>

                {/* Hero badge */}
                {image.id === project.hero_image_id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'var(--color-primary)',
                      color: 'white',
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    Hero
                  </div>
                )}

                {/* Type badge */}
                {image.image_type && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      background: imageTypeColors[image.image_type] || 'gray',
                      color: 'white',
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {imageTypeLabels[image.image_type] || image.image_type}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selectedImage && (
          <div
            style={{
              width: 280,
              borderLeft: '1px solid var(--color-border)',
              padding: 'var(--space-md)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                aspectRatio: '1',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--color-bg-subtle)',
                marginBottom: 'var(--space-md)',
              }}
            >
              <img
                src={selectedImage.url}
                alt={selectedImage.alt_text || 'Selected image'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Set as hero */}
            <div className="mb-md">
              <button
                className={`btn ${
                  selectedImage.id === project.hero_image_id
                    ? 'btn-secondary'
                    : 'btn-primary'
                } btn-sm`}
                onClick={() => handleSetHero(selectedImage.id)}
                disabled={selectedImage.id === project.hero_image_id}
                style={{ width: '100%' }}
              >
                {selectedImage.id === project.hero_image_id
                  ? 'Current Hero'
                  : 'Set as Hero'}
              </button>
            </div>

            {/* Image type */}
            <div>
              <label className="label">Image Type</label>
              <div className="flex flex-col gap-xs">
                {[null, 'before', 'after', 'progress', 'detail'].map((type) => (
                  <label
                    key={type || 'none'}
                    className="flex items-center gap-sm"
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="image-type"
                      checked={selectedImage.image_type === type}
                      onChange={() => handleSetLabel(selectedImage.id, type)}
                    />
                    <span>
                      {type ? imageTypeLabels[type] : 'No label'}
                    </span>
                    {type && (
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: imageTypeColors[type],
                        }}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
