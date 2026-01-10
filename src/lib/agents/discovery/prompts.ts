import type { DiscoveryState } from './types';
import { getMissingDiscoveryFields } from './state';

/**
 * Discovery Agent Persona - Static System Prompt
 *
 * This prompt is designed for **implicit caching** with Gemini 2.5 Flash.
 * The static persona comes first, followed by dynamic state context.
 * Gemini automatically caches repeated prompt prefixes (90% cost savings).
 *
 * Structure:
 * 1. DISCOVERY_PERSONA (static, ~2.5K tokens) → Cached
 * 2. State context (dynamic, varies) → Not cached
 *
 * @see https://ai.google.dev/gemini-api/docs/caching - Implicit caching
 * @see /src/lib/ai/cache.ts - Cache tracking utilities
 */
export const DISCOVERY_PERSONA = `You are a friendly, curious onboarding assistant helping a business owner set up their portfolio. Your goal is to discover what they do, where they're located, and what makes their work special.

## Voice
Friendly and direct. Like a helpful colleague who texts, not emails.
Keep it brief. One question at a time. Show genuine interest in their work.

## Approach
- Don't assume what type of business they are—discover it
- Celebrate what makes them unique
- If they seem frustrated, be patient and supportive

## When Corrected
If the user corrects you or says you got something wrong:
- Acknowledge briefly ("Got it" / "My bad")
- Don't over-apologize
- Update your understanding and move forward

## Tool Sequence

Call tools in this order as the conversation progresses:

| Step | Tool | When to Call |
|------|------|--------------|
| 1 | \`showBusinessSearchResults\` | You have business name + general location |
| 2 | \`confirmBusiness\` | User selects or confirms a result |
| 3 | \`fetchReviews\` | Immediately after confirmBusiness (pass locationName like "United States" or "Canada") |
| 4 | \`saveProfile\` | All required fields are gathered |
| 5 | \`showProfileReveal\` | Immediately after saveProfile |

**Fallback:** Use \`webSearchBusiness\` only if user says "none of these" and you need to find their business details.

**Never:** Call \`showBusinessSearchResults\` after \`confirmBusiness\`—the user already selected their business.

## Required Information
Gather in order of importance:
1. Business name (required)
2. Phone number (required)
3. City (required)
4. State/Province (required)
5. At least one service (required)

Optional: street address, description, website, service areas, specialties.

## Service Area Businesses
Many businesses work at client locations and don't display their address. If they mention:
- "I don't display my address" / "I work from home" / "I travel to clients"

Just say: "No problem! I just need to know what city you're based out of."
Set \`hideAddress: true\` and skip the address field.

## No Google Listing? No Problem!
If search returns no results or they say "None of these":
- Keep the conversation flowing naturally
- Say: "No worries! Let me get your details directly..."
- Ask for their info through natural conversation
- You can create a great profile without GMB data

## Profile Reveal Data
When calling \`showProfileReveal\`, include ALL available data:
- Basic info: businessName, address, city, state, phone, website, services
- Rating/reviews: rating, reviewCount
- Bio: 2-3 sentences synthesizing reviews + web search
- Highlights: 2-3 short quotes from 5-star reviews (if available)
- Years in business (if discovered)
- Project suggestions (if reviews have photos)

## Completion Rules
- You MUST call \`saveProfile\` before saying "all set", "profile complete", etc.
- Never claim the profile is saved without actually calling \`saveProfile\`
- The reveal is the "wow" moment—make them feel proud!

## Framing
- Say "I found your business on Google" not "search returned"
- Never mention DataForSEO, APIs, or technical details
- Keep responses concise—this isn't an interrogation`;

export function buildDiscoverySystemPrompt(state: Partial<DiscoveryState>): string {
  return `${DISCOVERY_PERSONA}\n\n${buildStateContext(state)}`;
}

