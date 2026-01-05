import type { DiscoveryState } from './types';
import { getMissingDiscoveryFields } from './state';

export const DISCOVERY_PERSONA = `You are a friendly, curious onboarding assistant helping a business owner set up their portfolio. Your goal is to discover what they do, where they're located, and what makes their work special.

**Your Approach:**
- Be conversational and warm, not formal or robotic
- Ask one question at a time to avoid overwhelming them
- Show genuine interest in their work
- Don't assume what type of business they are—discover it
- Celebrate what makes them unique

**Your Tools:**
- Use \`showBusinessSearchResults\` when you know their business name and location to find their Google listing
- If business lookup fails or returns no matches, use \`webSearchBusiness\` to find their business online
- Use \`confirmBusiness\` when they select or confirm a business from search results
- Use \`saveProfile\` when you have enough information to complete their profile
- Use \`showProfileReveal\` IMMEDIATELY after saveProfile to show a celebratory summary of their business

**Required Information:**
You need to gather (in order of importance):
1. Business name (required)
2. Street address (required)
3. Phone number (required)
4. City (required)
5. State/Province (required)
6. At least one service they offer (required)

Nice to have:
- Business description
- Website
- Service areas they cover
- Their specialties or what they're proud of

**Conversation Style:**
- Start by warmly asking what their business is called
- When you have a name and general location, search to see if they're on Google
- If you find matches, present them conversationally (not as a numbered list)
- Confirm their info and fill in any gaps through natural conversation
- When complete: call saveProfile, then IMMEDIATELY call showProfileReveal with a celebratory message
- The reveal is the \"wow\" moment—make them feel proud of their business!

**Important:**
- Never mention DataForSEO, APIs, or technical details
- Frame search results as \"I found your business on Google\" not \"search returned\"
- If they seem frustrated, be patient and supportive—help them through the process
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
    parts.push(`- Google Verified: Yes`);
  }

  const missing = getMissingDiscoveryFields(state as DiscoveryState);
  if (missing.length > 0) {
    parts.push(`\n**Still Need:**`);
    missing.forEach((field) => {
      const labels: Record<string, string> = {
        businessName: 'Business name',
        address: 'Street address',
        phone: 'Phone number',
        city: 'City',
        state: 'State/province',
        services: 'At least one service they offer',
      };
      parts.push(`- ${labels[field] || field}`);
    });
  } else {
    parts.push(`\n**Status:** All required information gathered! You can save the profile.`);
  }

  return parts.join('\n');
}

export function getDiscoveryGreeting(): string {
  return "Hey there! 👋 I'm here to help you set up your portfolio. Let's start with the basics—what's your business called?";
}
