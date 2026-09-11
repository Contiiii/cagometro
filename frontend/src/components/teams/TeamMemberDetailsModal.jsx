import { useId, useMemo } from "react";
import { motion } from "framer-motion";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";
import Panel from "../ui/Panel";

import { useTeamUI } from "../../hooks/useTeamUI";
import { useTeamSelection } from "../../hooks/useTeamSelection";

import { useAuth } from "../../hooks/useAuth";
import { useTeam } from "../../hooks/useTeam";

import { getAvatarGradient, getInitials } from "../../utils/avatar";

export default function TeamMemberDetailsModal({ onClose }) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();

  const { user } = useAuth();
  const { leaderboard = [] } = useTeam();
  const {
    selectedData: member,
    selectedPosition: position,
    selectedMembership: membership,
  } = useTeamSelection();

  const currentUserId = user?.id;

  const totalWeekly = useMemo(
    () =>
      leaderboard.reduce(
        (total, entry) => total + Number(entry.weekly_total || 0),
        0,
      ),
    [leaderboard],
  );

  const titleId = useId();

  if (!member) {
    return null;
  }

  const weeklyTotal = Number(member.weekly_total || 0);
  const lifetimeTotal = Number(member.lifetime_total || 0);

  const weeklyContribution =
    totalWeekly > 0
      ? Math.min(100, (weeklyTotal / totalWeekly) * 100)
      : 0;

  const avatarGradient =
    member.avatar || getAvatarGradient(member.user_id);

  const isCurrentUser = member.user_id === currentUserId;

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={onClose}
      labelledBy={titleId}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-[1.3rem] bg-gradient-to-br ${avatarGradient} text-sm font-black text-white`}
            >
              {getInitials(member.display_name || "Utente")}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id={titleId}
                  className={`truncate text-xl font-black tracking-tight ${theme.primaryText}`}
                >
                  {member.display_name || "Utente"}
                </h2>

                {isCurrentUser && (
                  <span className="rounded-full bg-pink-500/12 px-2 py-0.5 text-[10px] font-extrabold text-pink-600 dark:text-pink-300">
                    TU
                  </span>
                )}
              </div>

              <p className={`mt-1 text-sm font-medium ${theme.muted}`}>
                {membership?.role === "owner"
                  ? "Proprietario"
                  : "Membro"}{" "}
                · posizione #{position || "-"}
              </p>
            </div>
          </div>

          <CloseButton
            onClick={onClose}
            theme={theme}
            isDark={isDark}
          />
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3">
          <MetricCard
            label="Posizione"
            value={`#${position || "-"}`}
            theme={theme}
          />

          <MetricCard
            label="Settimana"
            value={weeklyTotal.toLocaleString("it-IT")}
            theme={theme}
          />

          <MetricCard
            label="Storico"
            value={lifetimeTotal.toLocaleString("it-IT")}
            theme={theme}
          />
        </div>

        <Panel theme={theme} className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-sm font-bold ${theme.primaryText}`}>
              Contributo settimanale
            </p>

            <span className="text-sm font-black text-pink-500">
              {weeklyTotal.toLocaleString("it-IT")}
            </span>
          </div>

          <div
            className={`mt-3 h-2 overflow-hidden rounded-full ${
              isDark ? "bg-white/[0.08]" : "bg-zinc-900/[0.08]"
            }`}
          >
            <motion.div
              initial={
                prefersReducedMotion ? false : { width: 0 }
              }
              animate={{
                width: `${weeklyContribution}%`,
              }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                ease: "easeOut",
              }}
              className="h-full rounded-full bg-pink-500"
            />
          </div>
        </Panel>
      </div>
    </ModalShell>
  );
}

function MetricCard({ label, value, theme }) {
  return (
    <Panel theme={theme} padding="sm">
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.1em] ${theme.subtle}`}
      >
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black tracking-tight ${theme.primaryText}`}
      >
        {value}
      </p>
    </Panel>
  );
}