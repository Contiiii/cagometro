import { ChevronRight, Crown, LogOut, UsersRound } from "lucide-react";

import Card from "../ui/Card";

import { useTeamUI } from "../../context/TeamUIContext";

export default function TeamAdminCard({
  team,
  leaving,
  onManageMembers,
  onOpenTransfer,
  onLeave,
}) {
  const { theme, isDark } = useTeamUI();

  const isOwner = team?.role === "owner";

  return (
    <section className="mx-auto mt-8 max-w-3xl">
      <h2
        className={`text-2xl font-black tracking-[-0.055em] ${theme.primaryText}`}
      >
        Gestione squadra
      </h2>

      <Card theme={theme} radius="panel" padding="none" className="mt-4">
        {isOwner && (
          <>
            <AdminItem
              label="Gestisci membri"
              icon={<UsersRound className="h-4 w-4" strokeWidth={2.2} />}
              onClick={onManageMembers}
              theme={theme}
              isDark={isDark}
            />

            <AdminItem
              label="Trasferisci proprietà"
              description="Affida la squadra a un altro membro"
              icon={
                <Crown className="h-4 w-4" strokeWidth={2.2} />
              }
              iconClassName="text-amber-500"
              onClick={onOpenTransfer}
              theme={theme}
              isDark={isDark}
              withBorder
            />
          </>
        )}

        <button
          type="button"
          onClick={onLeave}
          disabled={leaving}
          className={`flex min-h-14 w-full items-center justify-between px-4 text-left text-sm font-bold text-rose-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 ${
            isOwner
              ? isDark
                ? "border-t border-white/[0.07] hover:bg-rose-500/10"
                : "border-t border-zinc-900/[0.07] hover:bg-rose-500/10"
              : isDark
                ? "hover:bg-rose-500/10"
                : "hover:bg-rose-500/10"
          }`}
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            {leaving ? "Uscita in corso..." : "Abbandona squadra"}
          </span>

          <ChevronRight className="h-4 w-4 shrink-0 opacity-60" strokeWidth={2.2} />
        </button>
      </Card>
    </section>
  );
}

function AdminItem({
  label,
  description,
  icon,
  iconClassName = "",
  onClick,
  theme,
  isDark,
  withBorder = false,
}) {
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
      className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${borderClass} ${hoverClass}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={`shrink-0 ${iconClassName}`}>{icon}</span>

        <span className="min-w-0">
          <span className={`block truncate text-sm font-bold ${theme.primaryText}`}>
            {label}
          </span>

          {description && (
            <span className={`mt-0.5 block truncate text-xs font-medium ${theme.muted}`}>
              {description}
            </span>
          )}
        </span>
      </span>

      <ChevronRight className={`h-4 w-4 shrink-0 ${theme.subtle}`} strokeWidth={2.2} />
    </button>
  );
}