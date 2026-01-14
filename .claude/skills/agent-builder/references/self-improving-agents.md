# Self-Improving Agents

A standalone guide for designing safe, evaluatable self-improvement loops for
agents. The core idea: **only promote changes that measurably outperform a
baseline on a fixed evaluator**.

---

## 1) When Self-Improvement Is Appropriate

Use a self-improving loop only when you can define **automatic evaluation**:

- You have measurable success criteria
- You can run evaluations repeatedly
- You can accept slower iteration (batch evaluation)

Avoid self-improving loops if:
- Quality cannot be scored reliably
- The evaluator is noisy or subjective
- The cost of evaluation is too high

---

## 2) The Safe Improvement Loop

```
Baseline (best-known prompt / workflow)
    ↓
Generate candidate change
    ↓
Evaluate on fixed test suite
    ↓
Compare to baseline
    ↓
Promote if improved (else discard)
    ↓
Log lineage + metrics
```

**Golden rule:** Promotion is based on evaluator scores, not intuition.

---

## 3) What Can Be Improved

Self-improvement can target different layers:

- **Prompt changes** (tone, structure, constraints)
- **Workflow changes** (steps, checks, escalation rules)
- **Tool scope changes** (add/remove tools)
- **Routing logic** (which subagent handles what)
- **Output formats** (structured JSON vs freeform)

**Do not** allow arbitrary self-edit of core infrastructure or security policy.

---

## 4) Evaluators (Your Safety Gate)

Types of evaluators:

1) **Regression suites**
   - Fixed test cases with expected outputs
2) **Heuristic scoring**
   - Rubrics for completeness/accuracy/format
3) **Risk triggers**
   - Hard fails on policy violations
4) **Human-in-the-loop**
   - Only for final promotion or critical roles

**Evaluator design tips:**
- Prefer pass/fail checks first, then numeric scoring
- Keep a stable benchmark set
- Include edge cases and adversarial inputs

---

## 5) Boundaries (EVOLVE Blocks)

If the agent modifies prompt/workflow, restrict it to safe zones:

```
# EVOLVE-BLOCK-START
# The agent may edit within this block
# EVOLVE-BLOCK-END
```

This keeps the core scaffolding (safety, escalation, role definition) intact.

---

## 6) Promotion & Rollback Policy

**Promotion rules:**
- Must exceed baseline on primary metric
- Must not regress secondary metrics beyond threshold
- Must not violate safety constraints

**Rollback rules:**
- If production metrics drop below threshold
- If escalation rate spikes
- If new failure modes appear

Use a **champion/challenger** approach:
- Champion = current best
- Challenger = candidate
- Promote only when challenger wins consistently

---

## 7) Autonomy Ladder Integration

Self-improvement is safest at lower autonomy levels:

- **Observe only:** improvement through analysis
- **Draft for approval:** propose changes, require human promotion
- **Auto-execute:** only after evaluator passes
- **Full autonomy:** only for low-risk domains

---

## 8) Example: Support Triage Improvement

**Baseline:** current triage prompt
**Evaluator:**
- Category accuracy
- Escalation precision
- Format compliance

**Loop:**
1) Generate candidate prompt change
2) Run fixed set of tickets
3) Score results
4) Promote only if accuracy improves AND escalation precision >= baseline

---

## 9) Example: Marketing Draft Improvement

**Baseline:** current draft workflow
**Evaluator:**
- CTA compliance
- Brand voice rubric
- Factual safety checks

**Loop:**
1) Generate candidate workflow
2) Run on fixed briefs
3) Evaluate against rubric
4) Promote if score improves with no policy violations

---

## 10) Implementation Checklist

- [ ] Define primary + secondary metrics
- [ ] Build a fixed evaluation suite
- [ ] Implement candidate generation
- [ ] Add promotion gate and rollback logic
- [ ] Log all trials + scores
- [ ] Review safety constraints before promotion

---

## 11) Where This Connects

- `background-agents.md` — autonomy + execution modes
- `improving-agents.md` — experiments and evals
- `tool-development.md` — least-privilege tooling
- `role-definition.md` — role prompts and escalation rules
