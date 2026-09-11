import { Settings, ShieldCheck, UserPlus, UsersRound } from "lucide-react";

import Card from "../ui/Card";

import { useTeamUI } from "../../hooks/useTeamUI";

export default function TeamHeroCard({
  team,
  membersCount,
  totalLifetime,
  currentUserPosition,
  invitesEnabled,
  onOpenSettings,
  onOpenInvite,
}) {
  const { theme, isDark } = useTeamUI();

  return (
    <section className="mx-auto max-w-3xl">
      <div className="relative">
        <Card theme={theme} padding="none">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-pink-500/[0.08] blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-amber-400/[0.06] blur-3xl" />

          <div className="relative p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] bg-pink-500 text-2xl shadow-[0_12px_30px_rgba(236,72,153,0.28)] sm:h-16 sm:w-16 sm:text-3xl">
                {team?.avatar_emoji || "🏆"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className={`min-w-0 break-words text-[clamp(1.35rem,5vw,2.2rem)] font-black leading-[0.95] tracking-[-0.055em] ${theme.primaryText}`}
                  >
                    {team?.team_name || "Squadra senza nome"}
                  </h1>

                  {team?.role === "owner" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 px-2.5 py-1 text-[10px] font-extrabold text-pink-600 dark:text-pink-300 sm:text-[11px]">
                      <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
                      ADMIN
                    </span>
                  )}
                </div>

                <p
                  className={`mt-2 max-w-[52ch] text-sm font-medium leading-relaxed ${theme.muted}`}
                >
                  {team?.description || "Nessuna descrizione della squadra."}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge isDark={isDark}>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                  Squadra attiva
                </StatusBadge>

                <StatusBadge isDark={isDark}>
                  <UsersRound className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {membersCount} {membersCount === 1 ? "membro" : "membri"}
                </StatusBadge>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap">
  <button
    type="button"
    onClick={onOpenSettings}
    aria-label={
      team?.role === "owner"
        ? "Gestisci squadra"
        : "Impostazioni squadra"
    }
    className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 sm:px-4 ${theme.secondary}`}
  >
    <Settings
      className="h-4 w-4 shrink-0"
      strokeWidth={2.2}
    />

    <span className="truncate">
      {team?.role === "owner" ? "Gestisci" : "Impostazioni"}
    </span>
  </button>

  <button
    type="button"
    onClick={onOpenInvite}
    aria-label="Invita un membro"
     disabled={!invitesEnabled}
    className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40 sm:px-4"
  >
    <UserPlus
      className="h-4 w-4 shrink-0"
      strokeWidth={2.5}
    />

    <span className="truncate">Invita</span>
  </button>
</div>
            </div>
          </div>

          <div
            className={`grid grid-cols-3 border-t ${
              isDark ? "border-white/[0.08]" : "border-zinc-900/[0.08]"
            }`}
          >
            <HeroMetric label="Membri" value={membersCount} theme={theme} />

            <HeroMetric
              label="Totale"
              value={totalLifetime.toLocaleString("it-IT")}
              theme={theme}
              bordered
              isDark={isDark}
            />

            <HeroMetric
              label="Posizione"
              value={currentUserPosition ? `#${currentUserPosition}` : "-"}
              theme={theme}
            />
          </div>
        </Card>
      </div>
    </section>
  );
}

function StatusBadge({ children, isDark }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
        isDark
          ? "border-white/[0.08] bg-white/[0.04]"
          : "border-zinc-900/[0.08] bg-zinc-900/[0.03]"
      }`}
    >
      {children}
    </span>
  );
}

function HeroMetric({ label, value, theme, bordered = false, isDark = false }) {
  return (
    <div
      className={`px-4 py-4 sm:px-5 ${
        bordered
          ? isDark
            ? "border-x border-white/[0.08]"
            : "border-x border-zinc-900/[0.08]"
          : ""
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-black tracking-tight ${theme.primaryText}`}
      >
        {value}
      </p>
    </div>
  );
}
