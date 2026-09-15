import { Moon, Smartphone, Sun } from "lucide-react";

import { accentOptions } from "../../config/appearance";
import PanelFrame from "./PanelFrame";

function CheckMark({ color }) {
  return (
    <span
      className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-black text-white"
      style={{ backgroundColor: color }}
    >
      ✓
    </span>
  );
}

export default function AppearancePanel({
  theme,
  accent,
  setAccent,
  accentColor,
  themeMode,
  setTheme,
  initialTeamActivityLimit,
  setInitialTeamActivityLimit,
}) {
  const themeOptions = [
    { id: "light", label: "Chiaro", icon: Sun },
    { id: "dark", label: "Scuro", icon: Moon },
    { id: "system", label: "Auto", icon: Smartphone },
  ];

  return (
    <PanelFrame
      eyebrow="Aspetto"
      title="Come vuoi vederla"
      description="Tema, colore e piccoli dettagli che rendono l’app più tua."
      theme={theme}
    >
      <div className={`rounded-2xl border p-4 ${theme.softSurface}`}>
        <p
          className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Tema
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const active = themeMode === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                aria-pressed={active}
                className={`min-h-[92px] rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.softSurface}`}
                style={{
                  borderColor: active ? accentColor : undefined,
                  boxShadow: active
                    ? `0 0 0 1px ${accentColor} inset`
                    : undefined,
                  "--tw-ring-color": accentColor,
                }}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={2.2}
                  style={{ color: active ? accentColor : undefined }}
                />
                <p className={`mt-4 text-sm font-black ${theme.primaryText}`}>
                  {option.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`mt-4 rounded-2xl border p-4 ${theme.softSurface}`}>
        <p
          className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Stile
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {accentOptions.map((option) => {
            const active = accent === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAccent(option.id)}
                aria-pressed={active}
                className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.softSurface}`}
                style={{
                  borderColor: active ? option.color : undefined,
                  boxShadow: active
                    ? `0 0 0 1px ${option.color} inset`
                    : undefined,
                  "--tw-ring-color": option.color,
                }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-7 w-7 rounded-full shadow-sm"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className={`text-sm font-black ${theme.primaryText}`}>
                    {option.label}
                  </span>
                </span>

                {active && <CheckMark color={option.color} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`mt-4 rounded-2xl border p-4 ${theme.softSurface}`}>
        <p
          className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Attività del team
        </p>

        <p className={`mt-1 text-sm font-medium ${theme.muted}`}>
          Quante attività recenti mostrare all'inizio.
        </p>

        <div className="mt-3 grid grid-cols-3 divide-x divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {[3, 5, 10].map((option) => {
            const active = initialTeamActivityLimit === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setInitialTeamActivityLimit(option)}
                aria-pressed={active}
                className={`flex h-11 items-center justify-center text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 ${
                  active ? "text-white" : `${theme.softSurface} ${theme.muted}`
                }`}
                style={{
                  backgroundColor: active ? accentColor : undefined,
                  borderLeftColor: active ? accentColor : undefined,
                  borderRightColor: active ? accentColor : undefined,
                  "--tw-ring-color": accentColor,
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </PanelFrame>
  );
}