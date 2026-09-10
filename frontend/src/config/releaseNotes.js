import {
  BarChart3,
  Settings,
  UsersRound,
} from "lucide-react";

export const APP_VERSION = "1.8.2";

export const RELEASE_FEATURES = [
  {
    id: "teams",
    title: "Nuova classifica!",
    description:
      "Ora nella nuova classifica sotto al tuo nome ci saranno anche i tuoi XP e la tua streak!",
    icon: UsersRound,
  },
  {
    id: "reports",
    title: "Report migliorati",
    description:
      "Nuove metriche, streak e confronti più chiari tra i diversi periodi.",
    icon: BarChart3,
  },
  {
    id: "settings",
    title: "Nuove impostazioni",
    description:
      "Una schermata completamente rinnovata per gestire profilo e stato dell’app.",
    icon: Settings,
  },
];