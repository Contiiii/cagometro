import { useId } from "react";
import { ChevronRight } from "lucide-react";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";
import Panel from "../ui/Panel";

import { useTeamUI } from "../../hooks/useTeamUI";

export default function TeamSettingsModal({
  team,
  leaving,
  invitesEnabled,
  togglingInvites,
  onToggleInvites,
  onClose,
  onEdit,
  onManageMembers,
  onRegenerateInvite,
  onLeave,
}) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();

  const isOwner = team?.role === "owner";

  const titleId = useId();

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={onClose}
      labelledBy={titleId}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              {isOwner ? "Gestione squadra" : "Impostazioni squadra"}
            </p>

            <h2
              id={titleId}
              className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
            >
              {team?.team_name || "Squadra"}
            </h2>
          </div>

          <CloseButton onClick={onClose} theme={theme} isDark={isDark} />
        </div>

        {isOwner ? (
          <Panel
            theme={theme}
            radius="soft"
            padding="none"
            className="mt-7 overflow-hidden"
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

            <InvitesToggleItem
              checked={invitesEnabled}
              disabled={togglingInvites}
              onChange={onToggleInvites}
              theme={theme}
              isDark={isDark}
            />
          </Panel>
        ) : (
          <Panel theme={theme} radius="soft" className="mt-7">
            <p className={`text-sm font-bold ${theme.primaryText}`}>
              Sei un membro della squadra
            </p>

            <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
              Le funzioni di gestione sono disponibili soltanto al proprietario.
              Puoi comunque abbandonare la squadra.
            </p>
          </Panel>
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

function InvitesToggleItem({ checked, disabled, onChange, theme, isDark }) {
  const hoverClass = isDark
    ? "hover:bg-white/[0.05]"
    : "hover:bg-zinc-900/[0.04]";

  return (
    <label
      className={`flex min-h-14 w-full select-none items-center justify-between gap-3 border-t px-4 py-2 transition-colors ${hoverClass} ${
        isDark
          ? "border-white/[0.07]"
          : "border-zinc-900/[0.07]"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span className="min-w-0">
        <span className={`block text-sm font-bold ${theme.primaryText}`}>
          Consenti nuovi inviti
        </span>

        <span
          className={`mt-0.5 block truncate text-xs font-medium ${theme.muted}`}
        >
          {checked
            ? "Chiunque abbia il codice può entrare"
            : "Inviti disabilitati, nessun nuovo ingresso"}
        </span>
      </span>

      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        aria-label="Consenti nuovi inviti"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-pink-500/70 ${
          checked
            ? "bg-pink-600"
            : isDark
              ? "bg-zinc-700"
              : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </label>
  );
}
