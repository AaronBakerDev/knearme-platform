# Background Agents (Autonomous Role Execution)

This guide focuses on agents that run in the background (continuous or job-based)
and execute domain roles autonomously, with escalation to a higher-level agent or
human when needed.

---

## 1) Definitions

**Background agent:** An agent that runs without direct user interaction. It is
triggered by events or schedules, performs work, and reports outcomes.

**Autonomous role execution:** The agent acts like an employee with a role,
bounded authority, and an escalation policy.

---

## 2) Autonomy Ladder (Employee Model)

Use four levels of autonomy. Pick per-role, not per-agent.

1. **Observe only**
   - Read-only tools
   - Reports findings, no actions

2. **Draft for approval**
   - Can draft responses or change sets
   - Requires approval before execution

3. **Auto-execute in a sandbox**
   - Limited write + safe commands
   - Explicit allowlists + tight scope

4. **Full autonomy within scope**
   - All required tools for the role
   - Escalates only on defined triggers

**Escalation triggers (examples):**
- Legal, security, privacy, or compliance
- Money movement or pricing exceptions
- High-impact changes or production access
- Missing/ambiguous inputs

---

## 3) Execution Modes

### A) Job-Based (Event or Schedule)

Use for discrete tasks that finish quickly:
- cron scheduled runs
- queue or webhook events
- nightly or weekly checks

**Patterns:**
- Non-interactive agent runs (headless CLI)
- Idempotent actions (safe to retry)
- Output to structured JSON for pipelines

### B) Continuous (Always-On)

Use for roles that need persistent context or live routing:
- triage inboxes
- monitor systems
- coordinate multiple subagents

**Patterns:**
- Long-running service (MCP server or SDK thread)
- State stored externally (DB/queue)
- Heartbeats + watchdog restarts

---

## 4) Orchestration Patterns

### Single Agent
Best for a narrow role with one knowledge base.

### Orchestrator + Specialists
Best for multi-domain roles (support, ops, sales).

**Design rules:**
- Orchestrator owns routing + escalation
- Specialists are tool-limited and goal-focused
- Each specialist returns structured output

---

## 5) Tooling Choices (Claude + Codex)

### Claude Code SDK (Headless)
Use for background roles that need Claude-specific tools and local files:
- headless CLI runs for job-based tasks
- subagents for domain specialization
- permission modes map to autonomy ladder

### Codex CLI / SDK
Use for engineering-heavy tasks or multi-agent workflows:
- non-interactive `exec` for CI-style runs
- MCP server mode for long-running orchestration
- Codex SDK threads for persistent tasks

---

## 6) Escalation Design

Define explicit escalation rules per role:

**Support:** refunds, security, legal threats, high-value accounts  
**Sales:** enterprise legal, pricing exceptions, procurement  
**Ops:** missing telemetry, critical thresholds, unknown errors  
**Finance:** large variances, policy violations, missing data  
**Marketing:** regulated claims, sensitive topics

**Escalation path:**
1) Notify manager agent with context  
2) Notify human or higher-tier agent  
3) Log the decision and pause execution

---

## 7) Observability & Safety

**Minimum telemetry:**
- success/failure rate
- latency
- tool usage counts
- cost per task
- escalation rate

**Safety controls:**
- least-privilege tools
- approvals on high-risk actions
- sandboxed execution for commands
- regression tests for role outputs

---

## 8) Self-Improvement Loop (AlphaEvolve-Inspired)

Only use self-improvement when you have a reliable, automated evaluator.

**Pattern:**
1) Propose change (prompt/workflow/toolset)
2) Evaluate on fixed suite
3) Score + compare to baseline
4) Promote only if improved

This makes autonomy safer: improvements are gated by metrics, not intuition.

---

## 9) Recommended Baseline Architecture

**Manager Agent**
- Receives events and schedules
- Routes work to specialists
- Enforces autonomy ladder
- Handles escalations

**Specialist Agents**
- Focused prompts + tools
- Structured outputs
- Clear boundaries

**Execution Substrate**
- Job queue + cron
- Storage for state + outputs
- Notification system (Slack/email)

---

## 10) Implementation Checklist

- [ ] Define role outcomes and escalation triggers
- [ ] Choose autonomy level per role
- [ ] Select tools with least privilege
- [ ] Decide job-based vs continuous execution
- [ ] Add structured outputs and logs
- [ ] Add regression tests + evals

---

## 11) Where This Connects

- Use `agent-design-guide.md` to validate the use case
- Use `role-definition.md` for prompts and roles
- Use `tool-development.md` for tool safety
- Use `performance-monitoring.md` + `improving-agents.md` for iteration
