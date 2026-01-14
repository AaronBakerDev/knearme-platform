# Pricing Plan Research (Draft)

> Status: Draft
> Date: December 31, 2025
> Owner: Product + Engineering

This doc summarizes comparable pricing for contractor-focused tools and
evaluates the risk of a $29/mo unlimited-project plan for KnearMe.

---

## Market Reference Points (Public Pricing)

Core workflow tools (contractor ops):
- Jobber Core: $29/mo billed annually ($39/mo monthly), 1 user. citeturn2search1
- Jobber Marketing Suite add-on: $79/mo; Reviews $39/mo; Campaigns $29/mo; Referrals $29/mo. citeturn0search3turn2search7
- Houzz Pro: $249/mo after a 30-day free trial; additional users $60/mo. citeturn0search4

Project documentation / portfolio adjacents:
- CompanyCam Pro: $79/mo (includes 3 users), +$29 per additional user; unlimited projects. citeturn0search0
- CompanyCam Premium: $129/mo (includes 3 users), +$29 per additional user. citeturn0search0

Reputation/review automation:
- NiceJob Reviews: $75/mo; NiceJob Pro: $125/mo. citeturn4search3
- Podium (home services): custom quote, no public monthly price listed. citeturn4search1

Lead marketplaces (pay-per-lead model, no subscription):
- Thumbtack: no subscription fees; lead prices are set by pros. citeturn1search0
- Angi: lead pricing varies by task/location and is managed via a monthly budget. citeturn3search4

---

## Positioning Implications

- $29/mo is below most contractor SaaS tools with measurable ROI claims.
- If KnearMe is framed as a "win more jobs" engine (portfolio proof + marketing),
  the closest benchmarks are CompanyCam (from $79/mo) and NiceJob ($75/mo).
- If KnearMe is framed as a lightweight marketing companion rather than full CRM,
  a lower price can be justified, but AI usage must be controlled.

---

## AI Voice Cost Exposure (Baseline Model)

Key Gemini audio assumptions:
- Audio tokenization: 32 tokens per second (1,920 tokens per minute). citeturn5search6turn5search7
- Live API audio pricing (Gemini 2.5 Flash Native Audio):
  - Input: $3.00 / 1M audio tokens
  - Output: $12.00 / 1M audio tokens citeturn5search5

Per-minute costs (Live API):
- Input per minute: 1,920 / 1,000,000 * $3.00 = $0.00576
- Output per minute: 1,920 / 1,000,000 * $12.00 = $0.02304

Example 10-minute interview (typical):
- User speaking 5 minutes, agent speaking 3 minutes
- Input cost: 5 * $0.00576 = $0.0288
- Output cost: 3 * $0.02304 = $0.0691
- Total: ~$0.10 per interview (plus negligible text tokens)

Worst-case (continuous audio streaming for 10 minutes):
- Input only (silence or speech): ~10 * $0.00576 = $0.0576

Takeaway:
- The risk is not typical use; the risk is runaway audio streaming or
  abusive volume. Safeguards must prevent silent streaming and idle sessions.

---

## Live Voice Safeguards (Cost Control)

These align with `docs/09-agent/voice-modes-implementation.md`:
- Push-to-talk default for Voice -> Voice.
- Voice activity gating + silence cutoff (1-2 seconds).
- Idle timeout (20-30 seconds) + visibility guard (tab background).
- Session cap + reconnect flow (Live API audio-only sessions are limited). citeturn5search1turn5search3
- Auto-fallback to Voice -> Text if Live API disconnects.
- Never stream PCM silence frames.

---

## Pricing Risk Assessment for $29/mo Unlimited Projects

Where it is safe:
- Average contractor usage (a few interviews per month).
- Voice -> Text default with occasional Voice -> Voice.
- Strong safeguards to stop idle streaming.

Where it is risky:
- Power users running high-volume interviews.
- Users leaving voice sessions open.
- Abuse (automated or non-human input).

---

## Guardrail Options (Keep $29/mo but reduce exposure)

Option A: "Fair Use" voice cap (recommended)
- Keep $29/mo unlimited projects.
- Include Voice -> Voice up to X minutes per month.
- After cap, auto-switch to Voice -> Text (still functional).

Option B: Tiered voice access
- $29/mo: Text -> Text + Voice -> Text
- $49-$79/mo: Voice -> Voice included (higher caps)

Option C: Per-minute add-on
- $29/mo base
- Additional voice minutes as a usage add-on

---

## Free Plan Strategy (Option C)

Suggested free plan for a portfolio-first product:
- Publish up to 5 projects total (keep them live forever).
- Unlimited edits on published projects.
- Voice -> Text allowed with modest fair-use limits (30 minutes/month).
- Voice -> Voice reserved for Pro (or capped).

Rationale:
- 3-5 projects is enough to look legitimate and show range.
- A total cap (not monthly) matches how portfolios are used.
- Keeps the free plan credible while still encouraging upgrades.

---

## Recommendation (Draft)

If the goal is a "magic" voice-first experience, keep $29/mo as the entry point,
with unlimited projects and voice included under fair use. Use a free plan that
includes up to 5 published projects total, and auto-switch voice modes when
limits are reached. This keeps the core promise while containing AI cost risk.

Initial fair-use caps:
- Free: 30 minutes/month (Voice -> Text)
- Pro: 200 minutes/month (Voice -> Voice)

---

## Next Steps

- Confirm a reasonable monthly Voice -> Voice cap based on expected usage.
- Decide whether to keep Whisper as a fallback for Voice -> Text.
- Add telemetry to measure average voice minutes per user.
