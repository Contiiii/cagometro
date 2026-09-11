import { useId } from "react";
import { Crown } from "lucide-react";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";
import Panel from "../ui/Panel";

import { useTeamUI } from "../../hooks/useTeamUI";

import { getAvatarGradient, getInitials } from "../../utils/avatar";

export default function TeamMembersModal({
  team,
  members,
  leaderboard,
  currentUserId,
  onClose,
  onTransferOwnership,
  onRemoveMember,
  restoreFocusRef,
}) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();

  const titleId = useId();

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={onClose}
      restoreFocusRef={restoreFocusRef}
      labelledBy={titleId}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              Gestione squadra
            </p>

            <h2
              id={titleId}
              className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
            >
              Membri e ruoli ({members.length})
            </h2>
          </div>

          <CloseButton
            onClick={onClose}
            theme={theme}
            isDark={isDark}
          />
        </div>

        <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto overscroll-contain pr-1">
          {members.map((member) => {
            const isOwner = member.role === "owner";
            const isCurrentUser =
              member.user_id === currentUserId;

            const leaderboardData = leaderboard.find(
              (item) => item.user_id === member.user_id,
            );

            return (
              <Panel theme={theme} key={member.user_id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                      member.user_id,
                    )} text-xs font-black text-white`}
                  >
                    {getInitials(
                      member.display_name || "Utente",
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate font-extrabold ${theme.primaryText}`}
                      >
                        {member.display_name || "Utente"}
                      </p>

                      {isCurrentUser && (
                        <span className="rounded-full bg-pink-500/12 px-2 py-0.5 text-[10px] font-extrabold text-pink-600 dark:text-pink-300">
                          TU
                        </span>
                      )}

                      {isOwner && (
                        <Crown
                          className="h-4 w-4 text-amber-500"
                          strokeWidth={2.4}
                        />
                      )}
                    </div>

                    <p className={`text-xs ${theme.muted}`}>
                      {isOwner ? "Proprietario" : "Membro"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-black ${theme.primaryText}`}
                    >
                      {Number(
                        leaderboardData?.lifetime_total || 0,
                      ).toLocaleString("it-IT")}
                    </p>

                    <p className={`text-xs ${theme.muted}`}>
                      storico
                    </p>
                  </div>
                </div>

                {team?.role === "owner" &&
                  !isCurrentUser && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onTransferOwnership(member)
                        }
                        aria-label={`Rendi proprietario ${member.display_name || "membro"}`}
                        className={`min-h-11 rounded-xl border text-xs font-bold ${theme.secondary}`}
                      >
                        Rendi proprietario
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onRemoveMember(member)
                        }
                        aria-label={`Rimuovi ${member.display_name || "membro"}`}
                        className="min-h-11 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400"
                      >
                        Rimuovi
                      </button>
                    </div>
                  )}
              </Panel>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
}