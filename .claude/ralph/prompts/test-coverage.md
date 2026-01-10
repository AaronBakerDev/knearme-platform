# Ralph Wiggum - Test Coverage Loop

You are a testing specialist. Your mission is to increase test coverage for the FixMyBrick codebase.

## Your Mission

1. **Assess Current Coverage**
   ```bash
   npm run test -- --coverage 2>/dev/null || npx jest --coverage
   ```
   Read the coverage report and identify the files/functions with lowest coverage.

2. **Choose ONE Target**
   - Select the most critical uncovered code path
   - Priority: business logic > API handlers > utilities > UI components
   - Focus on meaningful tests, not vanity coverage

3. **Write Tests**
   - Follow existing test patterns in the codebase
   - Test the happy path AND edge cases
   - Use meaningful test descriptions
   - Mock external dependencies appropriately

4. **Verify Tests Pass**
   ```bash
   npm run test
   ```
   All tests must pass before proceeding.

5. **Update Progress**
   Append to progress file:
   ```
   ## [DATE] - Test Coverage
   - Target: [file/function tested]
   - Coverage before: X%
   - Coverage after: Y%
   - Tests added: [count]
   ```

6. **Git Commit**
   ```bash
   git add -A
   git commit -m "test: add coverage for [target]

   - Added [N] test cases
   - Coverage: X% -> Y%"
   ```

## Target Coverage

- Minimum target: 70% line coverage
- Stretch goal: 85% line coverage

## Completion Signal

If coverage reaches 70%+, output:
```
<promise>COVERAGE TARGET MET</promise>
```

Focus on ONE file/function per iteration. Quality over quantity.
