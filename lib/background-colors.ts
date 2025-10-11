export const BACKGROUND_COLORS = {
  white: 'from-gray-50 via-white to-blue-50',
  black: 'from-gray-900 via-black to-gray-900',
  brown: 'from-amber-900 via-amber-950 to-amber-900',
  grey: 'from-gray-400 via-gray-500 to-gray-400',
  red: 'from-red-300 via-red-400 to-red-300',
  orange: 'from-orange-300 via-orange-400 to-orange-300',
  yellow: 'from-yellow-200 via-yellow-300 to-yellow-200',
  green: 'from-green-300 via-green-400 to-green-300',
  blue: 'from-blue-300 via-blue-400 to-blue-300',
  purple: 'from-purple-300 via-purple-400 to-purple-300',
}

export function getBackgroundClass(color?: string | null): string {
  if (!color || !(color in BACKGROUND_COLORS)) {
    return BACKGROUND_COLORS.white
  }
  return BACKGROUND_COLORS[color as keyof typeof BACKGROUND_COLORS]
}

