import { BarChart3, CalendarDays, Settings, Smartphone, UsersRound, Zap } from "lucide-react";

export const APP_VERSION = __APP_VERSION__;

export const RELEASE_NOTES = [
  {
    version: APP_VERSION,
    date: "2026-09-14",
    features: [
      {
        id: "perf-1",
        title: "App molto più veloce",
        description: "Ottimizzate schermate e caricamenti: tutto risponde prima.",
        icon: Zap,
      },
      {
        id: "pwa-1",
        title: "Installabile come app",
        description: "Aggiungi Cagometro alla schermata home: si apre a schermo intero e resta disponibile anche offline.",
        icon: Smartphone,
      },
      {
        id: "report-week-1",
        title: "Scorri tra le settimane nel report!",
        description:
          "Nel report puoi navigare anche tra le settimane, proprio come per i mesi!",
        icon: CalendarDays,
      },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-09-13",
    features: [
      {
        id: "teams-0",
        title: "Aggiunta schermata di login!",
        description: "È stata aggiunta una nuova schermata per il login!",
        icon: UsersRound,
      },
      {
        id: "teams-1",
        title: "Nuova classifica!",
        description:
          "Ora nella nuova classifica sotto al tuo nome ci saranno anche i tuoi XP e la tua streak!",
        icon: UsersRound,
      },
      {
        id: "teams-2",
        title: "Nuovo design della classifica!",
        description:
          "Ora i primi 3 della classifica del proprio team avranno un titolo speciale!",
        icon: UsersRound,
      },
      {
        id: "teams-3",
        title: "Schermata di accesso da link!",
        description:
          "Nuova schermata di accesso ai team quando si entra con il link! È stata aggiunta l'opzione per disattivare il codice di invito.",
        icon: UsersRound,
      },
      {
        id: "teams-4",
        title: "Nuova card di spiegazione quando si crea una squadra!",
        description:
          "Nuova schermata che ti spiega come funzionano le squadre non appena ne crei una!",
        icon: UsersRound,
      },
      {
        id: "reports-1",
        title: "Share report migliorati",
        description:
          "Nuovo design per lo share dei report e nuove animazioni per gli achievements!",
        icon: BarChart3,
      },
      {
        id: "reports-2",
        title: "Periodo in tre righe",
        description: "Nuovo design per la sezione periodo in tre righe!",
        icon: BarChart3,
      },
      {
        id: "reports-3",
        title: "Grafici modificati!",
        description:
          "I grafici della settimana e del totale sono stati modificati! Ora rappresenteranno rispettivamente dal lunedì alla domenica e almeno 3 grafici anche se nulli!",
        icon: BarChart3,
      },
      {
        id: "reports-4",
        title: "Nuovo Popup!",
        description: "Nuovo popup motivazionale ad ogni registrazione!",
        icon: BarChart3,
      },
      {
        id: "settings-1",
        title: "Aggiunto cambio stile applicazione",
        description:
          "Aggiunta la selezione dello stile dell'applicazione nelle impostazioni!",
        icon: Settings,
      },
      {
        id: "settings-2",
        title: "Implementata la schermata delle impostazioni!",
        description: "Implementata la schermata delle impostazioni!",
        icon: Settings,
      },
    ],
  },
];

export const RELEASE_FEATURES = RELEASE_NOTES[0].features;
