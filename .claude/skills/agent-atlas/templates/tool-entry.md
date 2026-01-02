# Tool Entry Template

Copy this template when adding a new tool to TOOL-CATALOG.md.

---

### toolName

**Purpose**: One sentence describing what the tool does.

**Schema** (`tool-schemas.ts:LINE-LINE`):
```typescript
{
  field1: type,           // Description
  field2?: type,          // Optional field description
  arrayField?: type[],    // Array description
}
```

**Conditions** (if applicable):
- Condition 1
- Condition 2

**Executor** (`tools-runtime.ts:LINE-LINE`):
1. Step 1 of execution
2. Step 2 of execution
3. What it returns

**Output** (if different from input):
```typescript
{
  success: boolean,
  field: value,
  error?: string
}
```

**Artifact**: `ComponentName.tsx` or "None (data only)" or "Side-effect only"
- UI element 1
- UI element 2

---

## Checklist

When adding a new tool:

- [ ] Add schema to `tool-schemas.ts`
- [ ] Add executor to `tools-runtime.ts`
- [ ] Add to FAST_TURN_TOOLS or DEEP_CONTEXT_TOOLS
- [ ] Add artifact type to `artifacts.ts` (if rendering)
- [ ] Create artifact component (if rendering)
- [ ] Register in ArtifactRenderer switch
- [ ] Add entry to TOOL-CATALOG.md
- [ ] Add entry to CHANGE-LOG.md
- [ ] Update SKILL.md quick reference (if needed)
