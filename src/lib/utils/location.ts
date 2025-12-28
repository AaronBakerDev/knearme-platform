type LocationParts = {
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

function normalizePart(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

export function formatProjectLocation(parts: LocationParts): string | null {
  const seen = new Set<string>();
  const ordered = [parts.neighborhood, parts.city, parts.state];

  const result = ordered
    .map(normalizePart)
    .filter((part) => {
      if (!part) return false;
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return result.length > 0 ? result.join(', ') : null;
}
