<div align="center">

# 💩 CAGOMETRO

### Statistiche serie per momenti poco seri.

Una web app personale per registrare le visite al trono, mantenere viva la streak e conquistare gloriosi achievement da bagno.

![Status](https://img.shields.io/badge/status-v1.0.0-84cc16?style=for-the-badge)
![Mission](https://img.shields.io/badge/missione-sopravvivere%20al%20WC-facc15?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-installabile-pink?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-passing-22c55e?style=adge)

</div>

---

## 🚽 Cos'è?

**Cagometro** registra ogni visita al bagno con un semplice click.

Niente complicazioni cosmiche: un trono, moltissimi dati discutibili e la possibilità di salvarli nel cloud.

## ✨ Funzionalità

- 💩 Registrazione giornaliera con conteggio per data
- ↩️ Riduzione del contatore giornaliero
- 🔥 Streak dei giorni consecutivi e miglior streak
- 📊 Report giornalieri, settimanali, mensili e annuali
- 📈 Grafici a barre (ultima settimana) e a linee (andamento mensile)
- 🏆 Sistema achievement con barre di avanzamento
- 🎉 Popup animati e confetti per gli achievement sbloccati
- 📱 Interfaccia responsive e mobile-first
- 🌙 Dark mode, perché certe missioni avvengono nell'ombra
- ☁️ Login Google e backup cloud tramite Supabase
- 📲 PWA installabile con funzionamento offline
- 🔄 Sincronizzazione automatica dei dati alla riconnessione

## 🗺️ Pagine

```text
/              Home        — Centro operativo del regno
/report        Report      — Statistiche e grafici
/achievement  Traguardi   — Badge e progresso
/settings      Settings    — Account e sincronizzazione
```

### Home

Il centro operativo del regno:

- streak attuale e miglior streak;
- enorme contatore giornaliero;
- enorme pulsante 💩;
- riduzione del contatore con il pulsante annulla;
- notifica cloud backup se non autenticato.

### Report

Statistiche approfondite con grafici Recharts:

- totale storico complessivo;
- conteggio di oggi e ultimi 7 giorni con grafico a barre;
- riepilogo mensile selezionabile con navigazione tra i mesi;
- andamento mensile con grafico a linee;
- ultimo anno e record storico.

### Achievement

Badge gloriosi da conquistare:

- 💩 **Prima Cacca** — Registra la tua prima missione
- 🔥 **Abitudinario** — Raggiungi 10 registrazioni totali
- 🏆 **Veterano** — Raggiungi 100 registrazioni totali
- 📅 **Costante** — Ottieni una streak di 7 giorni
- 👑 **Leggenda** — Ottieni una streak di 30 giorni

### Settings

- Account Google connesso;
- stato sincronizzazione cloud;
- logout.

## 🛠️ Stack

### Frontend

- [React 19](https://react.dev/) — UI e gestione stato
- [Vite 8](https://vite.dev/) — build tool e dev server
- [React Router 7](https://reactrouter.com/) — navigazione SPA
- [Tailwind CSS 4](https://tailwindcss.com/) — styling utility-first
- [Framer Motion](https://www.framer.com/motion/) — animazioni
- [Recharts](https://recharts.org/) — grafici
- [React Hot Toast](https://react-hot-toast.com/) — notifiche toast
- [React Confetti](https://www.npmjs.com/package/react-confetti) — confetti per achievement

### Backend e Auth

- [Supabase](https://supabase.com/) — database, auth e API gestite
- [Supabase Auth](https://supabase.com/auth) — login Google OAuth

### PWA e Offline

- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — service worker e manifest
- localStorage — cache locale e coda modifiche pendenti

### Deploy

- [Vercel](https://vercel.com/) — hosting frontend

### Testing

- [Vitest](https://vitest.dev/) — test runner

## 🧱 Struttura del progetto

```text
cagometro/
├── frontend/
│   ├── public/               # Icone PWA e screenshot
│   ├── src/
│   │   ├── components/       # Componenti UI riutilizzabili
│   │   ├── pages/            # Pagine (route)
│   │   ├── hooks/            # Custom hooks React
│   │   ├── contexts/          # Context providers (auth, entries)
│   │   ├── services/         # Chiamate API Supabase
│   │   ├── utils/            # Logica pura (date, stats, storage)
│   │   ├── config/           # Configurazioni (achievements)
│   │   ├── lib/              # Client Supabase
│   │   ├── assets/           # Immagini e risorse
│   │   ├── App.jsx           # Router principale
│   │   └── main.jsx          # Entry point e providers
│   ├── vite.config.js        # Configurazione Vite + PWA
│   └── package.json
├── README.md
└── .gitignore
```

## 🗃️ Dati

Ogni click incrementa il conteggio del giorno corrente. Le registrazioni sono salvate come coppia `data → conteggio`:

```text
2026-08-27 → 3
2026-08-28 → 1
2026-08-29 → 0
```

Il pulsante **Annulla** riduce di uno il conteggio di oggi. Non trucca i numeri: il Cagometro rispetta la scienza.

## ☁️ Backup cloud e sincronizzazione

Cagometro funziona sia online che offline, con un sistema di sincronizzazione a più livelli:

### Modalità offline

- tutte le registrazioni sono salvate in `localStorage` del browser;
- l'app è installabile come PWA e funziona completamente senza connessione.

### Salvataggio locale

- utenti anonimi: dati in `entries_anonymous`;
- utenti autenticati: dati in `entries_user_{id}`.

### Sincronizzazione con Supabase

- al login, i dati vengono caricati dal cloud e salvati in locale;
- ogni modifica viene prima salvata in locale, poi sincronizzata con il server.

### Migrazione automatica

- al primo accesso con Google, le registrazioni anonime vengono automaticamente migrate nell'account cloud;
- i dati anonimi vengono rimossi localmente dopo la migrazione.

### Sincronizzazione pendente

- se la connessione fallisce, le modifiche vengono accodate in `pending_sync_{id}`;
- al riconnessione (evento `online`), la coda viene svuotata e i dati sincronizzati;
- stato visibile nella pagina Impostazioni: ☁️ Sincronizzato / 🟠 Modifiche da sincronizzare / 🔴 Errore sincronizzazione;
- nell'header: ● Cloud attivo / ● Errore sync.

## 🧪 Test

I test sono eseguiti con **Vitest** e coprono la logica pura dell'applicazione:

```bash
npm test
```

### File di test

- `utils/date.test.js` — formattazione e parsing delle date locali
- `utils/stats.test.js` — streak, streak migliore, totali, record, grafici
- `config/achievements.test.js` — progresso achievement per tipo (total/streak)

### Cosa viene testato

- calcolo streak con 0, 1 o più giorni consecutivi;
- interruzione streak con giorni mancanti;
- calcolo miglior streak storica;
- somma totale e record storico;
- totali ultimi N giorni e per mese;
- generazione dati per grafici settimanali e mensili;
- progresso achievement per registrazioni totali e streak.

## 🚀 Sviluppo

```bash
cd frontend
npm install
npm run dev
```

### Comandi disponibili

```bash
npm run dev        # Dev server Vite
npm run build      # Build di produzione
npm run preview    # Preview build
npm run lint       # ESLint
npm test           # Vitest
```

## 🔮 Idee future

- heatmap stile GitHub;
- esportazione CSV o JSON;
- statistiche per fascia oraria;
- altri achievement assolutamente necessari alla comunità scientifica.

## 📜 Licenza

Progetto personale a scopo didattico.

<div align="center">

### Il WC dimentica. Cagometro no. 🚽

</div>
