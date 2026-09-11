<div align="center">

# 💩 CAGOMETRO

### Statistiche serie per momenti poco seri.

Una web app personale per registrare le visite al trono, mantenere viva la streak e conquistare gloriosi achievement da bagno.

APP_VERSION
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
- 👥 Creazione e gestione delle squadre
- 🔗 Inviti tramite codice e link condivisibile
- 🥇 Classifica settimanale e storica
- 🔥 Streak e XP visualizzati per ogni membro
- 📡 Activity feed aggiornato in tempo reale
- 👑 Trasferimento della proprietà della squadra
- 🔒 Attivazione e disattivazione degli inviti
- 🆕 Modale con le novità mostrata una volta per versione

## 🗺️ Pagine

```text
/               Home         Centro operativo del regno
/report         Report       Statistiche e grafici
/achievements   Traguardi    Badge e progresso
/teams          Squadre      Classifica, membri e attività
/join/:code     Invito       Ingresso in una squadra
/settings       Impostazioni Account e configurazione
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

### Squadre

Le squadre permettono di condividere progressi e statistiche con altri utenti:

- creazione di una nuova squadra;
- ingresso tramite codice o link invito;
- limite massimo di membri;
- classifica settimanale e storica;
- visualizzazione di streak e XP;
- feed delle attività recenti;
- gestione dei membri;
- trasferimento della proprietà;
- attivazione e disattivazione degli inviti;
- rigenerazione protetta del codice invito;
- uscita dalla squadra;
- scioglimento automatico quando l'owner è l'unico membro.

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
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── supabase/
│   │   ├── migrations/
│   │   └── config.toml
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
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

## ⚙️ Requisiti

Per eseguire Cagometro localmente servono:

- Node.js
- npm
- Git

Docker Desktop è richiesto soltanto per alcune operazioni locali di Supabase, tra cui:

```bash
supabase db pull
supabase db diff
supabase db reset
supabase start
```

Docker non è necessario per avviare normalmente il frontend.

## 📦 Installazione

Clona il repository:

```bash
git clone URL_DEL_REPOSITORY
cd cagometro/frontend
```

Installa le dipendenze:

```bash
npm install
```

## 🔐 Variabili d'ambiente

Crea il file locale `.env` partendo dal modello incluso nel repository.

### PowerShell

```powershell
Copy-Item .env.example .env
```

### macOS e Linux

```bash
cp .env.example .env
```

Il file `.env.example` contiene:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Inserisci nel file `.env` i valori del progetto Supabase:

```env
VITE_SUPABASE_URL=https://example.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Il file `.env` non deve essere aggiunto a Git.

Non committare mai:

- password del database;
- secret key;
- service role key;
- connection string privata;
- token personali.

## 🧑‍💻 Avvio locale

Avvia il server di sviluppo:

```bash
npm run dev
```

Vite mostrerà l'indirizzo locale dell'applicazione, generalmente:

```text
http://localhost:5173
```

## ✅ Controllo qualità

### Lint

```bash
npm run lint
```

### Test

```bash
npm test
```

In alternativa, per eseguire una singola sessione Vitest:

```bash
npx vitest run
```

### Build di produzione

```bash
npm run build
```

### Anteprima della build

```bash
npm run preview
```

Prima di ogni deploy è consigliato eseguire:

```bash
npm run lint
npx vitest run
npm run build
```

## 🗄️ Configurazione Supabase

Cagometro utilizza Supabase per:

- autenticazione Google;
- profili;
- registrazioni;
- squadre;
- membri delle squadre;
- classifiche;
- attività delle squadre;
- feedback.

### Installazione e accesso alla CLI

Effettua il login:

```bash
supabase login
```

Collega il repository al progetto remoto:

```bash
supabase link
```

In alternativa:

```bash
supabase link --project-ref PROJECT_REF
```

Controlla lo stato delle migration:

```bash
supabase migration list
```

## 🧱 Migration database

Le migration sono salvate in:

```text
supabase/migrations/
```

La cartella `supabase` deve essere versionata con Git.

Le migration descrivono elementi come:

- tabelle;
- colonne;
- funzioni RPC;
- policy RLS;
- trigger;
- indici;
- vincoli;
- modifiche allo schema.

### Recuperare modifiche dal database remoto

Avvia Docker Desktop, quindi esegui:

```bash
supabase db pull
```

Controlla sempre il file SQL generato:

```bash
git diff -- supabase
```

### Creare una migration manualmente

```bash
supabase migration new nome_modifica
```

Esempio:

```bash
supabase migration new add_team_invite_rate_limit
```

Inserisci nel file generato soltanto il SQL necessario alla modifica.

### Applicare migration pendenti

```bash
supabase db push
```

Prima di eseguire `db push`, controlla attentamente tutte le migration ancora da applicare.

## 🛡️ Sicurezza e RLS

Row Level Security è attiva sulle tabelle applicative:

- `entries`
- `feedback`
- `profiles`
- `teams`
- `team_members`
- `team_activity`

Le operazioni sensibili utilizzano `auth.uid()` per identificare l'utente autenticato.

Le RPC non devono fidarsi di un `user_id` o `team_id` arbitrario inviato dal frontend.

### Protezione delle registrazioni

Ogni utente può accedere soltanto alle proprie registrazioni.

La tabella `entries` include vincoli equivalenti a:

```sql
unique (user_id, date)
```

```sql
check (count >= 0)
```

```sql
check (count <= 100)
```

### Protezione delle squadre

Il database impedisce:

- più squadre attive per lo stesso utente;
- più owner attivi nella stessa squadra;
- codici invito duplicati;
- ingresso tramite inviti disabilitati;
- ingresso in una seconda squadra;
- trasferimento della proprietà a utenti esterni;
- rimozione dell'owner;
- rigenerazione eccessivamente frequente del codice invito.

Il feed attività utilizza un indice composto su:

```sql
team_activity (team_id, created_at desc)
```

## 🏷️ Versione e note di rilascio

La versione dell'app e le novità mostrate all'utente sono centralizzate in:

```text
src/config/releaseNotes.js
```

Per pubblicare una nuova versione, aggiorna:

```js
export const APP_VERSION = "1.9.0";
```

e modifica:

```js
export const RELEASE_FEATURES = [
  // novità della versione
];
```

La modale delle novità viene mostrata una sola volta per versione tramite `localStorage`.

## 🚀 Deploy

Il frontend può essere distribuito su Vercel.

Nel pannello del progetto devono essere configurate queste variabili:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Dopo aver modificato le variabili d'ambiente, esegui un nuovo deploy.

Prima del deploy:

```bash
npm run lint
npx vitest run
npm run build
```

Dopo il deploy verifica almeno:

- autenticazione Google;
- registrazione e annullamento;
- sincronizzazione cloud;
- report;
- pagina `/achievements`;
- creazione squadra;
- ingresso tramite `/join/:code`;
- classifica Team;
- attività Team;
- rigenerazione codice invito;
- tema chiaro e scuro;
- installazione PWA.

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
