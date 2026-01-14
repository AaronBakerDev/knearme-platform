# Example Conversations (Interviewer + Back Office)

These scripts show how the interviewing agent should sound and what the back office does in parallel. Each example includes:
- The chat script (Contractor + Assistant).
- The expected back office actions (tool calls, updates, preview refresh).
- The reasoning behind why each step happens.

Legend for back office actions:
- extractProjectData
- updateDescriptionBlocks
- showPortfolioPreview
- promptForImages
- suggestQuickActions
- updateContractorProfile (proposed tool)

## Opening Message Patterns

The opener should invite intent without forcing a path. Preferred options:
- "Hey — how can I help today?"
- "What do you want to work on?"
- "Want to start a new project or update an existing one?"

If the contractor says "start a new project," the interviewer replies with:
- "Great — tell me about the job."
and then enters the normal interview flow.

## Example 1: Masonry, photos later, generate without photos

Context:
- Business: Keystone Masonry
- Services: chimney repair, brick repair
- Location: Pittsburgh, PA

Conversation:
1) Assistant: "Give me the big picture on this project — what happened from start to finish?"
   - Decision notes:
     - Start with a wide-open prompt so the contractor can unload the full story without being boxed in.
2) Contractor: "We rebuilt a chimney that was leaking into the attic."
   - Back office:
     - extractProjectData { project_type: "chimney rebuild", customer_problem: "Water leaking into attic", solution_approach: "Rebuilt chimney", city: null, state: null }
     - updateDescriptionBlocks (Draft: heading + paragraph for problem/solution)
     - showPortfolioPreview { highlightFields: ["problem", "solution"] }
   - Decision notes:
     - Capture the core narrative early (problem + solution) to seed the draft.
     - Propose a story angle based on the leak.
3) Assistant: "Sounds like a leak-prevention rescue job. Want the story framed around protecting the attic?"
   - Decision notes:
     - Offer an angle so the contractor can co-author the story direction.
4) Contractor: "Yes."
   - Back office:
     - updateDescriptionBlocks (Set story angle and opener)
     - showPortfolioPreview { highlightFields: ["overview"] }
   - Decision notes:
     - Lock in the framing so follow-ups stay focused.
5) Assistant: "Where was this, city and state?"
   - Decision notes:
     - Location is required for the page header, service area, and local proof.
6) Contractor: "Mount Lebanon, PA."
   - Back office:
     - extractProjectData { city: "Mount Lebanon", state: "PA" }
     - showPortfolioPreview { highlightFields: ["location"] }
   - Decision notes:
     - Update location immediately to show progress and reduce backtracking.
7) Assistant: "What did you rebuild vs. repair? Anything notable in the scope?"
   - Decision notes:
     - Gather scope details and invite specifics without forcing materials.
8) Contractor: "We rebuilt the top six courses, replaced the crown and cap, and repointed the base."
   - Back office:
     - extractProjectData { scope_details: "Rebuilt top six courses, replaced crown and cap, repointed base" }
     - updateDescriptionBlocks (Add scope details)
     - showPortfolioPreview { highlightFields: ["scope"] }
   - Decision notes:
     - Use scope specifics to make the draft concrete.
9) Assistant: "Any constraints or tricky parts?"
   - Decision notes:
     - Constraints add credibility and show craftsmanship.
10) Contractor: "Tight access and a steep roof."
   - Back office:
     - extractProjectData { challenges: "Tight access and a steep roof" }
     - updateDescriptionBlocks (Add challenges)
     - showPortfolioPreview { highlightFields: ["challenges"] }
   - Decision notes:
     - Capture obstacles for a stronger narrative arc.
11) Assistant: "What changed after the fix? Any homeowner reaction?"
   - Decision notes:
     - Outcomes turn the story into proof.
12) Contractor: "No more leaks, and they said the attic finally feels safe."
   - Back office:
     - extractProjectData { outcome: "No more leaks; attic feels safe", testimonial: "Homeowner said the attic finally feels safe" }
     - updateDescriptionBlocks (Add outcome)
     - showPortfolioPreview { highlightFields: ["outcome"] }
   - Decision notes:
     - Turn results into the closing beat.
13) Assistant: "Here is what I have so far: You rebuilt a leaking chimney in Mount Lebanon, replaced the top courses and crown, worked around a steep roof, and stopped the attic leaks. Does that sound right?"
   - Decision notes:
     - Recap builds trust and gives the contractor a chance to correct or add.
14) Contractor: "Yes, that's right."
15) Assistant: "Any photos? If not, I can draft the write-up now."
   - Decision notes:
     - Suggest assets without blocking progress or making it feel required.
16) Contractor: "No photos yet."
   - Back office:
     - suggestQuickActions ["Generate draft", "Add photos", "Add proud moment"]
   - Decision notes:
     - Offer next actions so they can proceed immediately or defer extras.
