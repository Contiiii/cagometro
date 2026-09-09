import { ChevronRight } from "lucide-react";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";

export default function TeamSettingsModal({
  team,
  theme,
  isDark,
  prefersReducedMotion,
  leaving,
  onClose,
  onEdit,
  onManageMembers,
  onRegenerateInvite,
  onLeave,
}) {
  const isOwner = team?.role === "owner";

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={onClose}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              {isOwner ? "Gestione squadra" : "Impostazioni squadra"}
            </p>

            <h2
              className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
            >
              {team?.team_name || "Squadra"}
            </h2>
          </div>

          <CloseButton onClick={onClose} theme={theme} isDark={isDark} />
        </div>

        {isOwner ? (
          <div
            className={`mt-7 overflow-hidden rounded-[1.4rem] border ${theme.softSurface}`}
          >
            <SettingsItem
              label="Modifica identità della squadra"
              onClick={onEdit}
              theme={theme}
              isDark={isDark}
            />

            <SettingsItem
              label="Gestisci membri"
              onClick={onManageMembers}
              theme={theme}
              isDark={isDark}
              withBorder
            />

            <SettingsItem
              label="Rigenera codice invito"
              onClick={onRegenerateInvite}
              theme={theme}
              isDark={isDark}
              withBorder
            />
          </div>
        ) : (
          <div
            className={`mt-7 rounded-[1.4rem] border p-4 ${theme.softSurface}`}
          >
            <p className={`text-sm font-bold ${theme.primaryText}`}>
              Sei un membro della squadra
            </p>

            <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
              Le funzioni di gestione sono disponibili soltanto al proprietario.
              Puoi comunque abbandonare la squadra.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onLeave}
          disabled={leaving}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-bold text-rose-500 transition hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {leaving ? "Uscita in corso..." : "Abbandona squadra"}
        </button>
      </div>
    </ModalShell>
  );
}

function SettingsItem({ label, onClick, theme, isDark, withBorder = false }) {
  const borderClass = withBorder
    ? isDark
      ? "border-t border-white/[0.07]"
      : "border-t border-zinc-900/[0.07]"
    : "";

  const hoverClass = isDark
    ? "hover:bg-white/[0.05]"
    : "hover:bg-zinc-900/[0.04]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 w-full items-center justify-between px-4 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${borderClass} ${hoverClass} ${theme.primaryText}`}
    >
      <span>{label}</span>

      <ChevronRight
        className={`h-4 w-4 shrink-0 ${theme.subtle}`}
        strokeWidth={2.2}
      />
    </button>
  );
}
