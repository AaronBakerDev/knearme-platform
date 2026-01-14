**Marketing Team for a General Contractor**

What they'd typically need (but can't afford):
- Marketing Director ($80-120k) - strategy, planning
- Content Manager ($50-70k) - blog, social, email
- SEO/Paid Specialist ($60-80k) - search, ads
- Graphic Designer ($50-65k) - visuals, collateral
- Part-time Videographer ($30-50k) - project documentation

Total: $270-385k/year fully loaded
Reality: Most GCs have nobody, or one overwhelmed person doing all of it badly

---

## What The Marketing "Team" Actually Does

**Daily/Reactive**
- Social media posting and engagement
- Review monitoring and responses
- Lead response and qualification
- Comment/DM replies
- Competitor monitoring

**Weekly**
- Content creation (blog, social, email)
- Website updates (new projects, testimonials)
- Ad performance monitoring and adjustments
- Lead nurturing sequences
- Analytics review

**Monthly/Campaign**
- Strategy and planning
- New campaign launches
- SEO optimization
- Reporting to owner
- Collateral updates
- Photo/video coordination

**Quarterly/Strategic**
- Brand refresh assessments
- Competitive analysis deep dives
- Annual planning
- Budget optimization
- New channel evaluation

---

## The Agent System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MARKETING BRAIN                                  │
│                                                                          │
│  Central orchestrator with:                                              │
│  • Brand voice and guidelines                                            │
│  • Project database (photos, details, testimonials)                     │
│  • Customer personas and segments                                        │
│  • Competitive intelligence                                              │
│  • Performance history and learnings                                     │
│  • Content calendar and campaign state                                   │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ├────────────┬────────────┬────────────┬────────────┬────────────┐
          ▼            ▼            ▼            ▼            ▼            ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│   CONTENT    ││   SOCIAL     ││  REPUTATION  ││    LEAD      ││     SEO      ││   PAID       │
│   AGENT      ││   AGENT      ││   AGENT      ││   AGENT      ││   AGENT      ││   AGENT      │
│              ││              ││              ││              ││              ││              │
│ • Blog posts ││ • Posting    ││ • Reviews    ││ • Response   ││ • Keywords   ││ • Google Ads │
│ • Case study ││ • Engagement ││ • Reputation ││ • Nurturing  ││ • On-page    ││ • Meta Ads   │
│ • Email      ││ • Community  ││ • Testimonial││ • Qualify    ││ • Local SEO  ││ • Retarget   │
│ • Video      ││ • Trends     ││ • Crisis     ││ • Handoff    ││ • Technical  ││ • Optimize   │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘└──────────────┘└──────────────┘
          │            │            │            │            │            │
          └────────────┴────────────┴────────────┴────────────┴────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATIONS                                     │
│                                                                          │
│  Social APIs (Meta, LinkedIn, Instagram, YouTube, TikTok, Nextdoor)     │
│  Google Business Profile │ Review platforms (Yelp, Houzz, Angi)         │
│  CRM (HubSpot, Jobber, Buildertrend) │ Email (Mailchimp, Klaviyo)       │
│  Google Ads │ Meta Ads │ Google Analytics │ Search Console               │
│  Ahrefs/SEMrush │ Canva API │ Stock photo APIs │ CMS (WordPress, etc)   │
│  Scheduling (Buffer, Later) │ Phone tracking │ Form builders             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Deep Dive: Content Agent

The engine that feeds everything else.

**Trigger: New project completed OR content calendar date OR trending topic detected**

