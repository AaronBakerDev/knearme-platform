'use client';

/**
 * ProjectDataCard artifact.
 *
 * Displays extracted project information inline within chat messages.
 * Shows real-time data extraction progress as the AI gathers info.
 * Supports inline editing in edit mode with save/cancel actions.
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md for specification
 */

import { useState, useCallback } from 'react';
import {
  Building2,
  Package,
  Clock,
  MapPin,
  Wrench,
  Award,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatProjectLocation } from '@/lib/utils/location';
import type { ExtractedProjectData } from '@/lib/chat/chat-types';

interface ProjectDataCardProps {
  /** Extracted project data */
  data: ExtractedProjectData;
  /** Whether the card is editable */
  editable?: boolean;
  /** Callback for artifact actions (save, cancel) */
  onAction?: (action: { type: string; payload?: unknown }) => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Format project type slug to display name.
 */
function formatProjectType(type?: string): string {
  if (!type) return 'Project';
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Data row component for consistent styling.
 * In edit mode, renders an input field instead of text.
 */
function DataRow({
  icon,
  label,
  value,
  isEditing,
  onValueChange,
  type = 'text',
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  isEditing?: boolean;
  onValueChange?: (value: string) => void;
  type?: 'text' | 'chips';
  children?: React.ReactNode;
}) {
  if (isEditing && type === 'text' && onValueChange) {
    return (
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground shrink-0 mt-2">{icon}</span>
        <div className="flex-1 min-w-0">
          <label className="text-muted-foreground text-xs">{label}</label>
          <Input
            value={value || ''}
            onChange={(e) => onValueChange(e.target.value)}
            className="h-8 text-sm mt-0.5"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <span className="text-muted-foreground text-xs">{label}: </span>
        <span className="text-foreground">{children}</span>
      </div>
    </div>
  );
}

/**
 * Chip list for arrays of items.
 * In edit mode, allows comma-separated input.
 */
function ChipList({
  items,
  isEditing,
  onItemsChange,
  label,
}: {
  items: string[];
  isEditing?: boolean;
  onItemsChange?: (items: string[]) => void;
  label?: string;
}) {
  if (isEditing && onItemsChange) {
    return (
      <Input
        value={items.join(', ')}
        onChange={(e) => {
          const newItems = e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          onItemsChange(newItems);
        }}
        className="h-8 text-sm"
        placeholder={`Enter ${label?.toLowerCase() || 'items'} (comma-separated)`}
      />
    );
  }

  return (
    <span className="inline-flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-block px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary animate-chip-slide-in"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {item}
        </span>
      ))}
    </span>
  );
}

/**
 * ProjectDataCard displays extracted project information.
 * Supports view mode (read-only) and edit mode (inline editing).
 */
