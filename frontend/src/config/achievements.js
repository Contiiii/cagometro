export const ACHIEVEMENTS = [
  {
  id: "prima-cacca",
  title: "Prima Cacca",
  description: "Registra la tua prima missione",
  icon: "💩",
  type: "total",
  target: 1,
  xp: 50,
},
{
  id: "abitudinario",
  title: "Abitudinario",
  description: "Raggiungi 10 registrazioni totali",
  icon: "🔥",
  type: "total",
  target: 10,
  xp: 100,
},
{
  id: "veterano",
  title: "Veterano",
  description: "Raggiungi 100 registrazioni totali",
  icon: "🏆",
  type: "total",
  target: 100,
  xp: 250,
},
{
  id: "costante",
  title: "Costante",
  description: "Ottieni una streak di 7 giorni",
  icon: "📅",
  type: "streak",
  target: 7,
  xp: 150,
},
{
  id: "leggenda",
  title: "Leggenda",
  description: "Ottieni una streak di 30 giorni",
  icon: "👑",
  type: "streak",
  target: 30,
  xp: 500,
},
];

export function getAchievementProgress(achievement, statistics) {
  if (achievement.type === "total") {
    return statistics.total;
  }

  if (achievement.type === "streak") {
    return statistics.streak;
  }

  return 0;
}

export const TEAM_ACHIEVEMENTS = [
  {
    id: "first-team",
    title: "Prima squadra",
    description: "Crea o entra nella tua prima squadra",
    icon: "🏅",
    target: 1,
  },
  {
    id: "weekly-100",
    title: "100 punti settimana",
    description: "Raggiungi 100 punti settimanali come squadra",
    icon: "🔥",
    target: 100,
  },
  {
    id: "lifetime-500",
    title: "500 punti storico",
    description: "Accumula 500 punti totali",
    icon: "⚡",
    target: 500,
  },
  {
    id: "lifetime-1000",
    title: "1000 punti storico",
    description: "Accumula 1000 punti totali",
    icon: "🏆",
    target: 1000,
  },
  {
    id: "ten-members",
    title: "Squadra al completo",
    description: "Raggiungi 10 membri attivi",
    icon: "👥",
    target: 10,
  },
  {
    id: "goal-completed",
    title: "Obiettivo completato",
    description: "Completa l'obiettivo settimanale della squadra",
    icon: "🎯",
    target: 1,
  },
];