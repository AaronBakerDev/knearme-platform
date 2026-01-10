# Ralph Loop: Typeform Onboarding

## Task

Build a WOW onboarding experience for the Discovery Agent.

## Instructions

1. Read the full spec: `docs/specs/typeform-onboarding-spec.md`
2. Read the implementation guide: `docs/specs/typeform-onboarding-ralph-loop.md`
3. Check progress: `.claude/.ralph-progress.json` (create if missing)
4. Work on the first incomplete checkpoint
5. Run tests to verify
6. Update progress file when checkpoint passes
7. If ALL checkpoints complete, output the completion promise

## Progress File

Location: `.claude/.ralph-progress.json`

If missing, create:
```json
{
  "phase": 1,
  "checkpoints": {
    "phase1_tool_correctness_tests": false,
    "phase1_hallucination_fixed": false,
    "phase1_profile_saves": false,
    "phase2_review_extraction_tests": false,
    "phase2_reviews_in_state": false,
    "phase3_web_search_works": false,
    "phase4_bio_synthesis_quality": false,
    "phase5_reveal_artifact_built": false,
    "phase5_wow_confirmed": false,
    "phase6_project_suggestions_work": false,
    "phase7_e2e_passes": false,
    "phase7_manual_qa_approved": false
  },
  "lastIteration": "",
  "notes": ""
}
```

## Completion

When ALL checkpoints are true and the onboarding creates a genuine "wow" moment:

<promise>ONBOARDING WOW COMPLETE</promise>

## Quality Bar

Don't just make it work. Make it delightful:
- Agent reliably saves profiles (no hallucination)
- Bio reads like a human wrote it
- Reveal creates excitement
- No dead ends
- Tests pass