export function ProjectDataCard({
  data,
  editable = false,
  onAction,
  className,
}: ProjectDataCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const derivedLocation =
    data.location ||
    formatProjectLocation({ city: data.city, state: data.state }) ||
    '';

  // Editable state - copy of data for editing
  const [editState, setEditState] = useState({
    project_type: data.project_type || '',
    materials_mentioned: data.materials_mentioned || [],
    techniques_mentioned: data.techniques_mentioned || [],
    duration: data.duration || '',
    location: derivedLocation,
    proud_of: data.proud_of || '',
  });

  // Reset edit state when data changes
  const handleStartEdit = useCallback(() => {
    setEditState({
      project_type: data.project_type || '',
      materials_mentioned: data.materials_mentioned || [],
      techniques_mentioned: data.techniques_mentioned || [],
      duration: data.duration || '',
      location:
        data.location ||
        formatProjectLocation({ city: data.city, state: data.state }) ||
        '',
      proud_of: data.proud_of || '',
    });
    setIsEditing(true);
  }, [data]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    // Reset to original data
    setEditState({
      project_type: data.project_type || '',
      materials_mentioned: data.materials_mentioned || [],
      techniques_mentioned: data.techniques_mentioned || [],
      duration: data.duration || '',
      location:
        data.location ||
        formatProjectLocation({ city: data.city, state: data.state }) ||
        '',
      proud_of: data.proud_of || '',
    });
  }, [data]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    onAction?.({
      type: 'updateProjectData',
      payload: {
        project_type: editState.project_type || undefined,
        materials: editState.materials_mentioned,
        techniques: editState.techniques_mentioned,
        // Note: duration, location, proud_of are interview-only fields
        // They don't map directly to project fields but could be used for regeneration
      },
    });
  }, [editState, onAction]);

  // Count how many fields are populated
  const fieldCount = [
    data.project_type,
    data.materials_mentioned?.length,
    data.techniques_mentioned?.length,
    data.duration,
    derivedLocation,
    data.customer_problem,
    data.solution_approach,
    data.challenges,
    data.proud_of,
  ].filter(Boolean).length;

  // Don't render if no data
  if (fieldCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        isEditing && 'ring-2 ring-primary/50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">
            {isEditing ? (
              <Input
                value={editState.project_type}
                onChange={(e) =>
                  setEditState((s) => ({ ...s, project_type: e.target.value }))
                }
                className="h-7 text-sm font-medium w-40"
                placeholder="Project type"
              />
            ) : (
              formatProjectType(data.project_type)
            )}
          </h4>
        </div>
        {editable && !isEditing && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleStartEdit}
            className="h-7 w-7"
            aria-label="Edit project data"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {isEditing && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCancel}
              className="h-7 w-7 text-muted-foreground"
              aria-label="Cancel editing"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSave}
              className="h-7 w-7 text-primary"
              aria-label="Save changes"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Data fields */}
      <div className="space-y-1.5 text-sm">
        {(data.materials_mentioned?.length || isEditing) && (
          <DataRow
            icon={<Package className="h-3.5 w-3.5" />}
            label="Materials"
            isEditing={isEditing}
            type="chips"
          >
            <ChipList
              items={isEditing ? editState.materials_mentioned : (data.materials_mentioned || [])}
              isEditing={isEditing}
              onItemsChange={(items) =>
                setEditState((s) => ({ ...s, materials_mentioned: items }))
              }
              label="materials"
            />
          </DataRow>
        )}

        {(data.techniques_mentioned?.length || isEditing) && (
          <DataRow
            icon={<Wrench className="h-3.5 w-3.5" />}
            label="Techniques"
            isEditing={isEditing}
            type="chips"
          >
            <ChipList
              items={isEditing ? editState.techniques_mentioned : (data.techniques_mentioned || [])}
              isEditing={isEditing}
              onItemsChange={(items) =>
                setEditState((s) => ({ ...s, techniques_mentioned: items }))
              }
              label="techniques"
            />
          </DataRow>
        )}

        {(data.duration || isEditing) && (
          <DataRow
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Duration"
            value={isEditing ? editState.duration : data.duration}
            isEditing={isEditing}
            onValueChange={(v) => setEditState((s) => ({ ...s, duration: v }))}
          >
            {data.duration}
          </DataRow>
        )}

        {(derivedLocation || isEditing) && (
          <DataRow
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Location"
            value={isEditing ? editState.location : derivedLocation}
            isEditing={isEditing}
            onValueChange={(v) => setEditState((s) => ({ ...s, location: v }))}
          >
            {derivedLocation}
          </DataRow>
        )}

        {(data.proud_of || isEditing) && (
          <DataRow
            icon={<Award className="h-3.5 w-3.5" />}
            label="Highlight"
            value={isEditing ? editState.proud_of : data.proud_of}
            isEditing={isEditing}
            onValueChange={(v) => setEditState((s) => ({ ...s, proud_of: v }))}
          >
            {data.proud_of}
          </DataRow>
        )}
      </div>

      {/* Edit mode help text */}
      {isEditing && (
        <p className="mt-3 text-xs text-muted-foreground">
          Edit the fields above. For lists, separate items with commas.
        </p>
      )}
    </div>
  );
}
