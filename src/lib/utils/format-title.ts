/**
 * Format a project title for display.
 * Ensures consistent capitalization and removes extra whitespace.
 *
 * @param title - Raw title string
 * @returns Formatted title
 *
 * @example
 * formatProjectTitle("  chimney REPAIR in denver  ")
 * // Returns: "Chimney Repair In Denver"
 */
export function formatProjectTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }

  return title
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncate a title to a maximum length with ellipsis.
 *
 * @param title - Title to truncate
 * @param maxLength - Maximum length (default: 60)
 * @returns Truncated title
 */
export function truncateTitle(title: string, maxLength = 60): string {
  if (!title || title.length <= maxLength) {
    return title || '';
  }
  return title.slice(0, maxLength - 3).trim() + '...';
}