```
PROJECT-BASED CONTENT GENERATION
│
├── Trigger: Project marked "complete" in system
│   │
│   │  Project Data Available:
│   │  ├── Type: Kitchen renovation
│   │  ├── Scope: Full gut, custom cabinets, island addition
│   │  ├── Duration: 6 weeks
│   │  ├── Budget range: $85-95k
│   │  ├── Location: Oakville (affluent suburb)
│   │  ├── Photos: 47 images (before, during, after)
│   │  ├── Client name: Sarah & Michael Chen
│   │  ├── Testimonial: "Best decision we made. Team was professional..."
│   │  └── Challenges overcome: Load-bearing wall removal, permit delays
│   │
│   └── Generate Content Package:
│
├── 1. CASE STUDY (long-form asset)
│   │
│   │  Auto-generated structure:
│   │  ├── Headline: "From Dated to Dream: A Complete Kitchen 
│   │  │             Transformation in Oakville"
│   │  │
│   │  ├── The Challenge:
│   │  │   "Sarah and Michael had lived with their 1990s kitchen for 
│   │  │    twelve years. Dated oak cabinets, limited counter space, 
│   │  │    and a closed-off layout that kept the cook isolated from 
│   │  │    family gatherings. They wanted an open concept that would 
│   │  │    become the heart of their home—without moving."
│   │  │
│   │  ├── The Solution:
│   │  │   ├── Structural work (load-bearing wall removal)
│   │  │   ├── Custom cabinetry details
│   │  │   ├── Material selections and why
│   │  │   ├── Design decisions that solved their problems
│   │  │   └── How timeline/budget was managed
│   │  │
│   │  ├── The Process:
│   │  │   "Week 1-2: Demo and structural work..."
│   │  │   [Timeline with progress photos]
│   │  │
│   │  ├── The Result:
│   │  │   [Before/after photo grid]
│   │  │   Key improvements with specifics
│   │  │
│   │  ├── Client Testimonial:
│   │  │   Pull quote with photo of clients (if permitted)
│   │  │
│   │  └── Project Stats Box:
│   │      ├── Timeline: 6 weeks
│   │      ├── Investment: $85,000-95,000
│   │      ├── Location: Oakville, ON
│   │      └── Scope: Full kitchen renovation with structural
│   │
│   └── Output: 
│       ├── Full HTML for website portfolio
│       ├── PDF version for sales meetings
│       └── Metadata for SEO
│
├── 2. BLOG POST (SEO-focused)
│   │
│   │  Keyword research first:
│   │  ├── Check: "kitchen renovation oakville" - 320 searches/mo
│   │  ├── Check: "open concept kitchen remodel cost" - 1,200 searches/mo
│   │  ├── Check: "load bearing wall removal kitchen" - 890 searches/mo
│   │  └── Select primary: "open concept kitchen remodel" (high intent)
│   │
│   │  Generate post:
│   │  "What Does an Open Concept Kitchen Remodel Really Cost in 2025?
│   │   
│   │   [Uses project as anchor example while providing general value]
│   │   
│   │   - Why open concept kitchens are worth the investment
│   │   - What's involved in removing a load-bearing wall
│   │   - Real cost breakdown from a recent Oakville project
│   │   - Timeline expectations
│   │   - Questions to ask your contractor
│   │   - [CTA: Free consultation for your kitchen project]"
│   │
│   └── Output:
│       ├── WordPress-ready HTML with schema markup
│       ├── Meta title and description
│       ├── Internal linking suggestions
│       └── Featured image selection from project photos
│
├── 3. SOCIAL MEDIA PACKAGE
│   │
│   │  Platform-specific content:
│   │  │
│   │  ├── Instagram:
│   │  │   ├── Carousel post (before/during/after - 8 slides)
│   │  │   │   Slide 1: Dramatic before shot
│   │  │   │   Slide 2: "Swipe to see the transformation →"
│   │  │   │   Slide 3-6: Process shots
│   │  │   │   Slide 7: After reveal
│   │  │   │   Slide 8: Detail shot + CTA
│   │  │   │
│   │  │   │   Caption: "This Oakville kitchen hadn't been touched 
│   │  │   │   since the 90s. Oak cabinets, closed floor plan, zero 
│   │  │   │   storage. Six weeks later? 👆
│   │  │   │   
│   │  │   │   The biggest challenge was removing the load-bearing 
│   │  │   │   wall between kitchen and living room. Worth it? Sarah 
│   │  │   │   says she finally loves cooking again.
│   │  │   │   
│   │  │   │   Full project details in bio.
│   │  │   │   
│   │  │   │   #kitchenrenovation #oakville #beforeandafter 
│   │  │   │   #generalcontractor #homerenovation #openshelving"
│   │  │   │
│   │  │   ├── Reels (3 variations):
│   │  │   │   ├── 15-sec transformation timelapse
│   │  │   │   ├── 30-sec "process" with text overlays
│   │  │   │   └── 60-sec "walk through" with voiceover script
│   │  │   │
│   │  │   └── Stories (7-day drip):
│   │  │       Day 1: Before teaser "Guess what this becomes"
│   │  │       Day 2: Demo day footage
│   │  │       Day 3: "The scary part" - structural work
│   │  │       Day 4: Cabinets going in
│   │  │       Day 5: Detail shot - hardware selection
│   │  │       Day 6: Final reveal
│   │  │       Day 7: Client reaction/testimonial
│   │  │
│   │  ├── Facebook:
│   │  │   ├── Album post with narrative
│   │  │   ├── Before/after single image for shares
│   │  │   └── Local community group version (Oakville Home Owners)
│   │  │
│   │  ├── LinkedIn:
│   │  │   "Another kitchen transformation complete in Oakville.
│   │  │    
│   │  │    This one had an interesting structural challenge—removing
│   │  │    a load-bearing wall to create the open concept our clients
│   │  │    wanted.
│   │  │    
│   │  │    The process:
│   │  │    → Structural engineer assessment
│   │  │    → Custom beam fabrication  
│   │  │    → Careful demo sequence
│   │  │    → 6 weeks start to finish
│   │  │    
│   │  │    Nothing beats the moment clients see their finished space
│   │  │    for the first time.
│   │  │    
│   │  │    #construction #renovation #generalcontractor"
│   │  │
│   │  ├── Nextdoor:
│   │  │   Local-focused, neighbor-friendly tone
│   │  │   "Just finished up this kitchen project on [Street Area].
│   │  │    If you saw our trucks around, this is what we were up to!
│   │  │    Happy to answer any renovation questions."
│   │  │
│   │  ├── Houzz:
│   │  │   ├── Full project upload with all photos tagged
│   │  │   ├── Ideabook descriptions for each photo
│   │  │   └── Product tags (cabinets, countertops, fixtures)
│   │  │
│   │  └── Google Business Profile:
│   │      ├── Project post with photos
│   │      └── Update "Products/Services" if new capability shown
│   │
│   └── Output:
│       ├── Platform-native content files
│       ├── Scheduled posting times (optimal per platform)
│       ├── Hashtag sets tested against reach data
│       └── Engagement prompts for first 30 min after posting
│
├── 4. EMAIL CONTENT
│   │
│   │  Segment-appropriate versions:
│   │  │
│   │  ├── Newsletter subscribers:
│   │  │   "This Month's Featured Project: Oakville Kitchen"
│   │  │   [Shortened case study with best photos]
│   │  │   [Link to full case study]
│   │  │   [Seasonal CTA: "Planning a spring renovation?"]
│   │  │
│   │  ├── Past clients (kitchen projects):
│   │  │   "See what's possible with kitchen renovations now"
│   │  │   [Focus on new techniques/materials since their project]
│   │  │   [Soft referral ask]
│   │  │
│   │  ├── Leads in pipeline (considering kitchen):
│   │  │   "Here's a kitchen project similar to what we discussed"
│   │  │   [Directly relevant details]
│   │  │   [Clear next step CTA]
│   │  │
│   │  └── Realtors/designers (referral partners):
│   │      "New portfolio piece for your clients"
│   │      [Professional presentation]
│   │      [Easy to forward]
│   │
│   └── Output:
│       ├── Mailchimp/Klaviyo ready HTML
│       ├── Subject line A/B variants
│       ├── Send time recommendations per segment
│       └── Automated trigger setup if needed
│
├── 5. SALES COLLATERAL
│   │
│   │  ├── One-pager PDF:
│   │  │   "Kitchen Renovation Capabilities"
│   │  │   [This project as hero example]
│   │  │   [Process overview]
│   │  │   [Pricing guidance]
│   │  │   [Contact CTA]
│   │  │
│   │  ├── Proposal insert:
│   │  │   Relevant case study formatted for proposals
│   │  │
│   │  └── Presentation slides:
│   │      Before/after + key stats for sales meetings
│   │
│   └── Output: Print-ready PDF, Google Slides, Canva links
│
└── 6. VIDEO SCRIPTS
    │
    ├── YouTube long-form (5-8 min):
    │   "Complete Kitchen Renovation Start to Finish"
    │   [Full script with B-roll callouts]
    │   [Chapter markers]
    │   [Description with keywords]
    │   [Thumbnail concepts]
    │
    ├── YouTube Shorts / TikTok / Reels:
    │   ├── "The moment we removed the wall" (15 sec)
    │   ├── "What $90k gets you in 2025" (30 sec)
    │   └── "Client reaction to final reveal" (15 sec)
    │
    └── Output:
        ├── Scripts with visual directions
        ├── Music/sound suggestions (royalty-free)
        └── Editing notes for videographer
```

