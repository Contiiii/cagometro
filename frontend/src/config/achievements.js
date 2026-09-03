export const ACHIEVEMENTS = [
  {
    id: "prima-cacca",
    title: "Prima Cacca",
    description: "Registra la tua prima missione",
    icon: "💩",
    type: "total",
    target: 1,
  },
  {
    id: "abitudinario",
    title: "Abitudinario",
    description: "Raggiungi 10 registrazioni totali",
    icon: "🔥",
    type: "total",
    target: 10,
  },
  {
    id: "veterano",
    title: "Veterano",
    description: "Raggiungi 100 registrazioni totali",
    icon: "🏆",
    type: "total",
    target: 100,
  },
  {
    id: "costante",
    title: "Costante",
    description: "Ottieni una streak di 7 giorni",
    icon: "📅",
    type: "streak",
    target: 7,
  },
  {
    id: "leggenda",
    title: "Leggenda",
    description: "Ottieni una streak di 30 giorni",
    icon: "👑",
    type: "streak",
    target: 30,
  },
];

export function getAchievementProgress(
  achievement,
  statistics,
) {
  if (achievement.type === "total") {
    return statistics.total;
  }

  if (achievement.type === "streak") {
    return statistics.streak;
  }

  return 0;
}