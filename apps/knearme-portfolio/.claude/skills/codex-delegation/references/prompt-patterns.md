# Codex Prompt Patterns

## The SWFV Framework

Every good Codex prompt has four parts:

### S - Scope (WHAT to do)
```
Fix all TypeScript type errors in the chat module
```

### W - Where (FILES to modify)
```
Files:
- src/components/chat/*.tsx
- src/lib/chat/*.ts
```

### F - Format (HOW to do it)
```
For each error:
1. Identify the root cause
2. Add proper types (avoid 'any' where possible)
3. Preserve existing functionality
```

### V - Verify (How to CHECK success)
```
After all fixes:
- Run: npx tsc --noEmit
- Run: npm run lint
- Ensure zero errors
```

---

## Pattern: Bug Sweep

```
Fix the following bugs identified in code review:

1. [SEVERITY] - [file:line] - [description]
   - Current behavior: [what happens now]
   - Expected behavior: [what should happen]
   - Suggested fix: [how to fix]

2. [next bug...]

Requirements:
- Maintain existing functionality
- Add comments explaining non-obvious fixes
- Run lint after each file

Verification:
npm run lint && npm run test
```

---

## Pattern: Refactoring

```
Refactor [pattern/API] across the codebase:

Current Pattern:
```[language]
[code example of old pattern]
```

New Pattern:
```[language]
[code example of new pattern]
```

Scope: [directory or file pattern]

Constraints:
- Maintain backwards compatibility
- Update all imports
- Preserve existing tests

Verification:
npm run test
```

---

## Pattern: Test Generation

```
Generate unit tests for [file or module]:

Test Framework: [vitest/jest]
Location: [where to put tests]

Requirements:
- Test all exported functions
- Include happy path and edge cases
- Mock external dependencies
- Aim for [X]% coverage

Reference existing tests:
- [path to example test file]

Verification:
npm run test -- [test file pattern]
```

---

## Pattern: Migration

```
Migrate from [old] to [new]:

Files affected: [glob pattern]

Changes required:
1. [specific change 1]
2. [specific change 2]
3. [specific change 3]

Example transformation:

Before:
```[language]
[old code]
```

After:
```[language]
[new code]
```

Do NOT modify:
- [files to exclude]
- [patterns to ignore]

Verification:
npm run build && npm run test
```

---

## Pattern: Code Audit

```
Audit [scope] for [issue type]:

Check for:
1. [specific issue 1]
2. [specific issue 2]
3. [specific issue 3]

For each issue found:
1. Log the file and line number
2. Describe the issue
3. Apply the fix
4. Add a comment if the fix is non-obvious

Output a summary at the end with:
- Total issues found
- Issues by category
- Files modified

Verification:
npm run lint
```

---

## Anti-Patterns (Avoid These)

### Too Vague
```
Make the code better
```

### No Verification
```
Fix the bugs
[no lint/test command]
```

### Too Broad
```
Refactor the entire codebase to use better patterns
```

### Missing Context
```
Update the API calls
[which API? what changes?]
```

### Conflicting Instructions
```
Update all files but don't change anything important
```
