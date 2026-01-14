# Design System

> **Version:** 1.0
> **Last Updated:** December 8, 2025
> **Approach:** Adopt existing KnearMe design + extend for AI interview flows
> **Component Library:** shadcn/ui + Tailwind CSS

---

## Design Philosophy

**"Celebrate the craft, minimize the friction."**

Contractors create beautiful work—our job is to showcase it with minimal effort on their part. The UI should:
- Feel fast and responsive (especially voice recording)
- Work perfectly on mobile (primary use case)
- Make AI feel like a helpful assistant, not a robot
- Let the photos be the hero

---

## Color System

### Dark Mode (Primary)

```css
/* HSL values for Tailwind config */
--background: 15 8% 12%;        /* Deep charcoal */
--foreground: 0 0% 98%;         /* Near white text */

--card: 15 8% 16%;              /* Elevated surface */
--card-foreground: 0 0% 98%;

--primary: 210 85% 58%;         /* Vibrant blue - trust */
--primary-foreground: 0 0% 100%;

--accent: 35 90% 62%;           /* Warm orange - energy */
--accent-foreground: 0 0% 0%;

--muted: 15 8% 25%;
--muted-foreground: 0 0% 70%;

--destructive: 0 84% 60%;
--success: 142 76% 36%;

--border: 15 8% 25%;
--ring: 210 85% 58%;
```

### Light Mode

```css
--background: 0 0% 98%;
--foreground: 15 8% 12%;

--card: 0 0% 100%;
--primary: 210 85% 48%;
--accent: 35 90% 55%;
```

### Semantic Colors

| Purpose | Color | Use Case |
|---------|-------|----------|
| **Primary** | Blue | CTAs, links, active states |
| **Accent** | Orange | Highlights, badges, progress |
| **Success** | Green | Published, approved, complete |
| **Destructive** | Red | Delete, errors |
| **Muted** | Gray | Secondary text, borders |

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-display: 'Outfit', 'Inter', sans-serif;
```

### Type Scale

| Name | Size | Weight | Use Case |
|------|------|--------|----------|
| `text-4xl` | 36px | Bold | Page titles |
| `text-2xl` | 24px | Semibold | Section headers |
| `text-xl` | 20px | Semibold | Card titles |
| `text-lg` | 18px | Normal | Body large |
| `text-base` | 16px | Normal | Body (default) |
| `text-sm` | 14px | Normal | Secondary text |
| `text-xs` | 12px | Medium | Captions, badges |

### Typography Rules

- **Headlines:** Font-display (Outfit), tight tracking
- **Body:** Font-sans (Inter), normal tracking
- **Mobile:** Minimum 16px for inputs (prevents iOS zoom)

---

## Layout System

### Container

```tsx
<div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
```

### Spacing Scale

```
4   = 1rem   (16px)  - Tight spacing
6   = 1.5rem (24px)  - Default component padding
8   = 2rem   (32px)  - Section spacing
12  = 3rem   (48px)  - Large section gaps
16  = 4rem   (64px)  - Page section spacing
```

### Breakpoints

| Name | Width | Target |
|------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

### Mobile-First Principle

All components designed for 375px width first, then scale up.

---

## Core Components

### 1. Button Variants

```tsx
// Primary CTA
<Button className="bg-primary text-white hover:bg-primary/90 rounded-lg px-6 py-3 font-semibold">
  Approve & Publish
</Button>

// Secondary
<Button variant="outline" className="rounded-lg px-6 py-3">
  Edit
</Button>

// Ghost (on images)
<Button variant="ghost" className="backdrop-blur-sm bg-white/10">
  Skip
</Button>

// Destructive
<Button variant="destructive">
  Delete
</Button>
```

### 2. Card Components

```tsx
// Project Card (Masonry)
<div className="rounded-xl overflow-hidden hover:scale-105 transition-transform hover:shadow-2xl">
  <div className="relative">
    <img className="w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    <div className="absolute bottom-4 left-4 text-white">
      <p className="text-sm opacity-80">Heritage Masonry</p>
      <h3 className="font-semibold">Chimney Rebuild</h3>
    </div>
  </div>
</div>

// Content Card
<Card className="rounded-xl p-6 bg-card">
  <CardHeader />
  <CardContent />
</Card>
```

### 3. Form Inputs

```tsx
// Text Input
<Input
  className="rounded-lg border-2 focus:ring-2 focus:ring-primary h-12"
  placeholder="Business name"
/>

// Textarea
<Textarea
  className="rounded-lg border-2 focus:ring-2 focus:ring-primary min-h-[120px]"
