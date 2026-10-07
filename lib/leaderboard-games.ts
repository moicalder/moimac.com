export const leaderboardGames = [
  { id: 'mathmode', name: 'MathMode', icon: '🔢' },
  { id: 'snake', name: 'Snake', icon: '🐍' },
  { id: 'typemaster', name: 'TypeMaster', icon: '⌨️' },
  { id: 'starfighter', name: 'Star Fighter', icon: '🚀' },
  { id: 'joyjump', name: 'Joy Jump', icon: '😊' },
] as const

export type LeaderboardGameId = (typeof leaderboardGames)[number]['id']
