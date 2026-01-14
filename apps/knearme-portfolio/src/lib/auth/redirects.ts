export function buildAuthCallbackUrl(origin: string, nextPath: string): string {
  const encodedNext = encodeURIComponent(nextPath);
  return `${origin}/auth/callback?next=${encodedNext}`;
}