/>

// Select
<Select>
  <SelectTrigger className="rounded-lg h-12">
    <SelectValue placeholder="Select service" />
  </SelectTrigger>
</Select>
```

---

## New MVP Patterns

### 4. Voice Recording Button

The centerpiece of the AI interview - must feel tactile and responsive.

```tsx
// Voice Recording Button
<button
  className={cn(
    "w-24 h-24 rounded-full flex items-center justify-center",
    "bg-primary text-white shadow-lg",
    "active:scale-95 transition-transform",
    "touch-none select-none", // Prevent text selection on hold
    isRecording && "bg-destructive animate-pulse"
  )}
  onTouchStart={startRecording}
  onTouchEnd={stopRecording}
  onMouseDown={startRecording}
  onMouseUp={stopRecording}
>
  <Mic className="w-10 h-10" />
</button>

// Recording State Indicator
<div className="text-center mt-4">
  {isRecording ? (
    <p className="text-destructive font-medium animate-pulse">
      Recording... Release to stop
    </p>
  ) : (
    <p className="text-muted-foreground">
      Hold to speak
    </p>
  )}
</div>

// Waveform Visualization (optional)
<div className="h-12 flex items-center gap-1">
  {waveformBars.map((height, i) => (
    <div
      key={i}
      className="w-1 bg-primary rounded-full transition-all"
      style={{ height: `${height}%` }}
    />
  ))}
</div>
```

### 5. AI Interview Question Card

```tsx
<Card className="rounded-2xl p-6 bg-card border-2 border-border">
  {/* Progress */}
  <div className="flex items-center gap-2 mb-6">
    <span className="text-sm text-muted-foreground">Question 2 of 4</span>
    <Progress value={50} className="flex-1 h-1" />
  </div>

  {/* Question */}
  <h2 className="text-xl font-semibold mb-6">
    "How did you fix it?"
  </h2>

  {/* Voice Recording */}
  <div className="flex flex-col items-center py-8">
    <VoiceRecordButton />
  </div>

  {/* Quick Options */}
  <div className="flex flex-wrap gap-2 mb-6">
    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white">
      Full rebuild
    </Badge>
    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white">
      Tuckpointing
    </Badge>
  </div>

  {/* Fallback */}
  <Button variant="ghost" className="w-full">
    Type instead
  </Button>
</Card>
```

### 6. Photo Upload Grid

```tsx
<div className="grid grid-cols-3 gap-2">
  {/* Uploaded Images */}
  {images.map((img, i) => (
    <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
      <img src={img.url} className="w-full h-full object-cover" />
      <button className="absolute top-2 right-2 p-1 rounded-full bg-black/50">
        <X className="w-4 h-4 text-white" />
      </button>
      <Badge className="absolute bottom-2 left-2 text-xs">
        {img.type || 'Photo ' + (i + 1)}
      </Badge>
    </div>
  ))}

  {/* Add More Button */}
  {images.length < 10 && (
    <button className="aspect-square rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors">
      <Plus className="w-6 h-6 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Add</span>
    </button>
  )}
</div>
```

### 7. AI Detection Confirmation

```tsx
<Card className="rounded-2xl p-6 bg-card">
  <p className="text-muted-foreground mb-4">Based on your photos, this looks like:</p>

  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 mb-6">
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
      🧱
    </div>
    <div>
      <h3 className="font-semibold text-lg">Chimney Rebuild</h3>
      <p className="text-sm text-muted-foreground">
        Materials: Red brick, Portland mortar
      </p>
    </div>
    <Badge className="ml-auto">92% confident</Badge>
  </div>

  <p className="text-center mb-4">Is this correct?</p>

  <div className="flex gap-3">
    <Button className="flex-1" onClick={confirm}>
      Yes, that's right
    </Button>
    <Button variant="outline" className="flex-1" onClick={edit}>
      No, let me edit
    </Button>
  </div>
</Card>
```

### 8. Guided Editor

```tsx
<div className="space-y-6">
  {/* Editable Title */}
  <div className="relative group">
    <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
      Title
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Label>
    <Input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      className="text-xl font-semibold border-transparent hover:border-border focus:border-primary"
    />
  </div>

  {/* Editable Description */}
  <div className="relative group">
    <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
      Description
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Label>
    <Textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      className="min-h-[200px] border-transparent hover:border-border focus:border-primary"
    />
    <p className="text-xs text-muted-foreground mt-1">
      {description.length} / 600 characters
    </p>
  </div>

  {/* Editable Tags */}
  <div>
    <Label className="text-sm text-muted-foreground mb-2">Tags</Label>
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="pr-1">
          {tag}
          <button onClick={() => removeTag(tag)} className="ml-1">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <Input
        placeholder="Add tag..."
        className="w-24 h-6 text-sm"
        onKeyDown={addTag}
      />
    </div>
  </div>
