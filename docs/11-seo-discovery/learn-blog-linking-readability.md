# Learn Blog: Internal Linking & Readability Playbook

**Version:** 1.0
**Last Updated:** December 11, 2025
**Scope:** `/learn` articles and other long-form editorial content

---

## Objectives

- Keep every Learn article discoverable (no dead ends) while reinforcing the service pillars.
- Improve reading comfort and scannability so posts convert to service and city pages.
- Establish repeatable rules that content, design, and engineering can apply without rework.

---

## Internal Linking Standards

- **Link density:** Target **5–10 contextual internal links per ~1,000 words**; even short posts should ship with **3–5 internal links** so no article is orphaned. Long-form guides can support 15–20 if each link is relevant.
- **Early pillar link:** Each article must link back to its pillar or hub **within the first 30% of the copy** (ideally the intro or first H2 block).
- **Cluster coverage:** Pillar → all related Learn articles; every article → pillar + 2–3 closely related peers. Keep important destinations within **≤3 clicks** of the homepage.
- **Anchor text:** Use descriptive, intent-matched anchors; avoid "click here"/"read more." Mix exact/partial/semantic variants.
- **External links:** Link out when it adds credibility for readers. Use `rel="sponsored"` for paid placements, `rel="ugc"` for user-generated links, and `rel="nofollow"` when trust is uncertain. Default to crawlable links for reputable sources.

---

## Readability & Layout

- **Max line length:** Cap body copy to **60–72 characters (≈60–72ch) on desktop** and **≤60ch on mobile**.
- **Line height:** Use **~1.5 line-height for body text**; slightly tighter (1.3–1.4) for headings.
- **Paragraph spacing:** Keep block spacing at least **1.5× the font size** to maintain clear separation.
- **Alignment:** Left-align long-form text; avoid justified alignment to reduce rivers for dyslexia/low-vision users.

---

## Implementation Backlog (Repo)

1. **Layout guardrails**
   - Apply max width (e.g., `max-w-[72ch]` desktop, `max-w-[60ch]` mobile) and `leading-relaxed` in the blog layout component.
   - Add responsive padding so text blocks breathe on smaller viewports.

2. **Key Links block (above the fold)**
   - Slot after the intro: **2–3 internal links** to the pillar/related guides + **1 authoritative external source**.
   - Render as a compact list or callout card; keep anchors descriptive.

3. **Cluster enforcement**
   - Pillar templates list and link to all associated Learn articles.
   - MDX/markdown authoring checklist requires an **up-link to the pillar within the first 30%** of content.
   - Each article must include **2 sibling links** (same cluster) in-context.

4. **Monthly internal-link audit**
   - Use GSC top 20 pages as the starting set; add **3–5 fresh contextual links per page** (both inbound and outbound) based on new content published that month.
   - Track orphan/low-inlink pages and remediate within the same cycle.

5. **Callouts & TOC**
   - Add reusable **tip/warning/checklist** callout components to break monotony and surface CTAs without widening line measure.
   - Include an optional **Table of Contents** for posts over ~1,200 words.

---

## Success Criteria

- Zero orphan Learn articles; all cluster pages reachable in ≤3 clicks.
- Median Learn article ships with ≥5 contextual internal links and an early pillar link.
- Body text respects line length and line-height constraints across breakpoints.
- Monthly audit completed with remediation notes logged in `docs/11-seo-discovery/internal-linking.md`.