17) Assistant: "No problem. Want the draft now, or add one more detail first?"
   - Decision notes:
     - Give a soft choice to keep it collaborative.

Why this flow:
- The angle is agreed on early, so follow-ups build a coherent story.
- Scope, constraints, and outcome create a strong narrative arc.
- City/state are gathered early for service area and URLs.
- Photos are suggested but not required to draft.

## Example 2: Cleaning business, no materials required

Context:
- Business: Bright Day Cleaning
- Services: residential cleaning, office cleaning
- Location: Austin, TX

Conversation:
1) Assistant: "Give me the big picture on this project — what happened from start to finish?"
   - Decision notes:
     - Start with a full narrative to reduce back-and-forth.
2) Contractor: "We did a deep clean after a tenant move-out."
   - Back office:
     - extractProjectData { project_type: "move-out deep clean", customer_problem: "Tenant move-out left heavy buildup", solution_approach: "Deep clean and reset", city: null, state: null }
     - updateDescriptionBlocks (Problem + solution)
     - showPortfolioPreview { highlightFields: ["problem", "solution"] }
   - Decision notes:
     - Avoid asking about materials because it is not relevant for this trade.
     - Propose a framing that highlights the outcome.
3) Assistant: "Sounds like a move-in-ready reset. Want the story framed around making the home feel new again?"
   - Decision notes:
     - Offer a clear angle that is easy to agree with or adjust.
4) Contractor: "Yes."
   - Back office:
     - updateDescriptionBlocks (Set story angle and opener)
     - showPortfolioPreview { highlightFields: ["overview"] }
   - Decision notes:
     - Lock in the framing so the follow-ups stay tight.
5) Assistant: "What city and state should we show?"
   - Decision notes:
     - Location is needed for local proof and display consistency.
6) Contractor: "Austin, TX."
   - Back office:
     - extractProjectData { city: "Austin", state: "TX" }
     - showPortfolioPreview { highlightFields: ["location"] }
   - Decision notes:
     - Update the preview to show the project taking shape.
7) Assistant: "What was the worst area or biggest challenge?"
   - Decision notes:
     - Ask for one concrete detail to strengthen the story.
8) Contractor: "Heavy kitchen grease and scuffed floors."
   - Back office:
     - extractProjectData { challenges: "Heavy kitchen grease and scuffed floors" }
     - updateDescriptionBlocks (Add challenge)
     - showPortfolioPreview { highlightFields: ["challenges"] }
   - Decision notes:
     - Turn the challenge into proof of effort and expertise.
9) Assistant: "What was the win at the end?"
   - Decision notes:
     - Outcomes add the payoff for the reader.
10) Contractor: "Floors looked new and the odor was gone."
   - Back office:
     - extractProjectData { outcome: "Floors looked new and odor was gone" }
     - updateDescriptionBlocks (Add outcome)
     - showPortfolioPreview { highlightFields: ["outcome"] }
   - Decision notes:
     - Use results to create a strong closing beat.
11) Assistant: "Here is what I have so far: Move-out deep clean in Austin, toughest spots were the grease and scuffed floors, and the home looked new with the odor gone. Sound right?"
   - Decision notes:
     - Recap invites corrections before drafting.
12) Contractor: "Yes."
13) Assistant: "Got photos? If not, I can draft the page now."
   - Decision notes:
     - Prompt for assets while keeping generation unblocked.

Why this flow:
- No materials question because cleaning does not require them.
- The angle + challenge + outcome makes the story feel real and specific.
- Keeps location as a priority without blocking.

## Example 3: Service gap detected (add service)

Context:
- Business: Summit Home Pros
- Services: drywall repair, painting
- Location: Denver, CO

Conversation:
1) Assistant: "Give me the big picture on this project — what happened from start to finish?"
   - Decision notes:
     - Start with an open overview to surface scope quickly.
2) Contractor: "We handled a full bathroom remodel."
   - Back office:
     - extractProjectData { project_type: "bathroom remodel" }
     - showPortfolioPreview { highlightFields: ["project_type"] }
     - Business Profile Steward suggests: "bathroom remodel" not in services
   - Decision notes:
     - Detect a service gap and ask permission before changing the business profile.
3) Assistant: "Quick one: I didn't know you do bathroom remodels. Want me to add that to your services?"
   - Decision notes:
     - Permission-first keeps trust and prevents silent profile changes.
4) Contractor: "Yes, please."
   - Back office:
     - updateContractorProfile { services: ["drywall repair", "painting", "bathroom remodel"] }
   - Decision notes:
     - Update services immediately so future projects auto-classify correctly.
5) Assistant: "Sounds like a full transformation. Want the story framed around fixing leaks and upgrading the space?"
   - Decision notes:
     - Propose a clear angle before diving into details.
