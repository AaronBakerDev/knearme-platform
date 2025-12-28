# Chat Artifacts Design Specification

> Technical specification for the artifact system in knearme-portfolio.
> Artifacts are rich, interactive UI components rendered inline within chat messages.

---

## Table of Contents

1. [Overview](#overview)
2. [Artifact Types](#artifact-types)
3. [Component Architecture](#component-architecture)
4. [Tool-to-Artifact Mapping](#tool-to-artifact-mapping)
5. [Confidence Scoring & Clarification](#confidence-scoring--clarification)
6. [State Management](#state-management)
7. [Data Flow](#data-flow)
8. [API Changes](#api-changes)
9. [Type Definitions](#type-definitions)
10. [Component Specifications](#component-specifications)
11. [Migration Strategy](#migration-strategy)
12. [Unified Create/Edit Mode](#unified-createedit-mode)
13. [Data Persistence Strategy](#data-persistence-strategy)
14. [Project Memory System](#project-memory-system)

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
| `ClarificationCard` | `requestClarification` | Ask for confirmation when AI is uncertain |

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

### New requestClarification Tool

Ask for user confirmation when extracted data is uncertain:

```typescript
requestClarification: tool({
  description: `Ask the user to clarify or confirm extracted information.
    Use when:
    - Confidence in extracted data is below 0.7
    - Multiple interpretations are possible
    - Information seems inconsistent with prior context
    - Critical fields need explicit confirmation`,
  inputSchema: z.object({
    field: z.string().describe('The field being clarified (e.g., "project_type", "materials")'),
    currentValue: z.string().optional().describe('What we think it is'),
    alternatives: z.array(z.string()).optional().describe('Other possible interpretations'),
    question: z.string().describe('Natural language question to ask'),
    confidence: z.number().min(0).max(1).describe('How confident we are (0-1)'),
    context: z.string().optional().describe('Why we are uncertain'),
  }),
  execute: async (args) => args,
}),
```

---

## Confidence Scoring & Clarification

When the AI extracts data from natural conversation, confidence can vary. The `requestClarification` tool enables the AI to ask for confirmation when uncertain.

### When to Request Clarification

The AI should call `requestClarification` in these scenarios:

| Scenario | Example | Confidence |
|----------|---------|------------|
| Ambiguous input | "I did some brick work" → Type unclear | 0.3-0.5 |
| Multiple interpretations | "Red brick" → Brick type or color? | 0.4-0.6 |
| Contradictory context | Previously said "chimney", now says "wall" | 0.2-0.4 |
| Critical field | Project type affects entire portfolio | < 0.8 required |
| Inference vs explicit | AI guessed from context, not stated | 0.5-0.7 |

### Confidence Thresholds

```typescript
const CONFIDENCE_THRESHOLDS = {
  // Below this, always request clarification
  REQUIRE_CLARIFICATION: 0.5,

  // Between these, consider context
  SUGGEST_CONFIRMATION: 0.7,

  // Above this, proceed without asking
  HIGH_CONFIDENCE: 0.85,
};

// In extractProjectData tool execution
function shouldRequestClarification(
  field: string,
  confidence: number,
  isCriticalField: boolean
): boolean {
  if (confidence < CONFIDENCE_THRESHOLDS.REQUIRE_CLARIFICATION) return true;
  if (isCriticalField && confidence < CONFIDENCE_THRESHOLDS.SUGGEST_CONFIRMATION) return true;
  return false;
}

const CRITICAL_FIELDS = ['project_type', 'location', 'materials_mentioned'];
```

### ClarificationCard Component

```typescript
// src/components/chat/artifacts/ClarificationCard.tsx

interface ClarificationCardProps {
  data: {
    field: string;
    currentValue?: string;
    alternatives?: string[];
    question: string;
    confidence: number;
    context?: string;
  };
  onConfirm: (value: string) => void;
  onReject: () => void;
  onProvideNew: (value: string) => void;
}

export function ClarificationCard({
  data,
  onConfirm,
  onReject,
  onProvideNew,
}: ClarificationCardProps) {
  const [customValue, setCustomValue] = useState('');

  return (
    <ArtifactCard className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      {/* Question header */}
      <div className="flex items-start gap-2 mb-3">
        <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">{data.question}</p>
          {data.context && (
            <p className="text-sm text-muted-foreground mt-1">{data.context}</p>
          )}
        </div>
      </div>

      {/* Confidence indicator */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">AI confidence:</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full',
              data.confidence < 0.5 && 'bg-red-500',
              data.confidence >= 0.5 && data.confidence < 0.7 && 'bg-amber-500',
              data.confidence >= 0.7 && 'bg-green-500'
            )}
            style={{ width: `${data.confidence * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium">{Math.round(data.confidence * 100)}%</span>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {/* Confirm current value */}
        {data.currentValue && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onConfirm(data.currentValue!)}
          >
            <Check className="h-4 w-4 mr-2 text-green-500" />
            Yes, it's "{data.currentValue}"
          </Button>
        )}

        {/* Alternatives */}
        {data.alternatives?.map((alt) => (
          <Button
            key={alt}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onConfirm(alt)}
          >
            Actually, it's "{alt}"
          </Button>
        ))}

        {/* Custom input */}
        <div className="flex gap-2">
          <Input
            placeholder="Something else..."
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => onProvideNew(customValue)}
            disabled={!customValue}
          >
            Use this
          </Button>
        </div>
      </div>
    </ArtifactCard>
  );
}
```

### Flow with Clarification

```
User: "I rebuilt a brick thing last week"
         │
         ▼
AI extracts: project_type = "brick-work"
         │
         ▼
Confidence: 0.4 (ambiguous "thing")
         │
         ▼
AI calls requestClarification({
  field: "project_type",
  currentValue: "brick repair",
  alternatives: ["chimney", "wall", "steps", "foundation"],
  question: "What kind of brick project was it?",
  confidence: 0.4,
  context: "I heard 'brick thing' but want to make sure I categorize it correctly"
})
         │
         ▼
ClarificationCard renders inline
         │
         ▼
User clicks: "Actually, it's 'chimney'"
         │
         ▼
extractProjectData called with confirmed value
         │
         ▼
Data saved with high confidence
```

### Handling Clarification Responses

```typescript
// In ChatWizard when user responds to clarification
function handleClarificationResponse(field: string, confirmedValue: string) {
  // Add to messages as user response
  const userMessage: UIMessage = {
    id: generateId(),
    role: 'user',
    parts: [{ type: 'text', text: confirmedValue }],
  };

  // The AI will see this and update extractProjectData with high confidence
  sendMessage({ text: confirmedValue });

  // Optionally, directly update extracted data
  updateExtractedData({ [field]: confirmedValue });
}
```

### System Prompt Guidance

Add to system prompt for clarification behavior:

```typescript
const CLARIFICATION_PROMPT_ADDITION = `
## Handling Uncertainty

When you're not sure about something the user said:
1. For ambiguous terms, call requestClarification with alternatives
2. Set confidence based on how sure you are (0.0 = guess, 1.0 = certain)
3. If confidence < 0.5, ALWAYS ask for clarification
4. For critical fields (project type, materials), ask if confidence < 0.7

DO NOT just assume or guess. Users prefer being asked over having wrong data.

Example:
- User says: "I worked on that masonry project"
- You're not sure if it's chimney, tuckpointing, or general repair
- Call requestClarification with all possibilities
- Wait for their response before extracting with high confidence
`;
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
│               Gemini 3 Flash (preview)                          │
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
import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { z } from 'zod';
import { getChatModel } from '@/lib/ai/providers';
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
      model: getChatModel(),  // Gemini 3 Flash (preview)
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
  | 'showContentEditor'
  | 'requestClarification';

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
  | { type: 'tool-showContentEditor'; state: 'output-available'; output: ContentEditorData }
  | { type: 'tool-requestClarification'; state: 'output-available'; output: ClarificationData };

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

/** Clarification request data */
export interface ClarificationData {
  field: string;
  currentValue?: string;
  alternatives?: string[];
  question: string;
  confidence: number;
  context?: string;
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

## Unified Create/Edit Mode

The chat interface supports both project creation and editing through a single unified experience. Each mode initializes differently but uses the same artifact components.

### Chat Modes

```typescript
type ChatMode = 'create' | 'edit';

interface ChatModeConfig {
  mode: ChatMode;
  projectId: string;
  systemPrompt: string;
  initialArtifacts: InitialArtifact[];
  welcomeMessage: string;
}
```

### Mode Initialization

#### Create Mode
- Empty project created in database
- No initial artifacts
- AI guides user through information gathering
- Artifacts appear as data is extracted

```typescript
const createModeConfig: ChatModeConfig = {
  mode: 'create',
  projectId: newProjectId,
  systemPrompt: CREATION_SYSTEM_PROMPT,
  initialArtifacts: [],
  welcomeMessage: "Hey! Ready to add a project? Tell me about it.",
};
```

#### Edit Mode (Fresh Start)
- Existing project loaded from database
- Initial artifacts pre-populated with current data
- AI assists with improvements and changes
- Each session starts clean (no conversation history)

```typescript
const editModeConfig: ChatModeConfig = {
  mode: 'edit',
  projectId: existingProjectId,
  systemPrompt: EDITING_SYSTEM_PROMPT,
  initialArtifacts: [
    {
      type: 'projectDataCard',
      data: existingProject,
      mode: 'editable',
    },
    {
      type: 'imageGallery',
      data: existingImages,
      mode: 'editable',
    },
    {
      type: 'contentEditor',
      data: {
        title: existingProject.title,
        description: existingProject.description,
        seo_title: existingProject.seo_title,
        seo_description: existingProject.seo_description,
      },
      mode: 'editable',
    },
    {
      type: 'progressTracker',
      data: calculateProgress(existingProject),
      mode: 'view',
    },
  ],
  welcomeMessage: `Here's your "${existingProject.title}" project. What would you like to change?`,
};
```

### Artifact Modes

Each artifact supports different interaction modes:

```typescript
type ArtifactMode = 'view' | 'editable' | 'editing';

interface ArtifactModeState {
  mode: ArtifactMode;
  isDirty: boolean;
  originalData: unknown;
  currentData: unknown;
  lastSaved: Date | null;
}
```

| Mode | Behavior |
|------|----------|
| `view` | Read-only display |
| `editable` | Shows edit affordances, click to enter editing |
| `editing` | Active editing state with save/cancel |

### Edit Mode Artifacts

#### ProjectDataCard (Editable)

```tsx
interface EditableProjectDataCardProps {
  data: ExtractedProjectData;
  mode: ArtifactMode;
  onEdit: (field: string, value: unknown) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

// Renders with:
// - Pencil icon on each editable field
// - Click-to-edit inline inputs
// - Save/Cancel buttons when editing
// - Visual dirty state indicator
```

#### ImageGalleryArtifact (Full CRUD)

```tsx
interface EditableImageGalleryProps {
  images: UploadedImage[];
  mode: ArtifactMode;
  onAdd: (files: File[]) => void;
  onRemove: (imageId: string) => void;
  onReorder: (newOrder: string[]) => void;
  onCategorize: (imageId: string, type: ImageType) => void;
  onSetHero: (imageId: string) => void;
}

// Supports:
// - Drag-and-drop reordering
// - Long-press/right-click context menu
// - Hero image designation
// - Add via button or drag-drop
// - Delete with confirmation
```

#### ContentEditor (Full Editing)

```tsx
interface EditableContentEditorProps {
  content: GeneratedContent;
  mode: ArtifactMode;
  onFieldChange: (field: string, value: string) => void;
  onRegenerate: (section: 'title' | 'description' | 'seo') => void;
  onSave: () => Promise<void>;
}

// Includes:
// - TipTap rich text editor for description
// - Inline title editing
// - SEO fields with character counts
// - "Regenerate" buttons per section
// - Auto-save or explicit save
```

### Edit Mode Tools

Additional tools available in edit mode:

```typescript
// Update specific field
updateField: tool({
  description: 'Update a specific project field',
  inputSchema: z.object({
    field: z.enum(['title', 'description', 'project_type', 'materials', 'techniques', 'tags', 'seo_title', 'seo_description']),
    value: z.unknown(),
  }),
  execute: async ({ field, value }) => {
    // Returns updated field for artifact refresh
    return { field, value, updated: true };
  },
}),

// Regenerate content section
regenerateSection: tool({
  description: 'Regenerate a section with AI',
  inputSchema: z.object({
    section: z.enum(['title', 'description', 'seo_title', 'seo_description']),
    context: z.string().optional().describe('Additional context for regeneration'),
  }),
  execute: async ({ section, context }) => {
    // Generates new content for section
    return { section, newContent: '...', regenerated: true };
  },
}),

// Reorder images
reorderImages: tool({
  description: 'Change image display order',
  inputSchema: z.object({
    imageOrder: z.array(z.string()).describe('Array of image IDs in new order'),
  }),
  execute: async ({ imageOrder }) => {
    return { imageOrder, reordered: true };
  },
}),

// Validate for publish
validateForPublish: tool({
  description: 'Check if project is ready to publish',
  inputSchema: z.object({}),
  execute: async () => {
    // Returns validation results
    return {
      isValid: boolean,
      missing: string[],
      warnings: string[],
    };
  },
}),
```

### Edit Mode System Prompt

```typescript
const EDITING_SYSTEM_PROMPT = `You are helping a masonry contractor edit their portfolio project.

The current project state is shown in the artifacts above. Help the user:
- Improve their title or description
- Add or reorganize photos
- Fix any issues preventing publication
- Enhance SEO metadata

When the user asks to change something:
1. If it's a simple field update, use the updateField tool
2. If they want AI help improving content, use regenerateSection tool
3. If they're managing images, guide them through the ImageGallery artifact
4. If they ask "what's missing?", use validateForPublish tool

Keep responses brief. The artifacts show the current state - don't repeat what's visible.

Available natural language commands:
- "Make the title more SEO-friendly" → regenerateSection
- "Add 'brick pointing' to materials" → updateField
- "What's missing for publish?" → validateForPublish
- "Put the after photo first" → reorderImages (or guide to drag-drop)
`;
```

### Session Management

#### Fresh Start Pattern

Each edit session starts clean without conversation history:

```typescript
// In ChatWizard
useEffect(() => {
  if (mode === 'edit') {
    // Load project data
    const project = await fetchProject(projectId);
    const images = await fetchImages(projectId);

    // Create initial artifacts (not messages)
    const initialArtifacts = buildInitialArtifacts(project, images);

    // Set welcome message only
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      parts: [
        { type: 'text', text: welcomeMessage },
        ...initialArtifacts.map(toArtifactPart),
      ],
    }]);

    // No history loaded - fresh start
  }
}, [mode, projectId]);
```

#### Why Fresh Start?

1. **Clarity** - User sees current project state, not old conversations
2. **Performance** - No loading/parsing of potentially long history
3. **Relevance** - Old creation conversations may not apply to current edits
4. **Simplicity** - Easier to implement and maintain

### Data Flow: Edit Mode

```
┌─────────────────────────────────────────────────────────────────┐
│                        EDIT MODE FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. User navigates to /projects/[id]/edit
   │
   ▼
2. ChatWizard initializes in edit mode
   │
   ├─► Fetch project: GET /api/projects/[id]
   ├─► Fetch images: GET /api/projects/[id]/images
   │
   ▼
3. Build initial artifacts from fetched data
   │
   ▼
4. Display welcome message + all artifacts
   │
   ▼
5. User interacts:
   │
   ├─► Chat: "Make title more catchy"
   │   │
   │   ├─► AI calls regenerateSection({ section: 'title' })
   │   ├─► New title generated
   │   ├─► ContentEditor artifact updates
   │   └─► PATCH /api/projects/[id] saves change
   │
   ├─► Direct edit: Click title in ContentEditor
   │   │
   │   ├─► Artifact enters 'editing' mode
   │   ├─► User types new title
   │   ├─► Click save
   │   └─► PATCH /api/projects/[id] saves change
   │
   └─► Image: Drag to reorder in ImageGallery
       │
       ├─► Optimistic UI update
       ├─► PATCH /api/projects/[id]/images
       └─► Confirm or rollback
```

### URL Routing

```typescript
// Unified chat route handles both modes
// /projects/new → Create mode
// /projects/[id]/edit → Edit mode

// In page.tsx
export default function ProjectChatPage({ params, searchParams }) {
  const isNewProject = params.id === 'new';

  return (
    <ChatWizard
      mode={isNewProject ? 'create' : 'edit'}
      projectId={isNewProject ? undefined : params.id}
    />
  );
}
```

### Comparison: Create vs Edit Mode

| Aspect | Create Mode | Edit Mode |
|--------|-------------|-----------|
| Initial state | Empty project | Loaded project + images |
| Welcome message | "What project are you adding?" | "Here's your project. What to change?" |
| Initial artifacts | None | All populated |
| Conversation history | Accumulates | Fresh start each session |
| Primary AI role | Extract information | Assist with improvements |
| Artifact mode | Becomes editable | Starts editable |
| Save pattern | Gradual extraction | Immediate on change |
| Publish flow | After generation | Anytime ready |

---

## Data Persistence Strategy

This section documents how and when data is saved to the database during chat interactions. This is a critical architectural decision affecting reliability, user experience, and data integrity.

### Current Implementation: Batch Save (Project Data)

The existing implementation uses a "batch save at end" pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT: BATCH SAVE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Chat Messages                                                   │
│       │                                                          │
│       ▼                                                          │
│  extractProjectData tool                                         │
│       │                                                          │
│       ▼                                                          │
│  execute: async (args) => args   ◄── NO DATABASE SAVE            │
│       │                              Just returns data           │
│       ▼                                                          │
│  Client: setExtractedData(data)  ◄── React state only            │
│       │                                                          │
│       ▼                                                          │
│  User clicks "Generate Portfolio"                                │
│       │                                                          │
│       ▼                                                          │
│  /api/ai/generate-content        ◄── SAVES TO DATABASE           │
│                                      (title, description, etc)   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Risk:** If the user closes the tab before clicking "Generate", project fields may remain incomplete because extracted data is not written to the `projects` table during chat.

**Exception:** Images are saved immediately to Supabase Storage via `/api/projects/[id]/images`.

### Current Implementation: Full Chat History + Tool Parts

The chat system **does** persist full message history (including tool parts) into `chat_messages.metadata.parts`, and uses smart context loading to resume sessions:

- Messages are saved via `POST /api/chat/sessions/[id]/messages` with `parts` included
- Context is loaded with `/api/chat/sessions/[id]/context` (full history for short sessions; summary + recent messages for long sessions)
- Tool parts are restored client-side and rendered as artifacts

**Known limitation:** tool-only messages without any text content are currently skipped by the client-side save logic, so those tool parts will not persist unless paired with a text part.

### Proposed Implementation: Incremental Save

The artifact system introduces an "incremental save" pattern where data is persisted as it's collected:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPOSED: INCREMENTAL SAVE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Chat Message                                                    │
│       │                                                          │
│       ▼                                                          │
│  extractProjectData tool                                         │
│       │                                                          │
│       ▼                                                          │
│  execute: async (args, { projectId }) => {                       │
│    await saveProjectData(projectId, args);  ◄── SAVE IMMEDIATELY │
│    return args;                                                  │
│  }                                                               │
│       │                                                          │
│       ▼                                                          │
│  Client: Update artifact UI      ◄── Show saved state            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Save Strategy by Tool

| Tool | Current | Proposed | Rationale |
|------|---------|----------|-----------|
| `extractProjectData` | Returns data only | **Save to `projects` table** | Prevents data loss |
| `showProgress` | N/A (display only) | No save | Pure UI feedback |
| `promptForImages` | N/A (display only) | No save | Image uploads save separately |
| `showPortfolioPreview` | N/A (display only) | No save | Composite view of existing data |
| `showContentEditor` | N/A | No save | User explicitly saves edits |
| `updateField` (edit mode) | N/A | **Save to `projects` table** | Real-time persistence |
| `regenerateSection` (edit mode) | N/A | **Save to `projects` table** | Persist AI improvements |
| `reorderImages` (edit mode) | N/A | **Save to `project_images` table** | Persist order changes |

### Tool Execution with Database Saves

```typescript
// Enhanced tool execution with persistence
extractProjectData: tool({
  description: 'Extract and save project information',
  inputSchema: extractProjectDataSchema,
  execute: async (args, context) => {
    const { projectId } = context;

    // Build update object (only non-null fields)
    const updates: Partial<Project> = {};
    if (args.project_type) updates.project_type_slug = slugify(args.project_type);
    if (args.materials_mentioned?.length) updates.materials = args.materials_mentioned;
    if (args.techniques_mentioned?.length) updates.techniques = args.techniques_mentioned;
    if (args.location) updates.city = args.location;
    // ... other fields

    // Save to database
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);
    }

    // Return for artifact rendering
    return {
      ...args,
      saved: true,
      savedAt: new Date().toISOString(),
    };
  },
}),
```

### Optimistic Updates

For responsive UI, use optimistic updates with rollback on error:

```typescript
// Client-side optimistic update pattern
function useOptimisticSave<T>(
  initialData: T,
  saveFn: (data: T) => Promise<void>
) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousDataRef = useRef<T>(initialData);

  const save = useCallback(async (newData: Partial<T>) => {
    const merged = { ...data, ...newData };

    // Optimistic update
    previousDataRef.current = data;
    setData(merged);
    setIsSaving(true);
    setError(null);

    try {
      await saveFn(merged);
    } catch (err) {
      // Rollback on error
      setData(previousDataRef.current);
      setError(err as Error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data, saveFn]);

  return { data, save, isSaving, error };
}
```

### Artifact Save Status Indicator

Each artifact displays its persistence status:

```typescript
interface ArtifactSaveStatus {
  status: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSaved: Date | null;
  error: string | null;
}

// In artifact component
function SaveStatusBadge({ status }: { status: ArtifactSaveStatus }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      {status.status === 'saved' && (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">Saved</span>
        </>
      )}
      {status.status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status.status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3 text-destructive" />
          <span className="text-destructive">Save failed</span>
        </>
      )}
    </div>
  );
}
```

### Error Recovery

When a save fails, the system should:

1. **Show error state** - Visual indicator on the artifact
2. **Preserve local data** - Don't discard user's changes
3. **Allow retry** - Provide a retry button
4. **Queue for later** - If offline, queue saves for when connection returns

```typescript
interface SaveQueue {
  pending: SaveOperation[];
  failed: SaveOperation[];
}

interface SaveOperation {
  id: string;
  projectId: string;
  field: string;
  value: unknown;
  timestamp: Date;
  retryCount: number;
}

// Retry failed saves with exponential backoff
async function retrySaves(queue: SaveQueue) {
  for (const op of queue.failed) {
    if (op.retryCount >= 3) continue; // Max retries exceeded

    try {
      await saveField(op.projectId, op.field, op.value);
      queue.failed = queue.failed.filter(o => o.id !== op.id);
    } catch (err) {
      op.retryCount++;
    }
  }
}
```

### Session Recovery

If a user returns to an incomplete session, the system should restore their progress:

```typescript
interface SessionRecoveryData {
  projectId: string;
  lastMessageId: string;
  unsavedChanges: Partial<ExtractedProjectData>;
  uploadedImages: string[];
  timestamp: Date;
}

// Save recovery data to localStorage periodically
function useSessionRecovery(projectId: string) {
  const { data, setData } = useProjectData();

  // Save to localStorage on every change
  useEffect(() => {
    const recovery: SessionRecoveryData = {
      projectId,
      lastMessageId: messages[messages.length - 1]?.id,
      unsavedChanges: data,
      uploadedImages: images.map(i => i.id),
      timestamp: new Date(),
    };
    localStorage.setItem(`chat-recovery-${projectId}`, JSON.stringify(recovery));
  }, [data, projectId, messages, images]);

  // Check for recovery data on mount
  useEffect(() => {
    const saved = localStorage.getItem(`chat-recovery-${projectId}`);
    if (saved) {
      const recovery = JSON.parse(saved) as SessionRecoveryData;
      // Check if data is recent (within 24 hours)
      if (Date.now() - new Date(recovery.timestamp).getTime() < 24 * 60 * 60 * 1000) {
        setShowRecoveryPrompt(true);
        setRecoveryData(recovery);
      }
    }
  }, [projectId]);

  return { showRecoveryPrompt, recoveryData, applyRecovery, discardRecovery };
}
```

### Debounced Auto-Save

For frequent changes (like typing in ContentEditor), use debounced saves:

```typescript
// Debounced save hook
function useDebouncedSave<T>(
  value: T,
  saveFn: (value: T) => Promise<void>,
  delay: number = 1000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveFn(value);
        setLastSaved(new Date());
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, saveFn, delay]);

  return { isSaving, lastSaved };
}

// Usage in ContentEditor
function ContentEditor({ initialContent, projectId }) {
  const [content, setContent] = useState(initialContent);

  const saveFn = useCallback(async (data: ContentData) => {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
      }),
    });
  }, [projectId]);

  const { isSaving, lastSaved } = useDebouncedSave(content, saveFn, 2000);

  // ... render with save status
}
```

### Persistence Strategy by Mode

| Aspect | Create Mode | Edit Mode |
|--------|-------------|-----------|
| **When to save** | After each `extractProjectData` call | Immediately on field change |
| **What triggers save** | Tool execution | User action (blur, submit) |
| **Save indicator** | Subtle (auto-save) | Explicit (show saved state) |
| **Failure handling** | Queue for retry | Show error, allow retry |
| **Recovery** | localStorage checkpoint | Database is source of truth |

### API Endpoint Changes

To support incremental saves, update the project API:

```typescript
// PATCH /api/projects/[id]
// Supports partial updates for any project field

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return apiError('UNAUTHORIZED');

  const updates = await request.json();

  // Validate: only allowed fields
  const allowedFields = [
    'title', 'description', 'project_type_slug', 'city_slug',
    'materials', 'techniques', 'tags',
    'seo_title', 'seo_description',
    'status',
  ];

  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowedFields.includes(k))
  );

  if (Object.keys(filteredUpdates).length === 0) {
    return apiError('VALIDATION_ERROR', 'No valid fields to update');
  }

  // Update project
  const { data, error } = await supabase
    .from('projects')
    .update(filteredUpdates)
    .eq('id', params.id)
    .eq('contractor_id', auth.contractor.id)
    .select()
    .single();

  if (error) return apiError('DATABASE_ERROR', error.message);

  return apiSuccess({ project: data, updated: Object.keys(filteredUpdates) });
}
```

### Database Schema: Persistence Tracking

Optional: Add tracking columns for debugging and analytics:

```sql
-- Add persistence tracking to projects table
ALTER TABLE projects ADD COLUMN last_chat_update TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN chat_update_count INTEGER DEFAULT 0;