```
EVERGREEN CONTENT GENERATION
│
├── Trigger: Content calendar slot OR SEO opportunity detected
│
├── Topic Selection:
│   │
│   │  Agent analyzes:
│   │  ├── Keyword gaps (what competitors rank for, you don't)
│   │  ├── Questions people ask (Google's "People Also Ask")
│   │  ├── Seasonal relevance (deck content in spring, etc.)
│   │  ├── Your completed projects (what can you credibly write about?)
│   │  ├── Lead questions (what do prospects keep asking?)
│   │  └── Trending topics in home improvement
│   │
│   │  Example output:
│   │  "Recommend creating: 'How to Choose a General Contractor in [City]'
│   │   
│   │   Rationale:
│   │   - 480 monthly searches, low competition
│   │   - You rank #18 currently (page 2)
│   │   - Competitors' content is thin (avg 600 words)
│   │   - High intent keyword (people actively looking)
│   │   - Can naturally showcase your process/differentiators
│   │   
│   │   Shall I draft this? [YES] [DIFFERENT TOPIC] [ADD TO QUEUE]"
│
├── Content Generation:
│   │
│   │  "How to Choose a General Contractor in [City]: 
│   │   A Homeowner's Complete Guide"
│   │
│   │  Structure:
│   │  ├── Intro (address the anxiety of hiring a contractor)
│   │  ├── What makes a good GC (credentials, insurance, etc.)
│   │  ├── Red flags to watch for
│   │  ├── Questions to ask (with why each matters)
│   │  ├── How to compare quotes properly
│   │  ├── What to expect in a contract
│   │  ├── Local considerations for [City]
│   │  └── Next steps / CTA
│   │
│   │  Subtly weaves in your strengths:
│   │  "Look for contractors who provide detailed written estimates.
│   │   At [Company], we break down every line item because we believe
│   │   you should know exactly where your money goes."
│   │
│   └── Output: 
│       2,000+ word post that's genuinely helpful AND positions you
│
└── Content Refresh:
    │
    ├── Quarterly audit of existing content:
    │   ├── Traffic trending down?
    │   ├── Information outdated?
    │   ├── Competitors published better version?
    │   └── New projects to add as examples?
    │
    └── Auto-update recommendations:
        "Your 'Cost to Renovate a Bathroom' post is 18 months old.
         Prices have increased ~15% since then. 
         Recommend updating numbers and adding your recent Riverside 
         bathroom as a new example.
         
         [APPROVE UPDATE] [I'LL REVIEW] [SKIP]"
```

---

## Deep Dive: Social Agent

**Daily Operations:**

```
POSTING WORKFLOW (runs 7am daily)
│
├── Check content queue:
│   ├── Scheduled posts ready to go
│   ├── Project content packages awaiting posting
│   └── Evergreen content for slow days
│
├── Today's posting plan:
│   │
│   │  Instagram (optimal times for contractor audience):
│   │  ├── 7:30am - Worksite "morning motivation" shot
│   │  │   [Auto-selected from recent project photos]
│   │  │   "Early start on the Riverside bathroom demo. 
│   │  │    Nothing like the sound of progress. ☕️🔨"
│   │  │
│   │  ├── 12:15pm - Educational carousel (evergreen)
│   │  │   "5 Signs Your Deck Needs More Than Just Staining"
│   │  │   [Pre-created content from queue]
│   │  │
│   │  └── 5:30pm - End of day progress/reveal
│   │      [If project milestone hit today, use that]
│   │      [Otherwise, throwback Thursday or testimonial]
│   │
│   │  Facebook:
│   │  ├── 9am - Share blog post or project
│   │  └── 6pm - Engagement post or community content
│   │
│   │  LinkedIn:
│   │  └── 8am - Professional/industry content (2-3x/week only)
│   │
│   │  Google Business:
│   │  └── Weekly project update post
│   │
│   └── Nextdoor:
│       └── Local community engagement (1-2x/week)
│
├── Adaptive adjustments:
│   │
│   │  Weather check:
│   │  ├── Rainy day? 
│   │  │   → Don't post "beautiful day on site"
│   │  │   → Instead: "Rain day = planning day. Reviewing specs 
│   │  │     for next week's kitchen demo."
│   │  │
│   │  Local events:
│   │  ├── Big local event happening?
│   │  │   → Acknowledge it or skip posting
│   │  │   → "Hope everyone's enjoying [Local Festival]! 
│   │  │     We'll be back at it Monday."
│   │  │
│   │  └── Tragedy/sensitive news:
│   │      → Pause scheduled posts
│   │      → Alert human for guidance
│
└── Execution:
    ├── Posts go out via scheduling API
    ├── First 30 min: monitor for immediate engagement
    ├── Respond to any comments within 2 hours
    └── Log performance for optimization
```

