import type { SharedProjectState } from '../types';

export function resolveLocationParts(
  state: Partial<SharedProjectState>
): { city?: string; state?: string } {
  const city = state.city?.trim();
  const stateCode = state.state?.trim();
  if (city || stateCode) {
    return { city, state: stateCode };
  }
  if (state.location) {
    return parseLocationString(state.location);
  }
  return {};
}

export function parseLocationString(location: string): { city?: string; state?: string } {
  const trimmed = location.trim();
  if (!trimmed) return {};

  const commaMatch = trimmed.match(/^([^,]+),\s*([A-Z]{2,})$/);
  if (commaMatch?.[1] && commaMatch?.[2]) {
    return {
      city: commaMatch[1].trim(),
      state: commaMatch[2].trim(),
    };
  }

  const spaceMatch = trimmed.match(/^(.+)\s+([A-Z]{2})$/);
  if (spaceMatch?.[1] && spaceMatch?.[2]) {
    return {
      city: spaceMatch[1].trim(),
      state: spaceMatch[2].trim(),
    };
  }

  return { city: trimmed };
}
