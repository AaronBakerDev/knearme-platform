# AI SDK Phase 5 — Polish

> Goal: Add delight and accessibility polish.
> Source of truth: `docs/ai-sdk/implementation-roadmap.md`

## UX Enhancements
- [x] Add `ProgressTracker` artifact
- [x] Add `MilestoneToast` celebrations
- [x] Add `SmartSuggestionPill` hints
- [x] Implement animation utilities

## Accessibility + Mobile
- [x] ARIA live regions for streaming updates
- [x] Keyboard navigation + focus management
- [x] Gesture alternatives for swipe/long-press
- [x] Touch target audit (44px min)

## Deliverables
- [x] WCAG 2.1 AA baseline
- [x] Mobile UX polished and performant

## References
- `docs/ai-sdk/implementation-roadmap.md`
- `docs/ai-sdk/chat-ux-patterns.md`
- `docs/ai-sdk/observability-spec.md`

---

## Handoff from Phase 5

### What Was Built

**New Components:**
| Component | Purpose | Location |
|-----------|---------|----------|
| `ProgressTracker` | In-chat progress artifact with animated ring | `src/components/chat/artifacts/ProgressTracker.tsx` |
| `MilestoneToast` | Celebratory toast for progress milestones | `src/components/chat/MilestoneToast.tsx` |
| `SmartSuggestionPill` | Contextual suggestion hints above input | `src/components/chat/SmartSuggestionPill.tsx` |
| `useKeyboardNavigation` | Keyboard shortcuts and focus management | `src/components/chat/hooks/useKeyboardNavigation.ts` |

**New Hooks:**
- `useMilestoneToasts()` — Manages milestone deduplication and display timing
- `useSmartSuggestion()` — Generates contextual suggestions based on completeness
- `useKeyboardNavigation()` — Global keyboard shortcuts (Escape, Arrow Up to edit)
- `useFocusTrap()` — Modal focus trap utility

**Accessibility Improvements:**
- `ChatMessages.tsx` — Added `role="log"`, `aria-live`, `aria-atomic` for streaming
- `ChatMessage` containers — Added `role="article"` with descriptive `aria-label`
- `LivePortfolioCanvas.tsx` — ARIA live region for progress updates (already existed)

**Touch Target Fixes (44px minimum):**
- `ChatInput.tsx` — Mic, send, attach buttons enlarged to `h-11 w-11`
- `PreviewOverlay.tsx` — Close button enlarged to `h-11 w-11`
- `ChatPhotoPanel.tsx` — Collapse button enlarged to `h-11 w-11`

### Pre-existing Dependencies (Leveraged, Not Built)

These features existed before Phase 5 and were leveraged for polish:

**Animation Infrastructure (globals.css):**
- `animate-canvas-item-in` — Artifact entrance
- `animate-chip-slide-in` — Material/technique chips
- `animate-toast-slide-up` — Milestone toasts
- `animate-glow-pulse` — Ready state glow
- `prefers-reduced-motion` — Respects user preference

**Gesture Alternatives:**
- `CollectedDataPeekBar` — Tap button to expand (vs swipe-up)
- `PreviewPill` — Tap button to open preview (vs swipe-up)
- `PreviewOverlay` — X button to close (vs swipe-down)

### Key Files to Reference

```
src/components/chat/
├── artifacts/
│   ├── ProgressTracker.tsx      # New progress artifact
│   └── ArtifactRenderer.tsx     # Updated with ProgressTracker
├── hooks/
│   ├── index.ts                 # Barrel export (includes all hooks)
│   └── useKeyboardNavigation.ts # Keyboard shortcuts + useFocusTrap utility
├── MilestoneToast.tsx           # New milestone component + hook
├── SmartSuggestionPill.tsx      # New suggestion component + hook
├── ChatMessages.tsx             # ARIA live regions added
├── ChatInput.tsx                # Touch targets fixed
├── CollectedDataPeekBar.tsx     # Gesture alternative (tap)
├── PreviewPill.tsx              # Gesture alternative (tap)
└── PreviewOverlay.tsx           # Touch targets fixed

src/types/artifacts.ts           # Added ProgressTrackerData type
```

### Patterns to Follow

1. **Adding milestone celebrations:** Use `useMilestoneToasts()` hook, trigger via `triggerMilestone('typeDetected')`, render `MilestoneToast` component
2. **Adding suggestions:** Use `useSmartSuggestion()` hook with completeness context, render `SmartSuggestionPill`, handle `onTap` actions
3. **Keyboard shortcuts:** Use `useKeyboardNavigation()` with `onEscape` and custom `shortcuts` array
4. **Focus management:** Use `useFocusTrap()` for modals, `saveFocus()`/`restoreFocus()` for dialogs

