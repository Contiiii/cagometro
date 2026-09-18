import { BarChart3, BellPlus, BellRing, CalendarDays, Palette, RefreshCw, RotateCcw, Settings, Smartphone, TrendingUp, UsersRound, Zap } from "lucide-react";

export const APP_VERSION = __APP_VERSION__;

export const RELEASE_NOTES = [
  {
    version: APP_VERSION,
    date: "2026-09-18",
    features: [
      {
        id: "offline-1",
        title: "Cagometro funziona anche offline",
        description: "La navigazione e l'apertura delle pagine restano disponibili anche senza connessione.",
        icon: Smartphone,
      },
      {
        id: "reliability-1",
        title: "Registrazioni con retry automatico",
        description: "I salvataggi che falliscono per la rete vengono riprovati automaticamente",
        icon: Zap,
      },
      {
        id: "push-1",
        title: "Notifiche sul dispositivo",
        description: "Attiva solo gli avvisi che preferisci: promemoria, streak, traguardi e attività della squadra.",
        icon: BellRing,
      },
      {
        id: "push-2",
        title: "Serie a rischio",
        description: "Se rischi di perdere la tua serie, ti avvisiamo prima che sia troppo tardi.",
        icon: TrendingUp,
      },
      {
        id: "push-3",
        title: "Squadra sempre aggiornata",
        description: "Notifiche quando un membro entra o esce, registra o sblocca un traguardo.",
        icon: UsersRound,
      },
      {
        id: "push-4",
        title: "Notifiche push in tutta l'app",
        description: "Avvisi per promemoria, serie a rischio, traguardi e attività della squadra: consegna più affidabile e apertura diretta della pagina Squadre.",
        icon: BellRing,
      },
      {
        id: "install-1",
        title: "Installa Cagometro in un tocco",
        description: "Nelle Impostazioni puoi aggiungere l'app alla schermata home con il pulsante di installazione.",
        icon: Smartphone,
      },
      {
        id: "loading-1",
        title: "Caricamenti più chiari",
        description: "Mentre i dati arrivano vedi un segnaposto invece di schermate vuote: niente più sfarfallii.",
        icon: Zap,
      },
      {
        id: "retry-1",
        title: "Riprova più trasparente",
        description: "Se qualcosa va storto, il pulsante 'Riprova' ora mostra che sta riprovando.",
        icon: RefreshCw,
      },
      {
        id: "optin-1",
        title: "Notifiche proposte alla prima apertura",
        description: "Alla prima apertura ti proponiamo di attivare le notifiche: in un tap sei pronto.",
        icon: BellPlus,
      },
      {
        id: "push-devices-1",
        title: "Gestisci i tuoi dispositivi",
        description: "Vedi tutti i dispositivi collegati e rimuovi quelli che non usi più.",
        icon: Smartphone,
      },
      {
        id: "team-undo-1",
        title: "Attività squadra sempre aggiornata",
        description: "Se annulli una registrazione, sparisce anche dall'attività della squadra.",
        icon: RotateCcw,
      },
      {
        id: "a11y-1",
        title: "Migliorata la leggibilità",
        description: "Colori e contrasti migliorati su tutta l'app.",
        icon: Palette,
      },
    ],
  },
  {
    version: "2.1.0",
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