```
ENGAGEMENT MANAGEMENT (continuous)
│
├── Monitor incoming:
│   ├── Comments on posts
│   ├── DMs/messages
│   ├── Mentions and tags
│   ├── Shares (thank/engage)
│   └── Competitor mentions (intelligence)
│
├── Comment response framework:
│   │
│   │  Positive comment:
│   │  ├── Compliment on work → Genuine thank you + context
│   │  │   Comment: "Wow this looks amazing!"
│   │  │   Response: "Thank you! The tile pattern was the client's 
│   │  │              idea—we just made it happen. That herringbone 
│   │  │              took some patience!"
│   │  │
│   │  ├── Question → Helpful answer + soft CTA
│   │  │   Comment: "How long did this take?"
│   │  │   Response: "This one was 8 weeks from demo to done. 
│   │  │              Timeline depends a lot on scope and materials. 
│   │  │              Happy to chat if you're planning something similar!"
│   │  │
│   │  └── Emoji only → Like or brief response
│   │
│   │  Negative/critical:
│   │  ├── Legitimate concern → Acknowledge, take offline
│   │  │   "Thanks for the feedback. We'd love to make this right—
│   │  │    could you DM us or call [number]?"
│   │  │
│   │  ├── Troll/competitor → Don't engage, document
│   │  │
│   │  └── Misunderstanding → Polite clarification
│   │      "Good question! Actually this was [clarification]. 
│   │       We always [relevant practice]."
│   │
│   │  Spam → Hide/delete, report if needed
│   │
│   └── Questions requiring expertise:
│       → Flag for human response with suggested answer
│       "Homeowner asking about load-bearing wall removal costs.
│        Suggested response: [draft]
│        Or would you like to respond directly?"
│
├── Proactive engagement:
│   │
│   │  Daily tasks:
│   │  ├── Like/comment on clients' posts (maintain relationships)
│   │  ├── Engage with local business posts (community presence)
│   │  ├── Respond to relevant hashtags (new audience)
│   │  ├── Engage with realtor/designer partners (referral nurture)
│   │  └── Participate in local Facebook groups (Oakville Homeowners, etc.)
│   │
│   │  Rules:
│   │  ├── Never salesy in others' spaces
│   │  ├── Add genuine value or don't comment
│   │  ├── Be a helpful community member first
│   │  └── Track which engagement drives followers/leads
│   │
│   └── Example proactive engagement:
│       [Local realtor posts about home they just listed]
│       → "Beautiful property! That original millwork is stunning. 
│          The new owners are lucky."
│       [No pitch, just relationship maintenance]
│
└── Trend monitoring:
    │
    ├── Track trending hashtags in home improvement
    ├── Monitor viral content formats
    ├── Watch competitor posts gaining traction
    │
    └── Alert + suggestion:
        "Trending format: 'POV: You hired a [professional]' videos
         getting 2-3x normal engagement in contractor space.
         
         Suggest creating:
         'POV: You hired a GC who actually answers the phone'
         [humorous take on contractor stereotypes]
         
         [CREATE THIS] [SKIP] [SAVE FOR LATER]"
```

---

## Deep Dive: Reputation Agent

**Review Monitoring & Response:**

```
NEW REVIEW DETECTED
│
├── Sources monitored:
│   ├── Google Business Profile
│   ├── Facebook Reviews
│   ├── Yelp
│   ├── Houzz
│   ├── HomeStars
│   ├── Angi/HomeAdvisor
│   ├── BBB
│   └── Industry-specific (Buildzoom, etc.)
│
├── Review processing:
│   │
│   │  New review: ⭐⭐⭐⭐⭐
│   │  "Mike and his team did an amazing job on our basement 
│   │   renovation. From start to finish, they were professional, 
│   │   clean, and communicated well. The quality of work exceeded 
│   │   our expectations. Highly recommend!"
│   │  - Jennifer M.
│   │
│   │  Agent analysis:
│   │  ├── Sentiment: Highly positive
│   │  ├── Key themes: professionalism, cleanliness, communication, quality
│   │  ├── Project type: Basement renovation
│   │  ├── Client lookup: Jennifer Morrison, 45 Oakwood Dr
│   │  │   └── Project completed: 3 weeks ago, $65k basement finish
│   │  └── Response urgency: Standard (respond within 24 hrs)
│   │
│   └── Generate response:
│       
│       "Jennifer, thank you so much for the kind words! 
│        
│        Your basement was a fun project—that wet bar area turned 
│        out great, and we're glad the built-ins are working well 
│        for your family's needs.
│        
│        It was a pleasure working with you and [husband's name]. 
│        Enjoy movie nights in the new space!
│        
│        - Mike & the [Company] team"
│        
│        [Personalized, references specific project details, warm]
│        
│        [APPROVE] [EDIT] [RESPOND MANUALLY]
│
├── Negative review handling:
│   │
│   │  New review: ⭐⭐
│   │  "Project took 3 weeks longer than promised. Communication 
│   │   was poor—had to chase them down for updates. Work quality 
│   │   is fine but the experience was frustrating."
│   │  - David K.
│   │
│   │  Agent analysis:
│   │  ├── Sentiment: Negative
│   │  ├── Issues: Timeline (3 weeks over), communication
│   │  ├── Positive note: Work quality acknowledged
│   │  ├── Client lookup: David Kowalski, 78 Pine St
│   │  │   └── Project: Kitchen reno, $78k
│   │  │   └── Notes: Supply chain delay on cabinets (documented),
│   │  │             PM noted client was difficult to reach
│   │  ├── Response urgency: HIGH (respond within 4 hours)
│   │  └── Escalation: Alert owner before responding
│   │
│   │  Alert to owner:
│   │  "⚠️ New 2-star review from David K. (Pine St kitchen)
│   │   
│   │   Issue: Timeline + communication complaints
│   │   
│   │   Our records show:
│   │   - Cabinet delay (3 weeks) was communicated via email on [date]
│   │   - PM logged 4 unreturned calls to client during project
│   │   
│   │   Suggested response below. Want me to post it, or would you 
│   │   prefer to handle personally?
│   │   
│   │   [POST SUGGESTED] [I'LL HANDLE] [CALL ME]"
│   │
│   └── Suggested response:
│       
│       "David, thank you for taking the time to share your feedback. 
│        You're right that the project ran longer than originally 
│        scheduled—the custom cabinet delay put us behind, and I'm 
│        sorry the communication around that wasn't as clear as it 
│        should have been.
│        
│        We're glad the finished kitchen meets your quality expectations, 
│        but we know the journey matters too. I'd welcome the chance 
│        to discuss this further—please reach out directly at [phone] 
│        if you're open to it.
│        
│        - Mike, Owner"
│        
│        [Acknowledges issue, provides context without excuses, 
│         offers to make right, signed by owner for weight]
│
└── Review intelligence:
    │
    ├── Monthly analysis:
    │   "Review Summary - November:
    │    ├── New reviews: 7 (6 on Google, 1 on Houzz)
    │    ├── Average rating: 4.7 stars
    │    ├── Response rate: 100% within 24 hours
    │    │
    │    ├── Positive themes mentioned:
    │    │   ├── Communication: 6 mentions ⬆️
    │    │   ├── Quality: 5 mentions
    │    │   ├── Cleanliness: 4 mentions
    │    │   └── On-time: 3 mentions
    │    │
    │    ├── Concerns mentioned:
    │    │   └── Timeline: 1 mention (addressed)
    │    │
    │    └── Recommendation:
    │        Communication praise is up since implementing weekly 
    │        update emails. Continue this practice and consider 
    │        mentioning it in marketing."
    │
    └── Competitive benchmarking:
        "Your Google rating: 4.8 (47 reviews)
         Top competitor A: 4.6 (112 reviews)
         Top competitor B: 4.9 (23 reviews)
         
         You're winning on rating but competitor A has volume advantage.
         Recommend implementing review request automation to increase 
         review velocity."
```

