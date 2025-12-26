# Chat Artifacts Design Specification

> Technical specification for the artifact system in knearme-portfolio.
> Artifacts are rich, interactive UI components rendered inline within chat messages.

---

## Table of Contents

1. [Overview](#overview)
2. [Artifact Types](#artifact-types)
3. [Component Architecture](#component-architecture)
4. [Tool-to-Artifact Mapping](#tool-to-artifact-mapping)
5. [State Management](#state-management)
6. [Data Flow](#data-flow)
7. [API Changes](#api-changes)
8. [Type Definitions](#type-definitions)
9. [Component Specifications](#component-specifications)
10. [Migration Strategy](#migration-strategy)

---

## Overview

### What Are Artifacts?

Artifacts are interactive UI components that render inline within chat messages, triggered by AI tool calls. Instead of just showing text, the AI can "render" rich components like:

- Live data extraction previews
- Image galleries with categorization
- Real-time portfolio previews
- Inline content editors
- Progress trackers

### Core Principle

```
AI Tool Call → Tool Result → Artifact Component → User Interaction
```

When the AI calls a tool, the result becomes an artifact that renders as a rich component within the message flow.

---

## Artifact Types

| Artifact | Trigger Tool | Purpose |
|----------|--------------|---------|
| `ProjectDataCard` | `extractProjectData` | Display extracted project info in real-time |
| `ImageGalleryArtifact` | `promptForImages` | Inline image management with categorization |
| `PortfolioPreview` | `showPortfolioPreview` | Live preview of the portfolio being built |
| `ContentEditor` | `showContentEditor` | Inline editing of AI-generated content |
| `ProgressTracker` | `showProgress` | Visual checklist of collected information |

### Artifact States

Each artifact can be in one of these states:

```typescript
type ArtifactState =
  | 'loading'      // Tool is executing, show skeleton
  | 'ready'        // Data available, render full component
  | 'interactive'  // User can interact (edit, add, etc.)
  | 'error'        // Something went wrong
  | 'collapsed';   // Minimized view
```

---

## Component Architecture

### Directory Structure

```
src/components/chat/
├── artifacts/
│   ├── index.ts                    # Exports & artifact registry
│   ├── ArtifactRenderer.tsx        # Dynamic dispatcher
│   ├── ProjectDataCard.tsx         # Live data extraction preview
│   ├── ImageGalleryArtifact.tsx    # Inline image grid
│   ├── PortfolioPreview.tsx        # Real-time portfolio preview
│   ├── ContentEditor.tsx           # Inline content editing
│   ├── ProgressTracker.tsx         # Collection progress indicator
│   └── shared/
│       ├── ArtifactCard.tsx        # Common card wrapper
│       ├── ArtifactSkeleton.tsx    # Loading states
│       └── ArtifactActions.tsx     # Common action buttons
│
├── hooks/
│   ├── useArtifacts.ts             # Artifact state management
│   ├── useProjectData.ts           # Data accumulator
│   └── useCompleteness.ts          # Progress calculation
│
└── types/
    └── artifacts.ts                # Type definitions
```

### ArtifactRenderer Component

The central dispatcher that renders the appropriate artifact based on tool type:

```typescript
// src/components/chat/artifacts/ArtifactRenderer.tsx

import { ProjectDataCard } from './ProjectDataCard';
import { ImageGalleryArtifact } from './ImageGalleryArtifact';
import { PortfolioPreview } from './PortfolioPreview';
import { ContentEditor } from './ContentEditor';
import { ProgressTracker } from './ProgressTracker';
import { ArtifactSkeleton } from './shared/ArtifactSkeleton';
import type { ToolPart, ArtifactType } from '../types/artifacts';

interface ArtifactRendererProps {
  part: ToolPart;
  onAction?: (action: ArtifactAction) => void;
}

const ARTIFACT_COMPONENTS: Record<ArtifactType, React.ComponentType<any>> = {
  'extractProjectData': ProjectDataCard,
  'promptForImages': ImageGalleryArtifact,
  'showPortfolioPreview': PortfolioPreview,
  'showContentEditor': ContentEditor,
  'showProgress': ProgressTracker,
};

export function ArtifactRenderer({ part, onAction }: ArtifactRendererProps) {
  // Extract tool name from part type (e.g., 'tool-extractProjectData' → 'extractProjectData')
  const toolName = part.type.replace('tool-', '') as ArtifactType;
  const Component = ARTIFACT_COMPONENTS[toolName];

  if (!Component) {
    return null; // Unknown artifact type
  }

  // Show skeleton while loading
  if (part.state === 'call') {
    return <ArtifactSkeleton type={toolName} />;
  }

  // Show error state
  if (part.state === 'error') {
    return <ArtifactError toolName={toolName} error={part.error} />;
  }

  // Render artifact with output data
  if (part.state === 'output-available' && 'output' in part) {
    return (
      <Component
        data={part.output}
        onAction={onAction}
      />
    );
  }

  return null;
}
```

### Integration with ChatMessage

Update `ChatMessage.tsx` to render artifacts:

```typescript
// src/components/chat/ChatMessage.tsx

import { ArtifactRenderer } from './artifacts/ArtifactRenderer';

export function ChatMessage({ message }: { message: UIMessage }) {
  return (
    <div className={cn(
      'flex',
      message.role === 'user' ? 'justify-end' : 'justify-start'
    )}>
      <div className="max-w-[90%] space-y-3">
        {message.parts.map((part, index) => {
          // Text parts
          if (part.type === 'text') {
            return (
              <TextBubble
                key={index}
                text={part.text}
                role={message.role}
              />
            );
          }

          // Artifact parts (tool results)
          if (part.type.startsWith('tool-')) {
            return (
              <ArtifactRenderer
                key={index}
                part={part}
                onAction={handleArtifactAction}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
```

---

## Tool-to-Artifact Mapping

### Enhanced extractProjectData Tool

Current tool that extracts project information. Enhanced to also trigger UI update:

```typescript
// In /api/chat/route.ts

extractProjectData: tool({
  description: `Extract project information from the conversation.
    Call this when the user mentions project details.
    The result will render as an inline ProjectDataCard artifact.`,
  inputSchema: z.object({
    project_type: z.string().optional(),
    customer_problem: z.string().optional(),
    solution_approach: z.string().optional(),
    materials_mentioned: z.array(z.string()).optional(),
    techniques_mentioned: z.array(z.string()).optional(),
    duration: z.string().optional(),
    location: z.string().optional(),
    challenges: z.string().optional(),
    proud_of: z.string().optional(),
    ready_for_images: z.boolean().optional(),
  }),
  execute: async (args) => args,
}),
```

### New showProgress Tool

```typescript
showProgress: tool({
  description: 'Display collection progress to the user as an inline checklist',
  inputSchema: z.object({
    collected: z.object({
      hasImages: z.boolean(),
      hasProjectType: z.boolean(),
      hasMaterials: z.boolean(),
      hasProblem: z.boolean(),
      hasSolution: z.boolean(),
      hasDuration: z.boolean(),
    }),
    completeness: z.number().min(0).max(100),
    nextSuggestion: z.string().optional(),
  }),
  execute: async (args) => args,
}),
```

### New promptForImages Tool

```typescript
promptForImages: tool({
  description: 'Prompt user to add photos with inline upload UI',
  inputSchema: z.object({
    existingCount: z.number().default(0),
    suggestedCategories: z.array(z.enum(['before', 'after', 'progress', 'detail'])).optional(),
    message: z.string().optional(),
  }),
  execute: async (args) => args,
}),
```

### New showPortfolioPreview Tool

```typescript
showPortfolioPreview: tool({
  description: 'Display live portfolio preview to the user',
  inputSchema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    project_type: z.string().optional(),
    materials: z.array(z.string()).optional(),
    techniques: z.array(z.string()).optional(),
    images: z.array(z.object({
      url: z.string(),
      type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
    })).optional(),
    completeness: z.number().min(0).max(100),
  }),
  execute: async (args) => args,
}),
```

### New showContentEditor Tool

```typescript
showContentEditor: tool({
  description: 'Display generated content for inline editing',
  inputSchema: z.object({
    title: z.string(),
    description: z.string(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    materials: z.array(z.string()).optional(),
    techniques: z.array(z.string()).optional(),
    editable: z.boolean().default(true),
  }),
  execute: async (args) => args,
}),
```

---

## State Management

### useArtifacts Hook

Manages artifact state across the conversation:

```typescript
// src/components/chat/hooks/useArtifacts.ts

import { useMemo, useCallback } from 'react';
import type { UIMessage } from 'ai';
import type { ArtifactType, ArtifactPart } from '../types/artifacts';

interface UseArtifactsReturn {
  /** All artifacts in the conversation */
  artifacts: ArtifactPart[];
  /** Latest artifact of each type */
  latestByType: Partial<Record<ArtifactType, ArtifactPart>>;
  /** Get latest portfolio preview data */
  currentPreview: PortfolioPreviewData | null;
  /** Check if an artifact type exists */
  hasArtifact: (type: ArtifactType) => boolean;
}

export function useArtifacts(messages: UIMessage[]): UseArtifactsReturn {
  // Extract all tool parts (artifacts) from messages
  const artifacts = useMemo(() => {
    return messages.flatMap(m =>
      (m.parts || []).filter(p =>
        p.type.startsWith('tool-') &&
        'state' in p &&
        p.state === 'output-available'
      )
    ) as ArtifactPart[];
  }, [messages]);

  // Group by type, keep latest
  const latestByType = useMemo(() => {
    const grouped: Partial<Record<ArtifactType, ArtifactPart>> = {};
    for (const artifact of artifacts) {
      const type = artifact.type.replace('tool-', '') as ArtifactType;
      grouped[type] = artifact; // Later artifacts overwrite earlier
    }
    return grouped;
  }, [artifacts]);

  // Current portfolio preview
  const currentPreview = useMemo(() => {
    const preview = latestByType['showPortfolioPreview'];
    return preview?.output as PortfolioPreviewData | null;
  }, [latestByType]);

  const hasArtifact = useCallback(
    (type: ArtifactType) => !!latestByType[type],
    [latestByType]
  );

  return { artifacts, latestByType, currentPreview, hasArtifact };
}
```

### useProjectData Hook

Accumulates extracted data across multiple tool calls:

```typescript
// src/components/chat/hooks/useProjectData.ts

import { useState, useCallback, useMemo } from 'react';
import type { ExtractedProjectData } from '@/lib/chat/chat-types';

interface UseProjectDataReturn {
  /** Current accumulated data */
  data: ExtractedProjectData;
  /** Completion percentage (0-100) */
  completeness: number;
  /** Update with new extracted data */
  updateData: (newData: Partial<ExtractedProjectData>) => void;
  /** Check if ready to generate */
  isReadyToGenerate: boolean;
  /** List of missing fields */
  missingFields: string[];
}

const COMPLETENESS_WEIGHTS = {
  images: 25,           // At least 1 photo
  project_type: 15,     // Type detected
  materials_mentioned: 15,
  customer_problem: 15,
  solution_approach: 15,
  duration: 10,
  proud_of: 5,
};

export function useProjectData(
  imageCount: number
): UseProjectDataReturn {
  const [data, setData] = useState<ExtractedProjectData>({});

  const updateData = useCallback((newData: Partial<ExtractedProjectData>) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  const completeness = useMemo(() => {
    let score = 0;
    if (imageCount > 0) score += COMPLETENESS_WEIGHTS.images;
    if (data.project_type) score += COMPLETENESS_WEIGHTS.project_type;
    if (data.materials_mentioned?.length) score += COMPLETENESS_WEIGHTS.materials_mentioned;
    if (data.customer_problem) score += COMPLETENESS_WEIGHTS.customer_problem;
    if (data.solution_approach) score += COMPLETENESS_WEIGHTS.solution_approach;
    if (data.duration) score += COMPLETENESS_WEIGHTS.duration;
    if (data.proud_of) score += COMPLETENESS_WEIGHTS.proud_of;
    return score;
  }, [data, imageCount]);

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (imageCount === 0) missing.push('photos');
    if (!data.project_type) missing.push('project type');
    if (!data.materials_mentioned?.length) missing.push('materials');
    if (!data.customer_problem) missing.push('customer problem');
    if (!data.solution_approach) missing.push('solution');
    return missing;
  }, [data, imageCount]);

  const isReadyToGenerate = completeness >= 75;

  return { data, completeness, updateData, isReadyToGenerate, missingFields };
}
```

---

## Data Flow

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                              │
│   "I rebuilt a chimney last week using red brick"               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ChatWizard.tsx                               │
│   sendMessage({ text: "..." })                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POST /api/chat                                │
│   streamText with tools: { extractProjectData, showProgress }   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OpenAI GPT-4o                                │
│   Decides to call: extractProjectData({                         │
│     project_type: "chimney-rebuild",                            │
│     duration: "last week",                                      │
│     materials_mentioned: ["red brick"]                          │
│   })                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              UIMessage with parts[]                             │
│   {                                                             │
│     type: 'text', text: "Nice! A chimney rebuild..."            │
│   },                                                            │
│   {                                                             │
│     type: 'tool-extractProjectData',                            │
│     state: 'output-available',                                  │
│     output: { project_type: "chimney-rebuild", ... }            │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ChatMessage.tsx                                 │
│   Iterates through parts[], renders:                            │
│   - TextBubble for text                                         │
│   - ArtifactRenderer for tool-*                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ArtifactRenderer.tsx                               │
│   Dispatches to ProjectDataCard component                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               ProjectDataCard.tsx                               │
│   ┌─────────────────────────────────────────────┐               │
│   │  🏠 Chimney Rebuild                         │               │
│   │  ────────────────────────                   │               │
│   │  📦 Materials: [Red Brick]                  │               │
│   │  ⏱️  Duration: Last week                    │               │
│   │                                             │               │
│   │  [ Edit ]                                   │               │
│   └─────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              useProjectData Hook                                │
│   Accumulates data, recalculates completeness                   │
│   completeness: 45% → 60%                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             LivePortfolioCanvas                                 │
│   (Split View - Desktop)                                        │
│   Updates with new data, shows "Chimney Rebuild" title          │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Changes

### Updated /api/chat/route.ts

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { CONVERSATION_SYSTEM_PROMPT } from '@/lib/chat/chat-prompts';

export const maxDuration = 60;

// Schemas
const extractProjectDataSchema = z.object({
  project_type: z.string().optional(),
  customer_problem: z.string().optional(),
  solution_approach: z.string().optional(),
  materials_mentioned: z.array(z.string()).optional(),
  techniques_mentioned: z.array(z.string()).optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  challenges: z.string().optional(),
  proud_of: z.string().optional(),
  ready_for_images: z.boolean().optional(),
});

const showProgressSchema = z.object({
  collected: z.object({
    hasImages: z.boolean(),
    hasProjectType: z.boolean(),
    hasMaterials: z.boolean(),
    hasProblem: z.boolean(),
    hasSolution: z.boolean(),
    hasDuration: z.boolean(),
  }),
  completeness: z.number().min(0).max(100),
  nextSuggestion: z.string().optional(),
});

const promptForImagesSchema = z.object({
  existingCount: z.number().default(0),
  suggestedCategories: z.array(z.enum(['before', 'after', 'progress', 'detail'])).optional(),
  message: z.string().optional(),
});

const portfolioPreviewSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  project_type: z.string().optional(),
  materials: z.array(z.string()).optional(),
  techniques: z.array(z.string()).optional(),
  images: z.array(z.object({
    url: z.string(),
    type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
  })).optional(),
  completeness: z.number().min(0).max(100),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.type === 'UNAUTHORIZED' ? 401 : 403,
      });
    }

    const { messages }: { messages: UIMessage[] } = await request.json();

    const result = streamText({
      model: openai('gpt-4o'),
      system: CONVERSATION_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: {
        // Existing: Extract project data
        extractProjectData: tool({
          description: 'Extract project info. Result renders as ProjectDataCard artifact.',
          inputSchema: extractProjectDataSchema,
          execute: async (args) => args,
        }),

        // NEW: Show progress checklist
        showProgress: tool({
          description: 'Show collection progress. Result renders as ProgressTracker artifact.',
          inputSchema: showProgressSchema,
          execute: async (args) => args,
        }),

        // NEW: Prompt for images
        promptForImages: tool({
          description: 'Prompt for photos. Result renders as ImageGalleryArtifact.',
          inputSchema: promptForImagesSchema,
          execute: async (args) => args,
        }),

        // NEW: Show portfolio preview
        showPortfolioPreview: tool({
          description: 'Show live preview. Result renders as PortfolioPreview artifact.',
          inputSchema: portfolioPreviewSchema,
          execute: async (args) => args,
        }),
      },
      stopWhen: stepCountIs(3),
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[POST /api/chat] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat message' }), {
      status: 500,
    });
  }
}
```

---

## Type Definitions

### artifacts.ts

```typescript
// src/components/chat/types/artifacts.ts

import type { ExtractedProjectData } from '@/lib/chat/chat-types';
import type { UploadedImage } from '@/components/upload/ImageUploader';

/** Artifact type identifiers (match tool names) */
export type ArtifactType =
  | 'extractProjectData'
  | 'showProgress'
  | 'promptForImages'
  | 'showPortfolioPreview'
  | 'showContentEditor';

/** Tool part from UIMessage */
export interface ToolPart {
  type: `tool-${string}`;
  state: 'call' | 'output-available' | 'error';
  toolCallId?: string;
  toolName?: string;
  args?: unknown;
  output?: unknown;
  error?: string;
}

/** Artifact part with typed output */
export type ArtifactPart =
  | { type: 'tool-extractProjectData'; state: 'output-available'; output: ExtractedProjectData }
  | { type: 'tool-showProgress'; state: 'output-available'; output: ProgressData }
  | { type: 'tool-promptForImages'; state: 'output-available'; output: ImagePromptData }
  | { type: 'tool-showPortfolioPreview'; state: 'output-available'; output: PortfolioPreviewData }
  | { type: 'tool-showContentEditor'; state: 'output-available'; output: ContentEditorData };

/** Progress tracker data */
export interface ProgressData {
  collected: {
    hasImages: boolean;
    hasProjectType: boolean;
    hasMaterials: boolean;
    hasProblem: boolean;
    hasSolution: boolean;
    hasDuration: boolean;
  };
  completeness: number;
  nextSuggestion?: string;
}

/** Image prompt data */
export interface ImagePromptData {
  existingCount: number;
  suggestedCategories?: ('before' | 'after' | 'progress' | 'detail')[];
  message?: string;
}

/** Portfolio preview data */
export interface PortfolioPreviewData {
  title?: string;
  description?: string;
  project_type?: string;
  materials?: string[];
  techniques?: string[];
  images?: Array<{
    url: string;
    type?: 'before' | 'after' | 'progress' | 'detail';
  }>;
  completeness: number;
}

/** Content editor data */
export interface ContentEditorData {
  title: string;
  description: string;
  seo_title?: string;
  seo_description?: string;
  tags?: string[];
  materials?: string[];
  techniques?: string[];
  editable: boolean;
}

/** Artifact action events */
export interface ArtifactAction {
  type: 'edit' | 'regenerate' | 'accept' | 'reject' | 'upload' | 'categorize';
  artifactType: ArtifactType;
  payload?: unknown;
}
```

---

## Component Specifications

### ProjectDataCard

Displays extracted project information with inline editing:

```typescript
// src/components/chat/artifacts/ProjectDataCard.tsx

interface ProjectDataCardProps {
  data: ExtractedProjectData;
  onAction?: (action: ArtifactAction) => void;
}

export function ProjectDataCard({ data, onAction }: ProjectDataCardProps) {
  return (
    <ArtifactCard className="animate-canvas-item-in">
      {/* Header with project type icon */}
      <div className="flex items-center gap-2 mb-3">
        <ProjectTypeIcon type={data.project_type} />
        <h4 className="font-medium">{formatProjectType(data.project_type)}</h4>
      </div>

      {/* Data fields */}
      <div className="space-y-2 text-sm">
        {data.materials_mentioned?.length > 0 && (
          <DataRow
            icon={<Package className="h-4 w-4" />}
            label="Materials"
          >
            <ChipList items={data.materials_mentioned} />
          </DataRow>
        )}

        {data.duration && (
          <DataRow
            icon={<Clock className="h-4 w-4" />}
            label="Duration"
          >
            {data.duration}
          </DataRow>
        )}

        {data.location && (
          <DataRow
            icon={<MapPin className="h-4 w-4" />}
            label="Location"
          >
            {data.location}
          </DataRow>
        )}
      </div>

      {/* Edit button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-3"
        onClick={() => onAction?.({ type: 'edit', artifactType: 'extractProjectData' })}
      >
        <Pencil className="h-3 w-3 mr-1" />
        Edit
      </Button>
    </ArtifactCard>
  );
}
```

### ImageGalleryArtifact

Inline image grid with categorization:

```typescript
// src/components/chat/artifacts/ImageGalleryArtifact.tsx

interface ImageGalleryArtifactProps {
  data: ImagePromptData;
  images: UploadedImage[];
  onUpload: () => void;
  onCategorize: (imageId: string, type: ImageType) => void;
  onRemove: (imageId: string) => void;
}

export function ImageGalleryArtifact({
  data,
  images,
  onUpload,
  onCategorize,
  onRemove,
}: ImageGalleryArtifactProps) {
  return (
    <ArtifactCard>
      {/* Message */}
      {data.message && (
        <p className="text-sm text-muted-foreground mb-3">{data.message}</p>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {images.map((image) => (
          <ImageThumbnail
            key={image.id}
            image={image}
            onCategorize={(type) => onCategorize(image.id, type)}
            onRemove={() => onRemove(image.id)}
          />
        ))}

        {/* Add more button */}
        <button
          onClick={onUpload}
          className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary flex items-center justify-center"
        >
          <Plus className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>

      {/* Category suggestions */}
      {data.suggestedCategories && (
        <div className="flex gap-2 text-xs">
          <span className="text-muted-foreground">Try adding:</span>
          {data.suggestedCategories.map((cat) => (
            <Badge key={cat} variant="outline">{cat}</Badge>
          ))}
        </div>
      )}
    </ArtifactCard>
  );
}
```

---

## Migration Strategy

### Phase 1: Add ArtifactRenderer (Non-breaking)

1. Create `/artifacts` directory
2. Implement `ArtifactRenderer` that handles unknown types gracefully
3. Update `ChatMessage` to use `ArtifactRenderer` for tool parts
4. Existing `extractProjectData` tool results now render as cards

### Phase 2: Add New Tools (Additive)

1. Add `showProgress`, `promptForImages`, `showPortfolioPreview` tools
2. Update system prompt to use new tools appropriately
3. Implement corresponding artifact components
4. All existing functionality continues to work

### Phase 3: Integrate with Split View (Optional Enhancement)

1. Add `LivePortfolioCanvas` for desktop split view
2. Use `useArtifacts` hook to feed data to canvas
3. Mobile: Add swipe-to-preview gesture
4. Original single-column view remains available as fallback

---

## Related Documentation

- **SDK Reference**: `./vercel-ai-sdk-reference.md`
- **UX Patterns**: `./chat-ux-patterns.md`
- **Implementation Roadmap**: `./implementation-roadmap.md`
