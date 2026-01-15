/**
 * Determines if a color is "dark" (low luminance).
 * Used for auto-contrast text color selection.
 *
 * @param color - CSS color value (hex, hsl, rgb, or CSS variable)
 * @returns true if color luminance < 0.5
 */
export function isColorDark(color: string): boolean {
  if (!color) return false

  const normalized = color.trim().toLowerCase()

  // Handle CSS variables - can't compute, assume light for safety
  if (normalized.startsWith('var(') || normalized.startsWith('hsl(var(')) {
    return false
  }

  // Handle transparent/none
  if (normalized === 'transparent' || normalized === 'none') {
    return false
  }

  let r = 0
  let g = 0
  let b = 0
  let parsed = false

  // Parse hex
  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1)
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
      parsed = true
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
      parsed = true
    }
  }

  // Parse rgb/rgba
  const rgbMatch = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    r = parseInt(rgbMatch[1], 10)
    g = parseInt(rgbMatch[2], 10)
    b = parseInt(rgbMatch[3], 10)
    parsed = true
  }

  // Parse hsl/hsla
  const hslMatch = normalized.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?/)
  if (hslMatch) {
    const lightness = Number(hslMatch[3])
    return lightness < 50
  }

  if (!parsed) return false

  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}