```
REVIEW GENERATION SYSTEM
│
├── Trigger: Project marked complete + 7 days
│
├── Client happiness check:
│   │
│   │  First: Internal assessment
│   │  ├── Any unresolved issues?
│   │  ├── Final walkthrough notes positive?
│   │  ├── Payment completed without dispute?
│   │  └── PM assessment: Would they recommend?
│   │
│   │  If concerns exist → Don't request review yet
│   │                    → Flag for owner follow-up first
│   │
│   └── If all clear → Proceed with request
│
├── Review request sequence:
│   │
│   │  Day 7 - Initial request (email):
│   │  Subject: "How did we do on your [project type]?"
│   │  
│   │  "Hi [Name],
│   │   
│   │   Now that you've had a week to settle into your new 
│   │   [kitchen/bathroom/etc.], we'd love to hear how we did.
│   │   
│   │   Your feedback helps other homeowners find contractors 
│   │   they can trust—and helps us keep improving.
│   │   
│   │   Would you take 2 minutes to share your experience?
│   │   
│   │   [LEAVE A GOOGLE REVIEW] ← big button, direct link
│   │   
│   │   Either way, thank you for trusting us with your home.
│   │   
│   │   - Mike"
│   │
│   │  Day 14 - Follow-up (if no review):
│   │  Text message:
│   │  "Hi [Name], it's Mike from [Company]. Hope you're enjoying 
│   │   the new [space]! If you have a minute, a quick Google 
│   │   review would mean a lot to us: [short link]"
│   │
│   │  Day 21 - Final attempt (if no review):
│   │  Personal email from owner, slightly different angle
│   │
│   └── After 3 attempts → Stop asking, respect their choice
│
├── Review steering (ethical):
│   │
│   │  Link directly to Google review page (reduce friction)
│   │  
│   │  For clients who mentioned loving specific aspects:
│   │  "Your comment about how clean we kept the job site really 
│   │   made our day. If you mention that in a review, it helps 
│   │   other homeowners know what to expect!"
│   │  
│   │  Never:
│   │  ├── Offer incentives for reviews
│   │  ├── Ask for specific star rating
│   │  └── Filter who you ask based on expected rating
│   │
│   └── Do diversify platforms:
│       "We noticed you're active on Houzz—would you consider 
│        leaving your review there? [Houzz link]"
│
└── Track results:
    ├── Request-to-review conversion rate
    ├── Which message versions work best
    ├── Optimal timing for requests
    └── Which clients become repeat reviewers/referrers
```

---

## Deep Dive: Lead Agent

**Lead Response & Qualification:**

