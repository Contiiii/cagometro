import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Database,
  FileText,
  Info,
  Lock,
  Shield,
  UsersRound,
} from "lucide-react";

import { useTheme } from "../hooks/useTheme";
import { useSettings } from "../hooks/useSettings";
import { getTheme } from "../config/theme";
import { accentOptions } from "../config/appearance";

const privacySections = [
  {
    icon: Info,
    title: "Dati che raccogliamo",
    paragraphs: [
      "Cagometro registra esclusivamente i dati necessari al funzionamento dell'app: le registrazioni giornaliere (data e numero), i traguardi raggiunti e le informazioni sulle squadre.",
      "Se accedi con Google vengono trattati il nome e l'indirizzo email per la sincronizzazione cloud. Senza account tutti i dati restano sul tuo dispositivo.",
    ],
  },
  {
    icon: Database,
    title: "Finalità e base giuridica",
    paragraphs: [
      "I dati sono utilizzati soltanto per erogare le funzionalità dell'app (statistiche, traguardi, squadre) e per mantenere la sincronizzazione tra i tuoi dispositivi. Non vengono utilizzati per profilazione né per finalità pubblicitarie.",
    ],
  },
  {
    icon: Clock,
    title: "Conservazione",
    paragraphs: [
      "Senza account i dati vivono esclusivamente nello storage locale del dispositivo. Con un account vengono salvati su un database cloud e restano disponibili finché non ne chiedi la cancellazione.",
      "Puoi eliminare i dati locali in qualsiasi momento dalla sezione Impostazioni → Account.",
    ],
  },
  {
    icon: UsersRound,
    title: "Squadre",
    paragraphs: [
      "Se partecipi a una squadra, il tuo nome e i totali del periodo vengono condivisi con gli altri membri della squadra per il funzionamento di classifiche e obiettivi di gruppo.",
    ],
  },
  {
    icon: Lock,
    title: "Sicurezza",
    paragraphs: [
      "Le connessioni sono protette (HTTPS) e l'accesso ai dati cloud richiede il tuo account. I dati non vengono venduti a terzi.",
    ],
  },
  {
    icon: FileText,
    title: "I tuoi diritti",
    paragraphs: [
      "In base al Regolamento generale sulla protezione dei dati (GDPR, UE 2016/679) hai diritto di accesso, rettifica, cancellazione, limitazione e portabilità dei dati, oltre al diritto di opporti al trattamento.",
      "Per esercitare questi diritti o per qualsiasi domanda sulla privacy puoi scriverci tramite la voce \"Segnala un'idea\" nelle Impostazioni.",
    ],
  },
];

export default function Privacy() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { accent } = useSettings();
  const isDark = resolvedTheme === "dark";

  const accentColor = useMemo(
    () => accentOptions.find((item) => item.id === accent)?.color ?? "#ec4899",
    [accent],
  );

  const theme = getTheme(isDark);

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${theme.header}`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 ${theme.softSurface}`}
            style={{ "--tw-ring-color": accentColor }}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Indietro
          </button>

          <div className="text-center">
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.16em] ${theme.subtle}`}
            >
              Cagometro
            </p>
            <p className={`text-sm font-black tracking-tight ${theme.primaryText}`}>
              Privacy
            </p>
          </div>

          <div
            className={`grid h-11 w-11 place-items-center rounded-2xl border ${theme.softSurface}`}
          >
            <Shield
              className="h-5 w-5"
              strokeWidth={2.2}
              style={{ color: accentColor }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        <section
          className={`relative overflow-hidden rounded-[2.1rem] border p-5 sm:p-7 ${theme.surface}`}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: `${accentColor}1f` }}
          />

          <div className="relative">
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.16em] ${theme.subtle}`}
            >
              Trasparenza
            </p>
            <h1
              className={`mt-2 text-2xl font-black tracking-[-0.05em] ${theme.primaryText}`}
            >
              Informativa privacy
            </h1>
            <p
              className={`mt-2 max-w-2xl text-sm font-medium leading-relaxed ${theme.muted}`}
            >
              Come Cagometro raccoglie, usa e protegge i dati personali. Ultimo
              aggiornamento: settembre 2026.
            </p>
          </div>
        </section>

        <div className="mt-5 grid gap-3">
          {privacySections.map((section) => {
            const SectionIcon = section.icon;

            return (
              <section
                key={section.title}
                className={`rounded-[1.5rem] border p-5 sm:p-6 ${theme.surface}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
                    style={{
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                    }}
                  >
                    <SectionIcon className="h-5 w-5" strokeWidth={2.2} />
                  </div>

                  <h2
                    className={`text-base font-black tracking-[-0.02em] ${theme.primaryText}`}
                  >
                    {section.title}
                  </h2>
                </div>

                <div className="mt-4 grid gap-2">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className={`text-sm font-medium leading-relaxed ${theme.muted}`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className={`mt-3 rounded-[1.5rem] border p-5 ${theme.softSurface}`}>
          <p className={`text-xs font-medium leading-relaxed ${theme.muted}`}>
            Questa informativa può essere aggiornata quando cambiano le
            funzionalità dell'app. In caso di modifiche rilevanti, la nuova
            versione sostituisce la presente.
          </p>
        </div>
      </main>
    </div>
  );
}