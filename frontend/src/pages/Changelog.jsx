import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  History,
  ScrollText,
  Sparkles,
} from "lucide-react";

import { useTheme } from "../hooks/useTheme";
import { useSettings } from "../hooks/useSettings";
import { getTheme } from "../config/theme";
import { accentOptions } from "../config/appearance";
import { RELEASE_NOTES } from "../config/releaseNotes";

function formatDate(isoDate) {
  if (!isoDate) {
    return "";
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Changelog() {
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
              Changelog
            </p>
          </div>

          <div
            className={`grid h-11 w-11 place-items-center rounded-2xl border ${theme.softSurface}`}
          >
            <History
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
              Versione per versione
            </p>
            <h1
              className={`mt-2 flex items-center gap-2 text-2xl font-black tracking-[-0.05em] ${theme.primaryText}`}
            >
              <ScrollText
                className="h-6 w-6"
                strokeWidth={2.3}
                style={{ color: accentColor }}
              />
              Changelog
            </h1>
            <p
              className={`mt-2 max-w-2xl text-sm font-medium leading-relaxed ${theme.muted}`}
            >
              Ogni aggiornamento di Cagometro, che ti ha portato alla versione
              attuale.
            </p>
          </div>
        </section>

        <div className="mt-5 grid gap-4">
          {RELEASE_NOTES.map((note, index) => {
            const isLatest = index === 0;

            return (
              <section
                key={note.version}
                className={`rounded-[1.5rem] border p-5 sm:p-6 ${theme.surface}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {isLatest && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em]`}
                      style={{
                        backgroundColor: `${accentColor}15`,
                        color: accentColor,
                      }}
                    >
                      <Sparkles
                        className="h-3.5 w-3.5"
                        strokeWidth={2.4}
                      />
                      Ultima versione
                    </span>
                  )}

                  <span className={`text-lg font-black tracking-tight ${theme.primaryText}`}>
                    v{note.version}
                  </span>

                  {note.date && (
                    <span className={`text-xs font-medium ${theme.muted}`}>
                      {formatDate(note.date)}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-3">
                  {note.features.map((feature) => {
                    const FeatureIcon = feature.icon;
                    const Icon = FeatureIcon ?? null;

                    return (
                      <div
                        key={feature.id ?? feature.title}
                        className={`flex items-start gap-3 rounded-[1.35rem] border p-4 ${theme.softSurface}`}
                      >
                        {Icon && (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                            <Icon className="h-[18px] w-[18px]" strokeWidth={2.3} />
                          </span>
                        )}

                        <div className="min-w-0">
                          <p className={`text-sm font-black ${theme.primaryText}`}>
                            {feature.title}
                          </p>

                          <p
                            className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}
                          >
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}