```
NEW LEAD DETECTED
│
├── Sources monitored:
│   ├── Website contact form
│   ├── Google Business messages
│   ├── Facebook/Instagram DMs
│   ├── Houzz inquiries
│   ├── HomeStars/Angi leads
│   ├── Email (info@ or estimator@)
│   ├── Phone (transcribed voicemails)
│   ├── Text messages
│   ├── Referral notifications
│   └── Chat widget
│
├── Lead capture and enrichment:
│   │
│   │  Raw lead:
│   │  "Hi, we're looking to renovate our kitchen. Probably looking 
│   │   to start in the spring. Can you give us a rough idea of cost 
│   │   for a full gut reno? Thanks, Sarah"
│   │  Source: Website form
│   │  Email: sarah.j@email.com
│   │  Phone: 905-555-0142
│   │  Address: [not provided]
│   │
│   │  Enrichment:
│   │  ├── Email lookup: Sarah Johnson
│   │  ├── Phone area code: Oakville region ✓ (service area)
│   │  ├── Check existing database: New contact
│   │  ├── LinkedIn (if B2B relevant): N/A
│   │  └── Property data: Need address to pull
│   │
│   │  Lead scoring:
│   │  ├── Project type: Kitchen (high value) +3
│   │  ├── Timeline: Spring (2-4 months out) +2
│   │  ├── Scope: "Full gut" (large project) +3
│   │  ├── Source: Direct website (high intent) +2
│   │  ├── Communication: Professional, clear +1
│   │  └── Score: 11/15 = HOT LEAD
│   │
│   └── Response urgency: IMMEDIATE (<15 min for hot leads)
│
├── Response generation:
│   │
│   │  "Hi Sarah,
│   │   
│   │   Thanks for reaching out! A full kitchen renovation is a big 
│   │   project—exciting to plan, and we'd love to help you think 
│   │   through it.
│   │   
│   │   To give you a meaningful estimate, I'd need to see your 
│   │   current space and understand your goals. Kitchen gut renos 
│   │   in Oakville typically range from $60,000 to $150,000+ 
│   │   depending on size, layout changes, and finishes.
│   │   
│   │   Here's a recent project that might give you a sense of 
│   │   what's possible: [link to similar case study]
│   │   
│   │   Could we set up a quick call or site visit? I have 
│   │   availability:
│   │   • Thursday at 10am or 2pm
│   │   • Friday at 9am
│   │   • Saturday at 11am
│   │   
│   │   Or if another time works better, just let me know.
│   │   
│   │   Looking forward to learning more about your vision!
│   │   
│   │   Mike
│   │   [Company] | 905-555-0100
│   │   [Link to portfolio]"
│   │
│   │  Response tailored based on:
│   │  ├── Project type mentioned → relevant case study
│   │  ├── Timeline → appropriate urgency
│   │  ├── Question asked → direct answer + next step
│   │  └── Tone of inquiry → match their style
│   │
│   └── [SEND] [EDIT] [ASSIGN TO HUMAN]
│
├── Lead nurturing (if not ready to meet):
│   │
│   │  "Thanks! We're still in early planning stages. Not ready 
│   │   to meet yet but wanted to start gathering information."
│   │
│   │  Response:
│   │  "Totally understand—early research is smart! 
│   │   
│   │   Here are a few resources that might help:
│   │   • Kitchen Renovation Planning Guide [PDF]
│   │   • What to Expect: Timeline and Process [blog link]
│   │   • Recent Kitchen Projects [portfolio link]
│   │   
│   │   I'll check back in a month or so. In the meantime, feel 
│   │   free to reach out anytime with questions."
│   │
│   │  Nurture sequence activated:
│   │  ├── Week 2: "Thought you might like this kitchen we just finished"
│   │  ├── Week 4: "Kitchen planning tip: Here's how to budget for surprises"
│   │  ├── Week 6: "Spring is booking up—want to get on the calendar?"
│   │  ├── Week 8: Check-in: "How's the planning going?"
│   │  └── Monthly thereafter until engaged or unsubscribed
│   │
│   └── Each touch personalized to their project type and interests
│
└── Lead qualification tracking:
    │
    ├── Capture through conversation:
    │   ├── Budget range
    │   ├── Decision timeline
    │   ├── Decision makers (spouse involvement?)
    │   ├── Must-haves vs nice-to-haves
    │   ├── Previous contractor experiences
    │   └── How they found you
    │
    ├── Disqualification (respectful):
    │   │
    │   │  Budget way under realistic:
    │   │  "I appreciate you sharing that budget. To be honest, 
    │   │   a full gut kitchen reno at that price point would be 
    │   │   very difficult to do well. 
    │   │   
    │   │   A few options:
    │   │   • Refinishing vs replacing cabinets ($15-25k)
    │   │   • Phased approach over 2-3 years
    │   │   • Focus on highest-impact changes first
    │   │   
    │   │   Want me to send some ideas for maximizing a tighter budget?"
    │   │
    │   │  Outside service area:
    │   │  "Unfortunately, [location] is outside our service area. 
    │   │   I'd recommend checking [competitor who serves that area] 
    │   │   or HomeStars for contractors near you."
    │   │
    │   └── Wrong fit logged for pattern analysis
    │
    └── Handoff to human:
        │
        │  When lead is qualified and ready:
        │  "Hot lead ready for call:
        │   
        │   Sarah Johnson - Kitchen gut renovation
        │   Budget: $80-100k (qualified)
        │   Timeline: Spring start (March-April)
        │   Address: 123 Oak Street, Oakville
        │   Decision makers: Sarah + husband (both available weekends)
        │   
        │   Key notes:
        │   - Wants open concept (wall removal likely)
        │   - Loved the Chen kitchen case study
        │   - Previous contractor ghosted them mid-project (!)
        │   - Prioritizes communication and reliability
        │   
        │   Meeting scheduled: Saturday 11am
        │   [Add to calendar] [View full conversation]"
        │
        └── All context transferred so human walks in prepared
```

---

## Deep Dive: SEO Agent

```
ONGOING SEO MANAGEMENT
│
├── Technical monitoring (daily):
│   │
│   │  Site health checks:
│   │  ├── Crawl errors detected? → Alert + fix if possible
│   │  ├── Page speed changes? → Identify cause
│   │  ├── Mobile usability issues? → Flag for dev
│   │  ├── Security issues? → URGENT alert
│   │  └── Indexing problems? → Diagnose and recommend
│   │
│   │  Automated fixes:
│   │  ├── Broken links → Find and suggest replacements
│   │  ├── Missing meta descriptions → Generate and implement
│   │  ├── Image alt text missing → Generate descriptive alts
│   │  └── Schema markup → Ensure all pages properly marked up
│   │
│   └── Monthly technical report:
│       "Site Health: 94/100 (up from 91)
│        - Fixed: 3 broken links
│        - Fixed: 12 missing alt tags
│        - Improved: Core Web Vitals on mobile
│        - Issue: Blog page loading slow (large images)
│          → Recommendation: Implement lazy loading"
│
├── Keyword tracking (weekly):
│   │
│   │  Track rankings for target keywords:
│   │  ├── "general contractor oakville" - #4 (↑1)
│   │  ├── "kitchen renovation oakville" - #7 (↑2)
│   │  ├── "basement finishing contractor" - #12 (↓3) ⚠️
│   │  ├── "home addition contractor gta" - #18 (→)
│   │  └── [50+ keywords tracked]
│   │
│   │  Alert on significant changes:
│   │  "⚠️ 'basement finishing contractor' dropped 3 positions.
│   │   
│   │   Analysis:
│   │   - Competitor [name] published new basement content
│   │   - Our basement page hasn't been updated in 8 months
│   │   - Missing: recent project photos, current pricing
│   │   
│   │   Recommendation:
│   │   1. Update basement service page with Chen project
│   │   2. Add FAQ section (addresses common questions)
│   │   3. Create supporting blog post: 'Basement Renovation 
│   │      Cost in [City] 2025'
│   │   
│   │   [CREATE CONTENT BRIEF] [ADD TO QUEUE] [IGNORE]"
│   │
│   └── Opportunity identification:
│       "New keyword opportunity detected:
│        'aging in place contractor oakville' - 90 searches/mo
│        
│        No current competitors ranking well.
│        
│        You've completed 3 accessibility-focused projects.
│        
│        Recommend creating service page + blog content.
│        Estimated traffic gain: 50-100 visits/month.
│        
│        [CREATE THIS] [MORE INFO]"
│
├── Local SEO (ongoing):
│   │
│   │  Google Business Profile optimization:
│   │  ├── Weekly posts (auto-generated from content)
│   │  ├── Photo uploads (from project completions)
│   │  ├── Q&A monitoring and responses
│   │  ├── Service/product updates
│   │  └── Review response (covered by Reputation Agent)
│   │
│   │  Citation management:
│   │  ├── Monitor NAP consistency across directories
│   │  ├── Claim new listings when they appear
│   │  ├── Update changed information everywhere
│   │  └── Build new citations strategically
│   │
│   │  Local content:
│   │  ├── Neighborhood-specific pages
│   │  │   "Kitchen Renovations in Oakville"
│   │  │   "Basement Finishing in Mississauga"
│   │  │   [With local project examples]
│   │  │
│   │  └── Local link building:
│   │      ├── Local business associations
│   │      ├── Chamber of commerce
│   │      ├── Community sponsorships
│   │      └── Local news/blog opportunities
│   │
│   └── Competitor monitoring:
│       "Competitor [name] now ranking #2 for 'bathroom renovation oakville'
│        
│        What they did:
│        - New service page (2,400 words vs your 800)
│        - Added 6 recent project photos
│        - Video testimonial embedded
│        - FAQ schema markup
│        
│        To reclaim position:
│        [CONTENT BRIEF GENERATED]"
│
└── Reporting (monthly):
    │
    │  SEO Performance Report - November:
    │  
    │  Organic Traffic:
    │  ├── Sessions: 2,847 (↑12% MoM)
    │  ├── Users: 2,341 (↑15% MoM)
    │  └── Avg position: 14.2 (↑ from 15.8)
    │  
    │  Top performing pages:
    │  ├── /kitchen-renovation - 456 sessions
    │  ├── /portfolio/chen-kitchen - 234 sessions
    │  ├── /blog/renovation-costs-2025 - 198 sessions
    │  
    │  Conversions from organic:
    │  ├── Form submissions: 23 (↑8 from last month)
    │  ├── Phone calls: 31 (↑5)
    │  └── Estimated value: $12,400 (based on close rate)
    │  
    │  Recommendations for next month:
    │  1. Update bathroom service page (competitor gap)
    │  2. Build links from 2 local publications identified
    │  3. Create "renovation permits [city]" content (opportunity)
    │
    └── [APPROVE PLAN] [ADJUST] [DISCUSS]
```

