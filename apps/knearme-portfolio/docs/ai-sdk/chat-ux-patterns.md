# Chat UX Patterns & Component Guide

> Visual and interaction patterns for the enhanced chat experience.
> Design system aligned with knearme-portfolio (Tailwind CSS 4 + shadcn/ui).

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Layout Specifications](#layout-specifications)
3. [Component Designs](#component-designs)
4. [Animation System](#animation-system)
5. [Progress Visualization](#progress-visualization)
6. [Interaction Patterns](#interaction-patterns)
7. [Responsive Behavior](#responsive-behavior)
8. [Accessibility](#accessibility)
9. [Color & Typography](#color--typography)
10. [Tailwind Utilities](#tailwind-utilities)

---

## Design Philosophy

### Core Principles

1. **Immersive Creation** - Users should feel like they're building something, not just answering questions
2. **Progressive Disclosure** - Reveal complexity gradually as users engage
3. **Immediate Feedback** - Every action should have visible, immediate results
4. **Celebration** - Acknowledge milestones and progress
5. **Mobile-First** - Contractors are often in the field; mobile UX is primary

### Current "Void Interface" Preserved

The existing minimal design is maintained:
- Clean, uncluttered backgrounds
- Floating elements with subtle shadows
- Centered 650px content column
- Teal primary color (`oklch(0.72 0.14 185)`)

---

## Layout Specifications

### Desktop Split View (1024px+)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Logo]                                              [X Cancel]      │
│  ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│  ┌────────────────────────┐   ┌──────────────────────────────────┐  │
│  │                        │   │                                  │  │
│  │     CHAT COLUMN        │   │    LIVE PORTFOLIO CANVAS         │  │
│  │        400px           │   │         flex-1                   │  │
│  │                        │   │                                  │  │
│  │  ┌──────────────────┐  │   │  ┌────────────────────────────┐  │  │
│  │  │ AI: Hey! What    │  │   │  │                            │  │  │
│  │  │ project?         │  │   │  │   [Hero Image Grid]        │  │  │
│  │  └──────────────────┘  │   │  │                            │  │  │
│  │                        │   │  │   Title: Chimney Rebuild   │  │  │
│  │         ┌───────────┐  │   │  │                            │  │  │
│  │         │ Chimney   │  │   │  │   Materials:               │  │  │
│  │         │ rebuild   │  │   │  │   [Red Brick] [Mortar]     │  │  │
│  │         └───────────┘  │   │  │                            │  │  │
│  │                        │   │  │   Description preview...   │  │  │
│  │  ┌──────────────────┐  │   │  │                            │  │  │
│  │  │ [ProjectDataCard]│  │   │  └────────────────────────────┘  │  │
│  │  │ Type: Chimney    │  │   │                                  │  │
│  │  │ Materials: Brick │  │   │  ────────────────────────────── │  │
│  │  └──────────────────┘  │   │  Completeness: 65% ━━━━━━━░░░░  │  │
│  │                        │   │  "Add photos to continue"       │  │
│  └────────────────────────┘   └──────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ [+] Type or tap mic to record...                         [🎤]  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**CSS Grid Layout:**

```css
.chat-wizard-container {
  display: grid;
  grid-template-columns: 400px 1fr;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  gap: 0;
}

.chat-column {
  grid-column: 1;
  grid-row: 2;
  overflow-y: auto;
  border-right: 1px solid oklch(0.92 0 0);
}

.canvas-column {
  grid-column: 2;
  grid-row: 2;
  overflow-y: auto;
  padding: 24px;
  background: oklch(0.98 0 0);
}

.input-area {
  grid-column: 1 / -1;
  grid-row: 3;
  padding: 16px 24px;
  background: oklch(1 0 0);
  border-top: 1px solid oklch(0.92 0 0);
}
```

### Tablet Layout (768px - 1023px)

```
┌──────────────────────────────────────┐
│  [Logo]       [Preview 📱]  [Cancel] │
│  ──────────────────────────────────── │
│                                      │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │        CHAT MESSAGES           │  │
│  │        (full width)            │  │
│  │                                │  │
│  │  AI: Hey! What project?        │  │
│  │                                │  │
│  │         ┌───────────────┐      │  │
│  │         │ Chimney       │      │  │
│  │         └───────────────┘      │  │
│  │                                │  │
│  │  ┌───────────────────────────┐ │  │
│  │  │ [ProjectDataCard]         │ │  │
│  │  └───────────────────────────┘ │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Preview: Chimney Rebuild (65%) │  │  ← Floating pill
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ [+] Type or tap mic...   [🎤]  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Floating Preview Pill:**

```typescript
<button
  onClick={expandPreview}
  className="fixed bottom-24 right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg"
>
  <Eye className="h-4 w-4" />
  <span>Preview: {title || 'Portfolio'}</span>
  <Badge variant="secondary">{completeness}%</Badge>
</button>
```

### Mobile Layout (< 768px)

```
┌─────────────────────────────┐
│  [X]      New Project    ⟳  │
├─────────────────────────────┤
│  [📷][📷][📷][📷] [+]  →    │  ← Photo filmstrip (h-scroll)
├─────────────────────────────┤
│                             │
│  AI: Hey! What project      │
│  are you adding today?      │
│                             │
│            ┌─────────────┐  │
│            │ Chimney     │  │
│            │ rebuild     │  │
│            └─────────────┘  │
│                             │
│  AI: Nice! What was         │
│  wrong with it?             │
│                             │
│  ┌───────────────────────┐  │
│  │ [ProjectDataCard]     │  │
│  │ Chimney | Red Brick   │  │
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│ [Chimney][Brick][2 days] ▲  │  ← Collected Data Peek Bar
├─────────────────────────────┤
│ [+] Type...           [🎤]  │
└─────────────────────────────┘
```

---

## Component Designs

### 1. LivePortfolioCanvas

Real-time preview that updates as data is extracted.

```typescript
// Visual states
const canvasStates = {
  empty: {
    images: [],
    title: null,
    completeness: 0,
    render: <CanvasEmptyState />,
  },
  imagesOnly: {
    images: [...],
    title: null,
    completeness: 25,
    render: <CanvasWithImages images={images} />,
  },
  partial: {
    images: [...],
    title: 'Chimney Rebuild',
    completeness: 60,
    render: <CanvasPartial data={data} />,
  },
  ready: {
    images: [...],
    title: 'Historic Chimney Rebuild',
    completeness: 100,
    render: <CanvasReady data={data} />,
  },
};
```

**Empty State:**

```tsx
<div className="flex flex-col items-center justify-center h-full text-center p-8">
  <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4 animate-pulse">
    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
  </div>
  <h3 className="font-medium text-lg mb-2">Your portfolio preview</h3>
  <p className="text-sm text-muted-foreground max-w-xs">
    Tell me about your project and add some photos to see it come together
  </p>
</div>
```

**Partial State (with data):**

```tsx
<div className="space-y-6">
  {/* Hero image grid */}
  <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden">
    {images.slice(0, 3).map((img, i) => (
      <div
        key={img.id}
        className={cn(
          "aspect-square bg-muted",
          i === 0 && "col-span-2 row-span-2"
        )}
      >
        <img src={img.url} alt="" className="w-full h-full object-cover" />
      </div>
    ))}
  </div>

  {/* Title with typewriter effect */}
  <h2 className="text-2xl font-semibold tracking-tight animate-typewriter">
    {title || <span className="text-muted-foreground/50">Project Title</span>}
  </h2>

  {/* Materials chips */}
  <div className="flex flex-wrap gap-2">
    {materials.map((mat, i) => (
      <Badge
        key={mat}
        variant="secondary"
        className={cn("animate-chip-slide-in", `chip-stagger-${i + 1}`)}
      >
        {mat}
      </Badge>
    ))}
    {materials.length === 0 && (
      <span className="text-sm text-muted-foreground">Materials will appear here</span>
    )}
  </div>

  {/* Description placeholder */}
  <div className="prose prose-sm max-w-none">
    {description ? (
      <p>{description}</p>
    ) : (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full animate-pulse" />
        <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
      </div>
    )}
  </div>
</div>
```

### 2. PhotoFilmstrip

Horizontal scrolling photo strip for mobile:

```tsx
<div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide snap-x snap-mandatory">
  {images.map((image) => (
    <button
      key={image.id}
      onClick={() => onSelect(image)}
      className="relative flex-none w-14 h-14 rounded-lg overflow-hidden snap-start"
    >
      <img
        src={image.url}
        alt=""
        className="w-full h-full object-cover"
      />
      {/* Category indicator */}
      {image.image_type && (
        <div className={cn(
          "absolute top-1 right-1 w-2 h-2 rounded-full",
          image.image_type === 'before' && "bg-orange-500",
          image.image_type === 'after' && "bg-green-500",
          image.image_type === 'progress' && "bg-blue-500",
          image.image_type === 'detail' && "bg-purple-500",
        )} />
      )}
    </button>
  ))}

  {/* Add button */}
  <button
    onClick={onAdd}
    className="flex-none w-14 h-14 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center snap-start"
  >
    <Plus className="h-5 w-5 text-muted-foreground" />
  </button>
</div>
```

### 3. CollectedDataPeekBar

Mobile-only bar showing collected data:

```tsx
<button
  onClick={onExpand}
  className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-t"
>
  {/* Data chips */}
  <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
    {data.project_type && (
      <Chip icon={<Home className="h-3 w-3" />}>
        {formatProjectType(data.project_type)}
      </Chip>
    )}
    {data.materials_mentioned?.slice(0, 2).map((mat) => (
      <Chip key={mat}>{mat}</Chip>
    ))}
    {data.duration && (
      <Chip icon={<Clock className="h-3 w-3" />}>{data.duration}</Chip>
    )}
  </div>

  {/* Expand indicator */}
  <ChevronUp className="h-4 w-4 text-muted-foreground" />
</button>
```

### 4. MilestoneToast

Celebration toast for progress milestones:

```tsx
const MILESTONES = {
  firstPhoto: { icon: Camera, message: "First photo added!" },
  typeDetected: { icon: Sparkles, message: "Project type detected!" },
  materialsFound: { icon: Package, message: "Materials identified!" },
  readyToGenerate: { icon: Zap, message: "Ready to generate!" },
  generated: { icon: Check, message: "Portfolio created!" },
};

<div
  className={cn(
    "fixed bottom-28 left-1/2 -translate-x-1/2 z-50",
    "flex items-center gap-3 px-4 py-3 rounded-full",
    "bg-primary text-primary-foreground shadow-lg",
    "animate-toast-slide-up"
  )}
>
  <Icon className="h-5 w-5" />
  <span className="font-medium">{message}</span>
</div>
```

### 5. SmartSuggestionPill

Contextual suggestion that appears above input:

```tsx
<button
  onClick={onTap}
  className={cn(
    "flex items-center gap-2 px-4 py-2 rounded-full",
    "bg-muted hover:bg-muted/80 text-sm",
    "animate-fade-in-up"
  )}
>
  <Lightbulb className="h-4 w-4 text-amber-500" />
  <span>{suggestion}</span>
  <ChevronRight className="h-4 w-4 text-muted-foreground" />
</button>
```

---

## Animation System

### Keyframe Definitions

Add to `src/app/globals.css`:

```css
@keyframes canvas-item-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes chip-slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes toast-slide-up {
  0% {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  10% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  90% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px oklch(0.72 0.14 185 / 0.3);
  }
  50% {
    box-shadow: 0 0 40px oklch(0.72 0.14 185 / 0.5);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progress-fill {
  from { width: 0; }
  to { width: var(--progress); }
}
```

### Animation Utility Classes

```css
/* Artifact entrance */
.animate-canvas-item-in {
  animation: canvas-item-in 0.4s ease-out forwards;
}

/* Chip entrance with stagger */
.animate-chip-slide-in {
  animation: chip-slide-in 0.3s ease-out forwards;
}
.chip-stagger-1 { animation-delay: 0.1s; opacity: 0; }
.chip-stagger-2 { animation-delay: 0.2s; opacity: 0; }
.chip-stagger-3 { animation-delay: 0.3s; opacity: 0; }
.chip-stagger-4 { animation-delay: 0.4s; opacity: 0; }

/* Typewriter effect */
.animate-typewriter {
  overflow: hidden;
  white-space: nowrap;
  animation: typewriter 0.5s steps(30) forwards;
}

/* Toast */
.animate-toast-slide-up {
  animation: toast-slide-up 3s ease-out forwards;
}

/* Glow for ready state */
.animate-glow-pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}

/* Fade in up */
.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out forwards;
}
```

### Transition Specifications

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Message bubble | opacity, transform | 300ms | ease-out |
| Photo thumbnail | transform (scale) | 150ms | ease-out |
| Canvas section | opacity | 400ms | ease-out |
| Quick reply buttons | opacity, transform | 200ms | ease-out |
| Progress bar | width | 500ms | ease-out |
| Generate button glow | box-shadow | 2000ms | ease-in-out |
| Artifact cards | all | 300ms | ease-out |

---

## Progress Visualization

### Completeness Calculation

```typescript
const WEIGHTS = {
  images: 25,           // At least 1 photo
  project_type: 15,     // Type detected
  materials: 15,        // At least 1 material
  customer_problem: 15, // Problem described
  solution: 15,         // Solution explained
  duration: 10,         // Timeline mentioned
  proud_of: 5,          // Bonus: what they're proud of
};

function calculateCompleteness(
  data: ExtractedProjectData,
  imageCount: number
): number {
  let score = 0;
  if (imageCount > 0) score += WEIGHTS.images;
  if (data.project_type) score += WEIGHTS.project_type;
  if (data.materials_mentioned?.length) score += WEIGHTS.materials;
  if (data.customer_problem) score += WEIGHTS.customer_problem;
  if (data.solution_approach) score += WEIGHTS.solution;
  if (data.duration) score += WEIGHTS.duration;
  if (data.proud_of) score += WEIGHTS.proud_of;
  return Math.min(100, score);
}
```

### Progress Ring Component

```tsx
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  progress,
  size = 32,
  strokeWidth = 3,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-500"
      />
    </svg>
  );
}
```

### Progress States

| Range | Visual | Label | Next Action |
|-------|--------|-------|-------------|
| 0-25% | Gray ring, pulsing | "Getting started..." | Add photos or describe project |
| 25-50% | Quarter teal | "Looking good..." | Continue conversation |
| 50-75% | Half teal | "Almost there..." | Add more details |
| 75-99% | Three-quarter teal | "Ready to generate!" | Show generate button |
| 100% | Full teal + glow | "Perfect!" | Generate immediately |

---

## Interaction Patterns

### Image Drop Zone

```tsx
function useDropZone(onDrop: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    const images = files.filter(f => f.type.startsWith('image/'));
    if (images.length) onDrop(images);
  };

  return { isDragging, handleDragOver, handleDragLeave, handleDrop };
}

// Usage in ChatInput
<div
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  className={cn(
    "transition-all",
    isDragging && "ring-2 ring-primary ring-offset-2 bg-primary/5"
  )}
>
  {isDragging && (
    <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-xl">
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-8 w-8 text-primary" />
        <span className="font-medium text-primary">Drop photos here</span>
      </div>
    </div>
  )}
  {/* Regular input */}
</div>
```

### Quick Category Selection

Long-press on image reveals category menu:

```tsx
<Popover>
  <PopoverTrigger asChild>
    <button
      onContextMenu={(e) => { e.preventDefault(); setOpen(true); }}
      className="relative w-14 h-14"
    >
      <img src={image.url} className="w-full h-full object-cover rounded-lg" />
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-2">
    <div className="flex gap-1">
      {(['before', 'after', 'progress', 'detail'] as const).map((type) => (
        <Button
          key={type}
          size="sm"
          variant={image.image_type === type ? 'default' : 'ghost'}
          onClick={() => onCategorize(image.id, type)}
        >
          {categoryIcons[type]}
        </Button>
      ))}
    </div>
  </PopoverContent>
</Popover>
```

### Swipe to Preview (Mobile)

```tsx
const { bind, style } = useSwipeGesture({
  threshold: 100,
  onSwipeUp: () => setPreviewOpen(true),
  onSwipeDown: () => setPreviewOpen(false),
});

<motion.div
  {...bind()}
  style={style}
  className="touch-pan-y"
>
  <CollectedDataPeekBar />
</motion.div>
```

---

## Responsive Behavior

### Breakpoint Strategy

```typescript
const breakpoints = {
  sm: '640px',   // Small phones
  md: '768px',   // Large phones / small tablets
  lg: '1024px',  // Tablets / small laptops
  xl: '1280px',  // Desktops
};

// Layout changes
// < 768px: Single column, filmstrip, peek bar
// 768px - 1023px: Single column, floating preview pill
// >= 1024px: Split view (chat + canvas)
```

### Component Visibility by Breakpoint

| Component | Mobile (< 768) | Tablet (768-1023) | Desktop (1024+) |
|-----------|----------------|-------------------|-----------------|
| PhotoFilmstrip | ✅ Top | ❌ Hidden | ❌ Hidden |
| CollectedDataPeekBar | ✅ Above input | ❌ Hidden | ❌ Hidden |
| Floating Preview Pill | ❌ Hidden | ✅ Bottom-right | ❌ Hidden |
| LivePortfolioCanvas | Swipe to reveal | Tap pill to show | ✅ Right column |
| Split Layout | ❌ Single column | ❌ Single column | ✅ Two columns |

### Tailwind Responsive Classes

```tsx
// Example: Canvas visibility
<div className="hidden lg:block lg:col-span-1">
  <LivePortfolioCanvas />
</div>

// Example: Filmstrip visibility
<div className="md:hidden">
  <PhotoFilmstrip />
</div>

// Example: Peek bar visibility
<div className="md:hidden">
  <CollectedDataPeekBar />
</div>
```

---

## Accessibility

### ARIA Live Regions

```tsx
{/* Progress announcements */}
<div aria-live="polite" className="sr-only">
  {`Portfolio ${completeness}% complete`}
</div>

{/* Milestone announcements */}
<div aria-live="polite" className="sr-only">
  {lastMilestone && MILESTONE_MESSAGES[lastMilestone]}
</div>

{/* Canvas updates */}
<div aria-live="polite" className="sr-only">
  {canvasUpdateMessage}
</div>
```

### Focus Management

```typescript
// After image upload
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  if (uploadComplete) {
    inputRef.current?.focus();
  }
}, [uploadComplete]);

// After quick reply
useEffect(() => {
  if (newAIMessage) {
    const messageEl = document.getElementById(`message-${newAIMessage.id}`);
    messageEl?.focus();
  }
}, [newAIMessage]);
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate between input, send, mic, attach |
| `Enter` | Send message (when input focused) |
| `Escape` | Close any open sheet/modal |
| `Space` | Start/stop recording (when mic focused) |
| `Arrow Left/Right` | Navigate photo filmstrip |
| `Arrow Up/Down` | Navigate quick replies |

### Touch Targets

Minimum 44x44px for all interactive elements:

```tsx
<button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Icon className="h-5 w-5" />
</button>
```

---

## Color & Typography

### Color Palette (OKLCH)

```css
:root {
  /* Primary - Teal */
  --primary: oklch(0.72 0.14 185);
  --primary-foreground: oklch(0.99 0 0);

  /* Secondary */
  --secondary: oklch(0.96 0.01 185);
  --secondary-foreground: oklch(0.2 0.02 185);

  /* Muted */
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.45 0 0);

  /* Accent */
  --accent: oklch(0.96 0.02 185);
  --accent-foreground: oklch(0.2 0.02 185);

  /* Image type indicators */
  --before-color: oklch(0.7 0.15 50);    /* Orange */
  --after-color: oklch(0.7 0.15 145);    /* Green */
  --progress-color: oklch(0.7 0.15 240); /* Blue */
  --detail-color: oklch(0.7 0.15 300);   /* Purple */
}
```

### Typography Scale

```css
/* Headings */
.text-canvas-title {
  font-size: 1.5rem;      /* 24px */
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* Body text */
.text-canvas-body {
  font-size: 0.875rem;    /* 14px */
  line-height: 1.6;
}

/* Chips/badges */
.text-chip {
  font-size: 0.75rem;     /* 12px */
  font-weight: 500;
}

/* Progress labels */
.text-progress {
  font-size: 0.75rem;     /* 12px */
  color: var(--muted-foreground);
}
```

---

## Tailwind Utilities

### Custom Utilities to Add

```css
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Snap scrolling for filmstrip */
.snap-x {
  scroll-snap-type: x mandatory;
}
.snap-start {
  scroll-snap-align: start;
}

/* Progress bar with CSS variable */
.progress-bar {
  width: var(--progress, 0%);
  transition: width 0.5s ease-out;
}

/* Touch pan for swipe gestures */
.touch-pan-y {
  touch-action: pan-y;
}
```

### Tailwind Config Extensions

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'canvas-item-in': 'canvas-item-in 0.4s ease-out forwards',
        'chip-slide-in': 'chip-slide-in 0.3s ease-out forwards',
        'toast-slide-up': 'toast-slide-up 3s ease-out forwards',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.3s ease-out forwards',
      },
      keyframes: {
        // ... (as defined above)
      },
    },
  },
};
```

---

## Related Documentation

- **SDK Reference**: `./vercel-ai-sdk-reference.md`
- **Artifacts Spec**: `./chat-artifacts-spec.md`
- **Implementation Roadmap**: `./implementation-roadmap.md`