function buildStateContext(state: Partial<DiscoveryState>): string {
  const parts: string[] = ['**Current Information Gathered:**'];

  if (state.businessName) parts.push(`- Business Name: ${state.businessName}`);
  if (state.address) parts.push(`- Address: ${state.address}`);
  if (state.phone) parts.push(`- Phone: ${state.phone}`);
  if (state.city) parts.push(`- City: ${state.city}`);
  if (state.state) parts.push(`- State: ${state.state}`);
  if (state.description) parts.push(`- Description: ${state.description}`);
  if (state.services && state.services.length > 0) {
    parts.push(`- Services: ${state.services.join(', ')}`);
  }
  if (state.serviceAreas && state.serviceAreas.length > 0) {
    parts.push(`- Service Areas: ${state.serviceAreas.join(', ')}`);
  }
  if (state.googlePlaceId) {
    parts.push(`- Google Verified: Yes (BUSINESS ALREADY CONFIRMED - do NOT call showBusinessSearchResults again!)`);
  }
  if (state.rating) {
    parts.push(`- Rating: ${state.rating} stars`);
  }
  if (state.reviewCount) {
    parts.push(`- Review Count: ${state.reviewCount}`);
  }

  // Reviews available for bio synthesis
  if (state.reviews && state.reviews.length > 0) {
    parts.push(`\n**Reviews Available (${state.reviews.length}):**`);
    const fiveStarReviews = state.reviews.filter(r => r.rating >= 4.5);
    const reviewsWithPhotos = state.reviews.filter(r => r.hasImages);
    parts.push(`- 5-star reviews: ${fiveStarReviews.length}`);
    parts.push(`- Reviews with photos: ${reviewsWithPhotos.length}`);
    // Show best quotes for the agent to use in the reveal
    const bestQuotes = state.reviews
      .filter(r => r.rating >= 4.5 && r.text && r.text.length > 20 && r.text.length < 200)
      .slice(0, 3);
    if (bestQuotes.length > 0) {
      parts.push(`- Best quotes to use as highlights:`);
      bestQuotes.forEach((r, i) => parts.push(`  ${i + 1}. "${r.text}"`));
    }
  }

  // Web search info for bio synthesis
  if (state.webSearchInfo) {
    parts.push(`\n**Web Search Info:**`);
    if (state.webSearchInfo.aboutDescription) {
      parts.push(`- About: ${state.webSearchInfo.aboutDescription}`);
    }
    if (state.webSearchInfo.website) {
      parts.push(`- Website: ${state.webSearchInfo.website}`);
    }
    if (state.webSearchInfo.phone) {
      parts.push(`- Phone: ${state.webSearchInfo.phone}`);
    }
    if (state.webSearchInfo.address) {
      parts.push(`- Address: ${state.webSearchInfo.address}`);
    }
    if (state.webSearchInfo.city) {
      parts.push(`- City: ${state.webSearchInfo.city}`);
    }
    if (state.webSearchInfo.state) {
      parts.push(`- State: ${state.webSearchInfo.state}`);
    }
    if (state.webSearchInfo.yearsInBusiness) {
      parts.push(`- Years in business: ${state.webSearchInfo.yearsInBusiness}`);
    }
    if (state.webSearchInfo.specialties && state.webSearchInfo.specialties.length > 0) {
      parts.push(`- Specialties: ${state.webSearchInfo.specialties.join(', ')}`);
    }
    if (state.webSearchInfo.serviceAreas && state.webSearchInfo.serviceAreas.length > 0) {
      parts.push(`- Service areas: ${state.webSearchInfo.serviceAreas.join(', ')}`);
    }
  }

  const missing = getMissingDiscoveryFields(state as DiscoveryState);
  if (missing.length > 0) {
    parts.push(`\n**Still Need:**`);
    missing.forEach((field) => {
      const labels: Record<string, string> = {
        businessName: 'Business name',
        phone: 'Phone number',
        city: 'City',
        state: 'State/province',
        services: 'At least one service they offer',
      };
      parts.push(`- ${labels[field] || field}`);
    });
  } else {
    parts.push(`\n**Status:** All required information gathered!`);
    parts.push(`⚠️ ACTION REQUIRED: Call \`saveProfile\` NOW, then \`showProfileReveal\`.`);
  }

  // Note about address preference
  if (state.hideAddress) {
    parts.push(`\n**Note:** Service area business - do NOT display or ask for street address.`);
  }

  return parts.join('\n');
}

export function getDiscoveryGreeting(): string {
  return "Hey there! 👋 I'm here to help you set up your portfolio. Let's start with the basics—what's your business called?";
}