---

## Deep Dive: Paid Ads Agent

```
CAMPAIGN MANAGEMENT
│
├── Google Ads:
│   │
│   │  Account structure:
│   │  ├── Campaign: Kitchen Renovations
│   │  │   ├── Ad Group: Kitchen Remodel [Exact]
│   │  │   ├── Ad Group: Kitchen Renovation [Exact]
│   │  │   ├── Ad Group: Kitchen Contractor [Exact]
│   │  │   └── Ad Group: Kitchen [Broad Modified]
│   │  │
│   │  ├── Campaign: Basement Finishing
│   │  ├── Campaign: Bathroom Renovations
│   │  ├── Campaign: General Contractor [Brand]
│   │  └── Campaign: Competitor Conquest
│   │
│   │  Daily management:
│   │  ├── Budget pacing check
│   │  │   "Kitchen campaign at 87% of daily budget by 2pm.
│   │  │    Recommend increasing daily budget from $50 to $65
│   │  │    to capture evening searches."
│   │  │
│   │  ├── Search term review
│   │  │   "New converting search term: 'custom kitchen island builder'
│   │  │    Added to Kitchen Remodel ad group.
│   │  │    
│   │  │    New negative: 'kitchen renovation tv show'
│   │  │    Added to negative list."
│   │  │
│   │  ├── Bid adjustments
│   │  │   "Mobile bids decreased 15% - lower conversion rate
│   │  │    Desktop bids increased 10% - higher close rate
│   │  │    Saturday bids increased 20% - best performing day"
│   │  │
│   │  └── Ad testing
│   │      "New ad variant outperforming control:
│   │       'Award-Winning Kitchen Renovations' - 4.2% CTR
│   │       vs 'Kitchen Renovation Experts' - 3.1% CTR
│   │       
│   │       Pausing underperformer, creating new test variant."
│   │
│   │  Automated rules:
│   │  ├── Pause keywords with CPA > $200 after 100 clicks
│   │  ├── Increase bids on keywords with CPA < $100
│   │  ├── Alert if daily spend exceeds 120% of budget
│   │  └── Pause campaigns if conversion tracking breaks
│   │
│   └── Monthly optimization:
│       "November Google Ads Report:
│        
│        Spend: $2,340
│        Clicks: 892
│        Conversions: 34 (leads)
│        CPA: $68.82
│        
│        Best performers:
│        - 'kitchen renovation oakville' - 8 leads, $52 CPA
│        - 'basement contractor' - 6 leads, $61 CPA
│        
│        Underperformers paused:
│        - 'home renovation ideas' - 0 leads, $180 spent
│        - 'contractor near me' - 1 lead, $156 CPA
│        
│        Recommendations:
│        1. Shift $300/mo from General to Kitchen (better ROI)
│        2. Test Local Services Ads (pay per lead)
│        3. Add retargeting campaign for site visitors"
│
├── Meta Ads (Facebook/Instagram):
│   │
│   │  Campaign structure:
│   │  ├── Prospecting - Lookalike audiences
│   │  ├── Prospecting - Interest targeting
│   │  ├── Retargeting - Website visitors
│   │  ├── Retargeting - Engaged followers
│   │  └── Remarketing - Past clients (referral)
│   │
│   │  Creative management:
│   │  ├── Auto-generate new ad variants from project content
│   │  │   "New Chen kitchen photos available.
│   │  │    Created 3 ad variants:
│   │  │    - Carousel: Before/After transformation
│   │  │    - Video: 15-sec transformation timelapse
│   │  │    - Static: Hero after shot with testimonial"
│   │  │
│   │  ├── Performance-based rotation
│   │  │   "Video ads outperforming static by 40% on CPL.
│   │  │    Shifting budget allocation."
│   │  │
│   │  └── Fatigue monitoring
│   │      "Kitchen carousel ad frequency hitting 3.2.
│   │       Refreshing creative to prevent fatigue."
│   │
│   │  Audience refinement:
│   │  ├── Build lookalikes from converted leads
│   │  ├── Exclude recent converters
│   │  ├── Layer demographics (homeowners, income, age)
│   │  └── Test new interest combinations
│   │
│   └── Lead form optimization:
│       "Testing shorter form (name + phone only) vs full form.
│        Shorter form: 3x submissions, but 40% lower quality.
│        Recommendation: Keep full form, quality over quantity."
│
└── Cross-channel attribution:
    │
    │  Customer journey analysis:
    │  "Typical conversion path (leads who became clients):
    │   
    │   1. First touch: Google Ad (67%) or Social (23%)
    │   2. Research: 3-4 website visits over 2 weeks
    │   3. Content consumed: Portfolio, reviews, blog
    │   4. Conversion: Contact form (direct or retargeted)
    │   
    │   Average: 28 days from first touch to lead
    │   
    │   Insight: Social rarely converts directly but assists
    │   67% of Google conversions. Don't cut social budget."
    │
    └── Budget allocation recommendation:
        "Based on attributed revenue:
         
         Current allocation → Recommended:
         - Google: $2,500 → $2,800 (highest direct ROI)
         - Meta: $1,200 → $1,000 (assist value, not direct)
         - Retargeting: $300 → $500 (highest close rate)
         
         [APPLY CHANGES] [KEEP CURRENT] [DISCUSS]"
```

