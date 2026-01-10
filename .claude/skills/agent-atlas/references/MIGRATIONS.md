# Philosophy Migration History

> Completed migrations from over-engineered patterns to agentic architecture.

All philosophy alignment phases are **complete**. This file documents what was changed for reference.

---

## Summary

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Masonry Language Removal | ✅ Complete |
| Phase 2 | Relax Constraints | ✅ Complete |
| Phase 3 | Dynamic Service Types | ✅ Complete |
| Phase 4 | UI Flexibility | ✅ Complete |

---

## Key Changes

### Phase 4: UI Flexibility (2026-01-02)

**Hooks now follow "AI decides, we provide guardrails":**

- `useCompleteness.ts` - Tracks core guardrails (photos, type, location) + content richness, not a 9-field checklist
- `useProjectData.ts` - Image priority trusts agent's categorization, uses generic categories

### Phase 3: Dynamic Service Types (2026-01-02)

**Service types emerge from business, not hardcoded:**

- Created `service_types` database table (no seed data)
- Added query functions: `getServiceTypes()`, `getServiceTypeSlugs()`, `getServiceTypeBySlug()`
- Orchestrator phase parameter now optional - derives from state
- Page components use database queries, not `NATIONAL_SERVICE_TYPES` constant

### Phase 2: Relax Constraints (2026-01-02)

**Verified already implemented:**

- `checkReadyForImages()` returns `true` (no gating)
- `ready_for_images` schema marked deprecated
- Enums use flexible strings, not fixed options
- Prompts use principles, not procedures

### Phase 1: Masonry Language Removal (2026-01-02)

**Generic examples replace masonry-specific:**

- Agent prompts use "kitchen remodel", "deck build" instead of "chimney rebuild"
- `GENERIC_CONFIG` is the default trade config
- Masonry references only remain in intentional SEO pages

---

## Design Principles Applied

1. **AI decides, we provide guardrails** - No field checklists, no magic thresholds
2. **Structure emerges** - Service types from database, not constants
3. **Trust the model** - Agent categorizes images, decides what matters
4. **Universal by default** - Works for any business type

---

## References

| Document | Purpose |
|----------|---------|
| `references/PHILOSOPHY.md` | Core design principles |
| `docs/philosophy/over-engineering-audit.md` | Original issues identified |
| `docs/philosophy/implementation-roadmap.md` | Original migration plan |