6) Contractor: "Yes."
   - Back office:
     - updateDescriptionBlocks (Set story angle and opener)
     - showPortfolioPreview { highlightFields: ["overview"] }
   - Decision notes:
     - Lock in the framing so follow-ups stay focused.
7) Assistant: "Where was this one, city and state?"
   - Decision notes:
     - Location is needed for local proof and display consistency.
8) Contractor: "Denver, CO."
   - Back office:
     - extractProjectData { city: "Denver", state: "CO" }
     - showPortfolioPreview { highlightFields: ["location"] }
   - Decision notes:
     - Update location to keep the preview current.
9) Assistant: "What was the main problem before you started?"
   - Decision notes:
     - Shift into problem framing to anchor the story.
10) Contractor: "The old shower was leaking and the tile was falling off."
   - Back office:
     - extractProjectData { customer_problem: "Leaking shower and failing tile" }
     - updateDescriptionBlocks (Add problem)
     - showPortfolioPreview { highlightFields: ["problem"] }
   - Decision notes:
     - Extract the pain point to set up a clear before/after narrative.
11) Assistant: "What did you do to solve it?"
   - Decision notes:
     - Follow with the solution to complete the core story beats.
12) Contractor: "New waterproofing, tile, and fixtures."
   - Back office:
     - extractProjectData { solution_approach: "New waterproofing, tile, and fixtures" }
     - updateDescriptionBlocks (Add solution)
     - showPortfolioPreview { highlightFields: ["solution"] }
   - Decision notes:
     - Convert the fix into language the page can use verbatim.
13) Assistant: "Any constraints or wins worth calling out?"
   - Decision notes:
     - Constraints and wins add credibility and differentiation.
14) Contractor: "Small bathroom, finished in four days."
   - Back office:
     - extractProjectData { challenges: "Small bathroom", outcome: "Finished in four days" }
     - updateDescriptionBlocks (Add challenge and outcome)
     - showPortfolioPreview { highlightFields: ["challenges", "outcome"] }
   - Decision notes:
     - Use constraints and speed as proof of execution.
15) Assistant: "Here is what I have so far: Bathroom remodel in Denver, fixed a leaking shower with new waterproofing and tile, and finished in four days despite the tight space. Want me to draft the write-up?"
   - Decision notes:
     - Recap confirms the story before drafting.
16) Contractor: "Yes."

Why this flow:
- The agent discovers an off-menu service and offers to update it.
- Permission-first profile updates preserve trust.
- The angle keeps the narrative focused and specific.
- The interview continues without interruption.

## Example 4: Open-ended question, agent answers then guides

Context:
- Business: Peak Roofing
- Services: roof repair, roof replacement
- Location: Charlotte, NC

Conversation:
1) Contractor: "Can you make this sound premium?"
2) Assistant: "Absolutely. Give me the big picture on the project first — what happened from start to finish?"
   - Back office:
     - suggestQuickActions ["Roof repair", "Roof replacement", "Storm damage"]
   - Decision notes:
     - Acknowledge the request, then steer into the story needed to deliver.
     - Offer quick actions to reduce effort without forcing a path.
3) Contractor: "Storm damage repair."
   - Back office:
     - extractProjectData { project_type: "storm damage repair" }
     - showPortfolioPreview { highlightFields: ["project_type"] }
   - Decision notes:
     - Anchor the project type so later copy can be specific.
4) Assistant: "Sounds like a fast-response protection job. Want the story framed around getting the home sealed quickly after the storm?"
   - Decision notes:
     - Propose a premium angle tied to speed and protection.
5) Contractor: "Yes."
   - Back office:
     - updateDescriptionBlocks (Set story angle and opener)
     - showPortfolioPreview { highlightFields: ["overview"] }
   - Decision notes:
     - Lock in the framing so follow-ups stay focused.
6) Assistant: "Where was the project?"
   - Decision notes:
     - Location is the next essential detail for trust and locality.
7) Contractor: "Gastonia, NC."
   - Back office:
     - extractProjectData { city: "Gastonia", state: "NC" }
     - showPortfolioPreview { highlightFields: ["location"] }
   - Decision notes:
     - Update the preview to show immediate progress.
8) Assistant: "What was damaged and how did you fix it?"
   - Decision notes:
     - One prompt to capture scope and solution without dragging the flow.
9) Contractor: "Shingles blew off, so we replaced underlayment and sealed the roof."
   - Back office:
     - extractProjectData { customer_problem: "Storm damage with missing shingles", solution_approach: "Replaced underlayment and sealed roof" }
     - updateDescriptionBlocks (Add problem + solution)
     - showPortfolioPreview { highlightFields: ["problem", "solution"] }
   - Decision notes:
     - Translate damage + fix into clear before/after language.