-- Trigger to update on changes
CREATE OR REPLACE FUNCTION track_chat_updates()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_chat_update = NOW();
  NEW.chat_update_count = COALESCE(OLD.chat_update_count, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_chat_update_trigger
BEFORE UPDATE ON projects
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION track_chat_updates();
```

### Migration Path

1. **Phase 1:** Keep current batch save, add localStorage recovery
2. **Phase 2:** Add PATCH endpoint for partial updates
3. **Phase 3:** Update tools to save incrementally
4. **Phase 4:** Add optimistic updates and save status UI
5. **Phase 5:** Add offline queue and retry logic

---

## Project Memory System

> **Note:** This section documents a future enhancement for multi-session project memory. See Implementation Roadmap Phase 7 for timeline.

### Overview

Projects can have multiple chat sessions over time. To provide continuity without loading full history, we use a summarization-based memory system.

### Memory Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PROJECT                                  │
├─────────────────────────────────────────────────────────────────┤
│  Core Data: title, description, images, etc.                     │
├─────────────────────────────────────────────────────────────────┤
│  project_memory: {                                               │
│    decisions: ["Prefers traditional brick style"],               │
│    preferences: { tone: "professional", detail: "high" },        │
│    keyFacts: ["Historic 1920s home", "HOA approval needed"],     │
│    questionsAnswered: ["What materials?", "Timeline?"],          │
│  }                                                               │
├─────────────────────────────────────────────────────────────────┤
│  chat_sessions:                                                  │
│    Session 1 → summary: "Initial project setup..."               │
│    Session 2 → summary: "Added photos, refined description..."   │
│    Session 3 → (current, no summary yet)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Memory Types

```typescript
interface ProjectMemory {
  // Accumulated knowledge across all sessions
  decisions: string[];           // Key decisions made
  preferences: Record<string, unknown>; // User preferences
  keyFacts: string[];           // Important project facts
  questionsAnswered: string[];  // Questions we don't need to re-ask
  topicsDiscussed: string[];    // For continuity
}

interface SessionSummary {
  sessionId: string;
  summary: string;              // 2-3 sentence summary
  keyPoints: string[];          // Bullet points
  timestamp: Date;
}
```

### Context Building

When starting a new session, build context from memory:

```typescript
async function buildSessionContext(projectId: string): Promise<string> {
  const project = await getProject(projectId);
  const memory = await getProjectMemory(projectId);
  const recentSessions = await getRecentSessions(projectId, 2);

  return `
## Current Project State
Title: ${project.title || 'Untitled'}
Type: ${project.project_type_slug || 'Not set'}
Status: ${project.status}
Images: ${project.images?.length || 0}

## Working Memory
Key Decisions: ${memory.decisions.slice(-5).join('; ')}
User Preferences: ${JSON.stringify(memory.preferences)}
Key Facts: ${memory.keyFacts.slice(-5).join('; ')}

## Recent Sessions
${recentSessions.map(s => `- ${s.summary}`).join('\n')}

## Already Discussed
${memory.questionsAnswered.slice(-10).join(', ')}
`;
}
```

### Memory Generation Tool

At the end of each session (or periodically), generate a summary:

```typescript
summarizeSession: tool({
  description: 'Summarize the current conversation for future reference',
  inputSchema: z.object({
    summary: z.string().describe('2-3 sentence summary'),
    decisions: z.array(z.string()).describe('Decisions made'),
    preferences: z.record(z.unknown()).describe('Preferences expressed'),
    keyFacts: z.array(z.string()).describe('Important facts learned'),
    questionsAnswered: z.array(z.string()).describe('Questions answered'),
  }),
  execute: async (args, { projectId, sessionId }) => {
    // Merge with existing memory
    const existing = await getProjectMemory(projectId);

    const updated: ProjectMemory = {
      decisions: [...existing.decisions, ...args.decisions].slice(-20),
      preferences: { ...existing.preferences, ...args.preferences },
      keyFacts: [...existing.keyFacts, ...args.keyFacts].slice(-20),
      questionsAnswered: [...existing.questionsAnswered, ...args.questionsAnswered].slice(-30),
      topicsDiscussed: existing.topicsDiscussed,
    };

    await saveProjectMemory(projectId, updated);
    await saveSessionSummary(sessionId, args.summary, args.decisions);

    return { saved: true };
  },
}),
```

### Database Schema for Memory

```sql
-- Add memory to projects table
ALTER TABLE projects ADD COLUMN memory JSONB DEFAULT '{
  "decisions": [],
  "preferences": {},
  "keyFacts": [],
  "questionsAnswered": [],
  "topicsDiscussed": []
}';

-- Add summary to chat_sessions
ALTER TABLE chat_sessions ADD COLUMN summary TEXT;
ALTER TABLE chat_sessions ADD COLUMN key_points JSONB DEFAULT '[]';
```

### When to Generate Summaries

1. **End of session** - When user navigates away or closes chat
2. **Periodically** - Every 10 messages during long sessions
3. **On request** - User can ask to save progress
4. **Before generation** - Before final content generation

---

## Related Documentation

- **SDK Reference**: `./vercel-ai-sdk-reference.md`
- **UX Patterns**: `./chat-ux-patterns.md`
- **Implementation Roadmap**: `./implementation-roadmap.md`
