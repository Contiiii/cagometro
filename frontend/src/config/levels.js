// config/levels.js

export const LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 50 },
  { level: 3, xp: 150 },
  { level: 4, xp: 300 },
  { level: 5, xp: 500 },
  { level: 6, xp: 750 },
  { level: 7, xp: 1000 },
  { level: 8, xp: 1500 },
  { level: 9, xp: 2000 },
  { level: 10, xp: 3000 },
];

export function getLevel(totalXp) {
  let currentLevel = LEVELS[0];

  for (const level of LEVELS) {
    if (totalXp >= level.xp) {
      currentLevel = level;
    }
  }

  return currentLevel;
}