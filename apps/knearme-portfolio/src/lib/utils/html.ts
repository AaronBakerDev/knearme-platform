export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function sanitizeHref(value?: string | null): string {
  const trimmed = (value || '').trim()
  if (!trimmed) return '#'
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return trimmed

  try {
    const parsed = new URL(trimmed, 'https://example.com')
    const protocol = parsed.protocol.toLowerCase()
    if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'tel:') {
      return trimmed
    }
  } catch {
    return '#'
  }

  return '#'
}
