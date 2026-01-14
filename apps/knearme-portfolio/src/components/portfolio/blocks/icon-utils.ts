/**
 * Maps icon names to emoji fallbacks.
 * In a production app, this could be replaced with a proper icon library.
 */
export function getIconEmoji(iconName: string): string {
  const iconMap: Record<string, string> = {
    brick: '🧱',
    tools: '🛠️',
    clock: '⏰',
    hammer: '🔨',
    wrench: '🔧',
    home: '🏠',
    building: '🏢',
    check: '✅',
    star: '⭐',
    fire: '🔥',
    stone: '🪨',
    water: '💧',
    shield: '🛡️',
    award: '🏆',
    calendar: '📅',
    location: '📍',
    phone: '📞',
    email: '📧',
  };

  return iconMap[iconName.toLowerCase()] || '📌';
}
