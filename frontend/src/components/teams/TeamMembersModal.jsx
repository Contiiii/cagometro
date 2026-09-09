import { Crown } from "lucide-react";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";

const avatarGradients = [
  "from-pink-400 to-fuchsia-600",
  "from-violet-400 to-indigo-600",
  "from-sky-400 to-blue-600",
  "from-emerald-300 to-teal-600",
  "from-amber-300 to-orange-500",
];

function getAvatarGradient(userId = "") {
  const normalizedId = String(userId || "");

  const value = [...normalizedId].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return avatarGradients[value % avatarGradients.length];
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamMembersModal({
  team,
  members,
  leaderboard,
  currentUserId,
  theme,
  isDark,
  prefersReducedMotion,
  onClose,
  onTransferOwnership,
  onRemoveMember,
}) {
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
              Gestione squadra
            </p>

            <h2
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

        <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {members.map((member) => {
            const isOwner = member.role === "owner";
            const isCurrentUser =
              member.user_id === currentUserId;

            const leaderboardData = leaderboard.find(
              (item) => item.user_id === member.user_id,
            );

            return (
              <div
                key={member.user_id}
                className={`rounded-2xl border p-4 ${theme.softSurface}`}
              >
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
                        <span className="rounded-full bg-pink-500/12 px-2 py-0.5 text-[10px] font-extrabold text-pink-500">
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
                        className={`min-h-11 rounded-xl border text-xs font-bold ${theme.secondary}`}
                      >
                        Rendi proprietario
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onRemoveMember(member)
                        }
                        className="min-h-11 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-500"
                      >
                        Rimuovi
                      </button>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
}