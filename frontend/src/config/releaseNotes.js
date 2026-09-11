import {
  BarChart3,
  Settings,
  UsersRound,
} from "lucide-react";

export const APP_VERSION = "1.8.3";

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
    title: "Share eport migliorati",
    description:
      "Nuovo design per lo shere dei report!",
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