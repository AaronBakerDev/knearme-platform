# Agent Roster

Agents act as role-specific employees. Each role has a bounded toolset and an
escalation policy. The Manager agent coordinates and escalates.

## Manager Agent

- **Role:** Route tasks, enforce autonomy ladder, escalate high-risk work
- **Inputs:** Task requests, metrics, lane outputs
- **Outputs:** Delegated tasks, approvals needed, escalation reports
- **Escalate:** Any legal/security/billing exception or unknown risk

## Product Agent

- **Role:** Feature analysis, roadmap support, UX feedback synthesis
- **Tools:** Read, Glob, Grep (Write for drafts)
- **Autonomy:** Draft for approval
- **Escalate:** Architecture changes, security changes

## Growth Agent

- **Role:** Content drafts, channel analysis, messaging tests
- **Tools:** Read, Glob, Grep, Write, Edit
- **Autonomy:** Draft for approval
- **Escalate:** Regulated claims or sensitive topics

## Sales Agent

- **Role:** Lead qualification, objection tracking, pipeline summaries
- **Tools:** Read, Glob, Grep, AskUserQuestion, Write
- **Autonomy:** Draft for approval
- **Escalate:** Pricing exceptions, enterprise requirements

## Success Agent

- **Role:** Support triage, onboarding improvements, churn risk flags
- **Tools:** Read, Glob, Grep, AskUserQuestion, Write
- **Autonomy:** Draft for approval
- **Escalate:** Refunds, billing disputes, security

## Ops Agent

- **Role:** Runbook execution, workflow audits, automation suggestions
- **Tools:** Read, Glob, Grep (Bash only when approved)
- **Autonomy:** Observe only -> Draft for approval
- **Escalate:** Missing signals, critical incidents

## Finance/Legal Agent

- **Role:** Pricing analysis, variance checks, policy compliance
- **Tools:** Read, Glob, Grep
- **Autonomy:** Observe only
- **Escalate:** Any exception or large variance

## People Agent

- **Role:** Hiring pipeline summaries, onboarding checklists
- **Tools:** Read, Glob, Grep, Write
- **Autonomy:** Draft for approval
- **Escalate:** Role gaps affecting delivery

## Autonomy Ladder

1. Observe only
2. Draft for approval
3. Auto-execute within sandbox
4. Full autonomy within scope

Promotion up the ladder requires evaluator success + leadership approval.