---

## Orchestration: The Marketing Brain

How all agents work together:

```
WEEKLY MARKETING SYNC (automated)
│
├── Performance dashboard generated:
│   │
│   │  Week of Nov 15-21:
│   │  
│   │  LEADS:
│   │  ├── Total: 28 (+4 from last week)
│   │  ├── Sources:
│   │  │   ├── Google Ads: 12
│   │  │   ├── Organic: 8
│   │  │   ├── Social: 4
│   │  │   ├── Referral: 3
│   │  │   └── Direct: 1
│   │  ├── Qualified: 19 (68%)
│   │  └── Meetings booked: 14
│   │
│   │  CONTENT:
│   │  ├── Published: 2 blog posts, 14 social posts, 1 email
│   │  ├── Engagement: 12% above avg
│   │  ├── Top performer: Kitchen transformation reel (42k views)
│   │  └── Content queue: 8 items ready
│   │
│   │  REPUTATION:
│   │  ├── New reviews: 3 (all 5-star)
│   │  ├── Avg rating: 4.8 (stable)
│   │  └── Response rate: 100%
│   │
│   │  SEO:
│   │  ├── Organic traffic: ↑8%
│   │  ├── Keyword gains: 4 moved to page 1
│   │  └── Issues: 0 critical
│   │
│   │  SPEND:
│   │  ├── Ads: $1,847 (under budget)
│   │  ├── Cost per lead: $71.42
│   │  └── Estimated pipeline value: $180,000
│   │
│   └── Week's highlights reel:
│       [Auto-generated 60-sec video summary for owner]
│
├── Cross-agent coordination:
│   │
│   │  Content → Social:
│   │  "New case study published. Social Agent: schedule
│   │   promotion sequence across platforms."
│   │
│   │  Lead → Content:
│   │  "High lead interest in basement renovations this month.
│   │   Content Agent: prioritize basement content in queue."
│   │
│   │  Reputation → Social:
│   │  "New 5-star review received. Social Agent: create
│   │   testimonial graphic for sharing."
│   │
│   │  SEO → Content:
│   │  "'bathroom renovation cost' dropping in rankings.
│   │   Content Agent: update bathroom pricing blog post."
│   │
│   │  Paid → Content:
│   │  "Kitchen ads performing best. Content Agent: create
│   │   more kitchen-focused content for organic support."
│   │
│   └── All agents share:
│       ├── Brand voice guidelines
│       ├── Current promotions/messaging
│       ├── Project database
│       └── Performance learnings
│
└── Owner briefing (Monday 7am):
    │
    │  "Good morning Mike,
    │   
    │   Here's your marketing week in 60 seconds:
    │   
    │   🎯 28 leads last week (best week this month)
    │   📈 Kitchen reel went semi-viral (42k views)
    │   ⭐ 3 new 5-star reviews  
    │   💰 $71 cost per lead (target: $80)
    │   
    │   This week's focus:
    │   - Publishing Chen kitchen case study Tuesday
    │   - Basement content push (high lead interest)
    │   - Following up with 6 warm leads from last week
    │   
    │   Decisions needed:
    │   1. Approve $500 budget increase for Google? [Y/N]
    │   2. Feature client testimonial video? [PREVIEW]
    │   3. Sponsor local home show booth? [DETAILS]
    │   
    │   Full dashboard: [link]
    │   
    │   Have a great week!"
    │
    └── [Voice version available for commute listening]
```

---

## Economics

**Traditional Marketing Team:**
- Marketing Manager: $75,000
- Content Creator: $55,000
- Social Media Manager: $50,000
- SEO Specialist: $65,000
- Part-time Designer: $25,000
- Paid Ads Management: $2,000/mo agency fee

**Total: ~$294,000/year** (plus benefits, management overhead)

**Agent Marketing Team:**
- Infrastructure: $200-400/month
- API costs (heavy content generation): $500-1,000/month
- Ad spend: Separate (same either way)
- Human oversight (owner review): 2-3 hrs/week
- Total: ~$8,400-16,800/year

**85-95% cost reduction**

**But the real comparison is:**

Most contractors have **nobody** doing this consistently.

They post sporadically, respond to reviews late, miss leads, never blog, run inefficient ads.

This system does everything a $300k team would do, consistently, 24/7, for under $1,500/month.

---

## What You'd Actually Build (Phases)

**Phase 1: Lead Response + Reputation (~$300/mo)**
- Instant lead response (biggest ROI)
- Review monitoring and response
- Basic CRM integration

**Phase 2: Add Social (~$500/mo)**
- Automated posting
- Engagement management
- Content queue from projects

**Phase 3: Add Content Engine (~$800/mo)**
- Case study generation
- Blog content
- Email campaigns

**Phase 4: Add SEO + Paid (~$1,200/mo)**
- Keyword tracking and recommendations
- Ad campaign management
- Full attribution

**Phase 5: Full Integration (~$1,500/mo)**
- Cross-agent coordination
- Predictive recommendations
- Complete marketing autopilot

---

This is essentially a vertical SaaS opportunity. You could build this for contractors, then template it for other trades (plumbers, electricians, roofers, landscapers—all have identical needs).

$500-1,500/month per contractor × 100 contractors = $50-150k MRR

Want me to go deeper on any specific agent, or sketch the technical architecture for Phase 1?

here are additional detiails: https://platform.claude.com/docs/en/agent-sdk/overview https://github.com/anthropics/claude-agent-sdk-demos/tree/main https://github.com/anthropics/claude-code https://github.com/anthropics/claude-cookbooks