10) Assistant: "Any timing constraints or homeowner feedback?"
   - Decision notes:
     - Pull in urgency and proof to elevate the story.
11) Contractor: "We came out same day, and they said it was a huge relief."
   - Back office:
     - extractProjectData { challenges: "Same-day response", outcome: "Homeowner called it a huge relief" }
     - updateDescriptionBlocks (Add constraint + outcome)
     - showPortfolioPreview { highlightFields: ["challenges", "outcome"] }
   - Decision notes:
     - Capture urgency and relief to support the premium angle.
12) Assistant: "Here is what I have so far: Storm damage repair in Gastonia, replaced underlayment and sealed the roof, and the homeowner got same-day relief. Want me to draft the premium version?"
   - Decision notes:
     - Recap confirms the story and tees up the requested tone.
13) Contractor: "Yes."

Why this flow:
- The agent answers the request first, then guides back to details.
- Quick actions help the contractor respond faster without pressure.
- The angle and urgency cues justify the premium tone.

## Example 5: Optional brand asset nudge (logo)

Context:
- Business: Riverbend Landscapes
- Services: lawn care, hardscaping, irrigation
- Location: Boise, ID

Conversation:
1) Assistant: "Give me the big picture on this project — what happened from start to finish?"
   - Decision notes:
     - Start with a broad prompt to gather enough for a first draft.
2) Contractor: "We built a patio with a seating area and fire pit."
   - Back office:
     - extractProjectData { project_type: "patio build", solution_approach: "Built patio with seating and fire pit" }
     - updateDescriptionBlocks
     - showPortfolioPreview { highlightFields: ["project_type", "solution"] }
   - Decision notes:
     - Capture project type + solution to begin forming the narrative.
3) Assistant: "Sounds like an outdoor entertaining upgrade. Want the story framed around creating a hosting space?"
   - Decision notes:
     - Propose a simple angle that matches the project outcome.
4) Contractor: "Yes."
   - Back office:
     - updateDescriptionBlocks (Set story angle and opener)
     - showPortfolioPreview { highlightFields: ["overview"] }
   - Decision notes:
     - Lock in the framing so follow-ups stay focused.
5) Assistant: "Where was this, city and state?"
   - Decision notes:
     - Location is needed for local proof and display consistency.
6) Contractor: "Boise, ID."
   - Back office:
     - extractProjectData { city: "Boise", state: "ID" }
     - showPortfolioPreview { highlightFields: ["location"] }
   - Decision notes:
     - Update location to keep the preview current.
7) Assistant: "What did you build to make it work for entertaining?"
   - Decision notes:
     - Draw out concrete scope details that sell the result.
8) Contractor: "A seating area, fire pit, and paver border."
   - Back office:
     - extractProjectData { scope_details: "Seating area, fire pit, and paver border" }
     - updateDescriptionBlocks (Add scope details)
     - showPortfolioPreview { highlightFields: ["scope"] }
   - Decision notes:
     - Use specifics to make the draft feel tangible.
9) Assistant: "Any constraints or wins worth calling out?"
   - Decision notes:
     - Constraints and wins add credibility and differentiation.
10) Contractor: "Tight yard, finished before a birthday party."
   - Back office:
     - extractProjectData { challenges: "Tight yard", outcome: "Finished before a birthday party" }
     - updateDescriptionBlocks (Add challenge + outcome)
     - showPortfolioPreview { highlightFields: ["challenges", "outcome"] }
   - Decision notes:
     - Use timing and constraints to add momentum and proof.
11) Assistant: "Here is what I have so far: Patio build in Boise with seating and a fire pit, built for entertaining, finished before a birthday party despite a tight yard. Want me to draft the write-up now?"
   - Decision notes:
     - Recap confirms the story before drafting.
12) Contractor: "Yes."
   - Back office:
     - generatePortfolioContent
     - open editor panel (form tab)
   - Decision notes:
     - Generate once the minimum story is present, then open the editor.
13) Assistant: "Draft is ready. Optional: if you have a logo, we can add it to your profile to make the page feel more official."
   - Back office:
     - Business Profile Steward suggests logo upload (one-time nudge)
   - Decision notes:
     - Ask for branding only after delivering value, and keep it optional.

Why this flow:
- Branding nudge is optional, one-time, and timed after value is delivered.
- The angle and scope details create a clear narrative before drafting.
- Keeps the interview focused on the project, not admin tasks.

## Notes

- Photos are always suggested but never required for drafting.
- City/state is a priority ask for service area and SEO URLs.
- The back office proposes actions; the Interviewer asks permission before updating the contractor profile.
- Propose a story angle early, then ask 2-3 targeted follow-ups before drafting.
- Recap the story in plain language and invite corrections before drafting.
