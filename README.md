<div align="center">

# 💩 CAGOMETRO

### Statistiche serie per momenti poco seri.

Una web app personale per registrare le visite al trono, mantenere viva la streak e conquistare gloriosi achievement da bagno.

![Status](https://img.shields.io/badge/status-in%20sviluppo-facc15?style=for-the-badge)
![Mission](https://img.shields.io/badge/missione-sopravvivere%20al%20WC-84cc16?style=for-the-badge)

</div>

---

## 🚽 Cos'è?

**Cagometro** registra ogni visita al bagno con un semplice click.

Niente login, niente utenti multipli, niente complicazioni cosmiche: una sola persona, un solo trono, moltissimi dati discutibili.

## ✨ Funzionalità MVP

- 💩 Registrazione istantanea con data e ora
- 🔥 Streak dei giorni consecutivi
- ↩️ Eliminazione dell'ultima registrazione
- 📊 Report giornalieri, settimanali, mensili e annuali
- 🏆 Achievement e progresso dei badge
- 🎉 Popup animati per gli achievement sbloccati
- 📱 Interfaccia responsive e mobile-first
- 🌙 Dark mode, perché certe missioni avvengono nell'ombra

## 🗺️ Pagine

```text
/              Home
/report        Report
/achievement   Achievement
```

### Home

Il centro operativo del regno:

- conteggio di oggi;
- streak attuale;
- enorme pulsante 💩;
- frase casuale post-missione;
- annullamento dell'ultima registrazione.

### Report

Statistiche divise per:

- giorno;
- settimana;
- mese;
- anno.

Per ogni periodo saranno mostrati totale, media e record. I grafici arriveranno più avanti, quando il trono avrà abbastanza dati.

### Achievement

Badge gloriosi come:

- 🥉 Prima Seduta
- 🚽 Re del WC
- 💩 Macchina da Guerra
- ☢️ Livello Catastrofe
- 👑 Imperatore della Porcellana
- 🔥 Inarrestabile
- 💀 Leggenda del Bagno
- 🕵️ Operazione Fantasma

## 🛠️ Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS

### Backend

- Node.js
- Express.js
- REST API

### Database e deploy

- PostgreSQL
- Neon
- Render
- Vercel

## 🧱 Struttura prevista

```text
cagometro/
├── frontend/       # Interfaccia React
├── backend/        # API Express
├── README.md
└── .gitignore
```

## 🗃️ Dati

Ogni click crea una nuova registrazione:

```text
id | created_at
1  | 2026-08-27 08:30
2  | 2026-08-27 12:20
3  | 2026-08-27 18:15
```

Il comando **Annulla** elimina davvero l'ultima riga. Non trucca il contatore: il Cagometro rispetta la scienza.

## 🚧 Roadmap

- [ ] Creare la Home statica
- [ ] Aggiungere routing e tre pagine
- [ ] Implementare le interazioni locali
- [ ] Configurare Express e PostgreSQL
- [ ] Salvare le registrazioni nel database
- [ ] Implementare l'annullamento
- [ ] Calcolare la streak
- [ ] Aggiungere gli achievement
- [ ] Creare i report
- [ ] Scrivere i test
- [ ] Pubblicare l'app
- [ ] Celebrare sul trono

## 🔮 Idee future

- grafici;
- heatmap stile GitHub;
- esportazione CSV o JSON;
- cronologia completa;
- PWA installabile;
- statistiche per fascia oraria;
- altri achievement assolutamente necessari alla comunità scientifica.

## 🎓 Obiettivo del progetto

Cagometro è un progetto didattico per esercitarsi con:

- React e gestione dello stato;
- responsive design;
- API REST;
- Node.js ed Express;
- PostgreSQL e SQL;
- date e timezone;
- test e deploy full stack.

## 📜 Licenza

Progetto personale a scopo didattico.

<div align="center">

### Il WC dimentica. Cagometro no. 🚽

</div>
