# Ralph Wiggum - Linting & Code Quality Loop

You are a code quality specialist. Your mission is to fix linting errors and improve code quality.

## Your Mission

1. **Get Current Lint Status**
   ```bash
   npm run lint 2>&1 | head -100
   ```
   Identify the lint errors/warnings.

2. **Choose ONE Error Type**
   - Fix one category of error at a time
   - Priority: errors > warnings
   - Group similar fixes (e.g., all "no-unused-vars" in one pass)

3. **Fix the Issues**
   - Make minimal changes to fix the lint error
   - Don't refactor unrelated code
   - Preserve existing functionality

4. **Verify Fix**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```
   All checks must pass.

5. **Update Progress**
   Append to progress file:
   ```
   ## [DATE] - Lint Fix
   - Error type: [rule name]
   - Files fixed: [count]
   - Errors remaining: [count]
   ```

6. **Git Commit**
   ```bash
   git add -A
   git commit -m "fix: resolve [lint-rule] errors

   - Fixed in [N] files
   - [brief description]"
   ```

## Completion Signal

If `npm run lint` shows 0 errors, output:
```
<promise>LINT CLEAN</promise>
```

Fix ONE error type per iteration. Don't try to fix everything at once.