### WCAG 2.1 AA Baseline Checks (Dec 2025)

> **Scope:** Chat wizard components only. Verified via manual code inspection.
> **Formal audit:** Pending (axe DevTools / Lighthouse recommended before launch).

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 2.1.1 Keyboard | ✅ | All interactive elements keyboard accessible |
| 2.4.7 Focus Visible | ✅ | Tailwind focus-visible ring styles |
| 4.1.2 Name, Role, Value | ✅ | aria-label on all buttons |
| 4.1.3 Status Messages | ✅ | aria-live regions for streaming |
| 2.5.5 Target Size | ✅ | All touch targets ≥44px (h-11 w-11) |
| 2.3.3 Animation | ✅ | prefers-reduced-motion support |

### Integration Examples

> **Note:** These are simplified pseudocode examples. Adapt to your state management.

**Using MilestoneToast in ChatWizard:**
```typescript
// Barrel import from hooks (preferred)
import { MilestoneToast, useMilestoneToasts } from '@/components/chat/hooks';
// Or direct import:
// import { MilestoneToast, useMilestoneToasts } from './MilestoneToast';

function ChatWizard() {
  const { currentMilestone, triggerMilestone, dismissMilestone } = useMilestoneToasts();

  // Track previous image count for transition detection
  const prevImageCountRef = useRef(0);

  // Trigger when photo count goes from 0 to 1
  useEffect(() => {
    if (images.length === 1 && prevImageCountRef.current === 0) {
      triggerMilestone('firstPhoto');
    }
    prevImageCountRef.current = images.length;
  }, [images.length, triggerMilestone]);

  return (
    <>
      {/* ... chat UI ... */}
      <MilestoneToast milestone={currentMilestone} onDismiss={dismissMilestone} />
    </>
  );
}
```

**Using SmartSuggestionPill:**
```typescript
// Barrel import includes the Suggestion type
import {
  SmartSuggestionPill,
  useSmartSuggestion,
  type Suggestion
} from '@/components/chat/hooks';

function ChatWizard() {
  const suggestion = useSmartSuggestion({
    completeness,
    imageCount: images.length,
    phase: 'conversation',
  });

  const handleSuggestionTap = (s: Suggestion) => {
    if (s.action === 'addPhotos') openPhotoSheet();
    else if (s.action === 'generate') triggerGenerate();
    else setInputValue(s.text);
  };

  return (
    <>
      <SmartSuggestionPill suggestion={suggestion} onTap={handleSuggestionTap} />
      <ChatInput ... />
    </>
  );
}
```

### Ready for Phase 6

Phase 6 (Unified Edit Mode) can now:
- Build on polished, accessible chat components
- Use milestone toasts for edit mode transitions
- Leverage keyboard navigation for edit shortcuts
- Maintain WCAG compliance in new edit UI

---

## Review Feedback (Dec 26, 2025)

### Findings
1. **High** — WCAG checklist claims AA compliance without audit scope/tools/date. This is a compliance risk. Suggest rewording to “baseline checks” and add evidence (axe/Lighthouse + scope). (See: “WCAG 2.1 AA Compliance Checklist”)
2. **Medium** — Hooks location ambiguity: `useMilestoneToasts` and `useSmartSuggestion` live in `src/components/chat/MilestoneToast.tsx` and `src/components/chat/SmartSuggestionPill.tsx`, not the `hooks/` barrel. Call out import paths or re-export to avoid confusion. (See: “New Hooks”, “Key Files to Reference”)
3. **Medium** — “Animation Infrastructure” and “Gesture Alternatives” are flagged as “already existed” but listed under Phase 5 handoff. Consider moving to a “Pre-existing dependencies” sub-section to avoid attributing work to this phase. (See: “Animation Infrastructure”, “Gesture Alternatives”)
4. **Low** — Integration snippets are not copy-pasteable: `prevImageCount` state and `Suggestion` type import are missing. Mark as pseudocode or add minimal setup. (See: “Integration Examples”)
5. **Low** — `useFocusTrap` is mentioned in Patterns but not in the key files list (it’s co-located in `src/components/chat/hooks/useKeyboardNavigation.ts`). Add a note to reduce lookup time. (See: “Patterns to Follow”, “Key Files to Reference”)

### Questions / Follow-ups (Resolved Dec 26, 2025)
- ✅ **Re-exports:** Added to `src/components/chat/hooks/index.ts` for consistency with other hooks.
- ✅ **Touch target audit:** Verified via code inspection (h-11 w-11 = 44px fixed). Note added to WCAG section recommending formal device testing.