</div>
```

### 9. AI Processing State

```tsx
<div className="flex flex-col items-center justify-center py-12">
  <div className="relative">
    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary" />
  </div>

  <p className="mt-6 font-medium">Creating your project showcase...</p>
  <p className="text-sm text-muted-foreground mt-2">
    This usually takes 5-10 seconds
  </p>

  {/* Progress steps */}
  <div className="mt-8 space-y-2 text-sm">
    <div className="flex items-center gap-2 text-success">
      <Check className="w-4 h-4" /> Photos analyzed
    </div>
    <div className="flex items-center gap-2 text-success">
      <Check className="w-4 h-4" /> Responses transcribed
    </div>
    <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
      <Loader2 className="w-4 h-4 animate-spin" /> Generating description...
    </div>
  </div>
</div>
```

### 10. Published Success State

```tsx
<div className="text-center py-12">
  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
    <Check className="w-10 h-10 text-success" />
  </div>

  <h2 className="text-2xl font-bold mb-2">Project Published!</h2>
  <p className="text-muted-foreground mb-6">
    Your project is now live at:
  </p>

  <div className="bg-muted rounded-lg p-3 mb-6">
    <code className="text-sm break-all">
      knearme.com/denver-co/masonry/chimney-rebuild/historic-brick...
    </code>
  </div>

  <div className="flex gap-3 justify-center">
    <Button onClick={viewProject}>
      View Project
    </Button>
    <Button variant="outline" onClick={addAnother}>
      Add Another
    </Button>
  </div>
</div>
```

---

## Mobile-Specific Guidelines

### Touch Targets

- Minimum 44x44px for all interactive elements
- Voice recording button: 96x96px (easy to tap with thumb)
- Card tap areas extend beyond visible bounds

### Thumb Zone Optimization

```
┌─────────────────────┐
│   Hard to reach     │  <- Navigation, non-critical
│                     │
│                     │
│   Natural reach     │  <- Content, scrolling
│                     │
│                     │
│   Easy (thumb zone) │  <- Primary actions, voice button
└─────────────────────┘
```

### Bottom Sheet Pattern

For modals and editors on mobile, use bottom sheets:

```tsx
<Sheet>
  <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh]">
    <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-6" />
    {/* Content */}
  </SheetContent>
</Sheet>
```

---

## Loading & Empty States

### Skeleton Loading

```tsx
// Project Card Skeleton
<div className="rounded-xl overflow-hidden">
  <Skeleton className="aspect-[4/3] w-full" />
  <div className="p-4">
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-3 w-1/2" />
  </div>
</div>
```

### Empty State

```tsx
<div className="text-center py-16">
  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
    <Camera className="w-8 h-8 text-muted-foreground" />
  </div>
  <h3 className="font-semibold mb-2">No projects yet</h3>
  <p className="text-muted-foreground mb-6">
    Add your first project to start building your portfolio
  </p>
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    Add Project
  </Button>
</div>
```

---

## Animation Guidelines

### Principles

1. **Fast** - Max 200ms for micro-interactions
2. **Purposeful** - Only animate to communicate state changes
3. **Subtle** - No gratuitous motion

### Standard Transitions

```css
/* Button press */
.btn:active { transform: scale(0.95); }

/* Card hover */
.card:hover { transform: scale(1.02); box-shadow: ...; }

/* Fade in */
.fade-in { animation: fadeIn 150ms ease-out; }

/* Slide up (bottom sheets) */
.slide-up { animation: slideUp 200ms ease-out; }
```

### Disabled Animations

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## Accessibility Checklist

- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] All images have alt text
- [ ] Form inputs have visible labels
- [ ] Focus states are visible
- [ ] Touch targets are 44px minimum
- [ ] Voice recording has visual feedback
- [ ] Error messages are announced to screen readers
- [ ] No content depends solely on color

---

## Implementation with shadcn/ui

### Required Components

```bash
npx shadcn-ui@latest add button card input textarea badge progress sheet dialog toast skeleton
```

### Tailwind Config Extensions

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        // Use CSS variables from above
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
      },
    },
  },
};
```

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/)
- Original KnearMe design guidelines: `/directory-platforms/supabase/design_guidelines.md`
