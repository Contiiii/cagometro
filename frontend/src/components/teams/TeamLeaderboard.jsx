import { useMemo } from "react";
import { ChevronRight, Crown, Medal, Trophy } from "lucide-react";
import { motion } from "framer-motion";

import { getAvatarGradient, getInitials } from "../../utils/avatar";
import { useTeamUI } from "../../context/TeamUIContext";
import { useTeamSelection } from "../../hooks/useTeamSelection";

import Card from "../ui/Card";
import IconTile from "../ui/IconTile";

function getRankStyle(rank, isDark) {
  if (rank === 1) {
    return isDark
      ? "border-amber-300/25 bg-amber-300/15 text-amber-300"
      : "border-amber-500/25 bg-amber-400/15 text-amber-700";
  }

  if (rank === 2) {
    return isDark
      ? "border-zinc-300/20 bg-zinc-200/10 text-zinc-200"
      : "border-zinc-500/20 bg-zinc-500/10 text-zinc-700";
  }

  if (rank === 3) {
    return isDark
      ? "border-orange-300/20 bg-orange-300/10 text-orange-300"
      : "border-orange-500/20 bg-orange-400/15 text-orange-700";
  }

  return isDark
    ? "border-white/[0.08] bg-white/[0.05] text-zinc-400"
    : "border-zinc-900/[0.08] bg-zinc-900/[0.04] text-zinc-500";
}

function getPodiumTitle(position) {
  if (position === 1) {
    return {
      title: "Re del WC",
      emoji: "👑",
      className: "text-amber-500",
    };
  }

  if (position === 2) {
    return {
      title: "Maestro dello Sciacquone",
      emoji: "🥈",
      className: "text-zinc-400 dark:text-zinc-300",
    };
  }

  if (position === 3) {
    return {
      title: "Cavaliere della Tazza",
      emoji: "🥉",
      className: "text-orange-500 dark:text-orange-300",
    };
  }

  return null;
}

export default function TeamLeaderboard({
  leaderboard = [],
  members = [],
  currentUserId,
  rankingMode,
  onRankingChange,
}) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();
  const { selectMember } = useTeamSelection();
  const ranking = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      const aScore =
        rankingMode === "week"
          ? Number(a.weekly_total || 0)
          : Number(a.lifetime_total || 0);

      const bScore =
        rankingMode === "week"
          ? Number(b.weekly_total || 0)
          : Number(b.lifetime_total || 0);

      if (bScore !== aScore) {
        return bScore - aScore;
      }

      return String(a.display_name || "").localeCompare(
        String(b.display_name || ""),
        "it",
      );
    });
  }, [leaderboard, rankingMode]);

  return (
    <section className="mx-auto mt-7 max-w-3xl">
      <div className="flex items-end justify-between gap-4">
        <h2
          className={`text-2xl font-black tracking-[-0.055em] ${theme.primaryText}`}
        >
          La classifica
        </h2>

        <div className={`flex rounded-xl border p-1 ${theme.softSurface}`}>
          <RankingButton
            active={rankingMode === "week"}
            onClick={() => onRankingChange("week")}
            isDark={isDark}
            theme={theme}
          >
            Settimana
          </RankingButton>

          <RankingButton
            active={rankingMode === "all"}
            onClick={() => onRankingChange("all")}
            isDark={isDark}
            theme={theme}
          >
            Storico
          </RankingButton>
        </div>
      </div>

      <Card theme={theme} radius="panel" padding="none" className="mt-4">
        {ranking.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Trophy
              className={`mx-auto h-7 w-7 ${theme.subtle}`}
              strokeWidth={1.8}
            />

            <p className={`mt-3 text-sm font-bold ${theme.primaryText}`}>
              Nessun punteggio disponibile
            </p>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              Le registrazioni della squadra appariranno qui.
            </p>
          </div>
        ) : (
          ranking.map((member, index) => {
            const position = index + 1;
            const podiumTitle = getPodiumTitle(position);
            const isCurrentUser = member.user_id === currentUserId;

            const membership = members.find(
              (item) => item.user_id === member.user_id,
            );

            const isOwner = membership?.role === "owner";

            const avatarGradient =
              member.avatar || getAvatarGradient(member.user_id);

            const weeklyTotal = Number(member.weekly_total || 0);

            const lifetimeTotal = Number(member.lifetime_total || 0);

            const metric = rankingMode === "week" ? weeklyTotal : lifetimeTotal;

            return (
              <motion.button
                layout
                key={member.user_id}
                type="button"
                onClick={() => selectMember(member.user_id)}
                initial={
                  prefersReducedMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 10,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={
                  prefersReducedMotion
                    ? {
                        duration: 0,
                      }
                    : {
                        layout: {
                          type: "spring",
                          stiffness: 450,
                          damping: 35,
                        },
                        delay: index * 0.04,
                        duration: 0.24,
                      }
                }
                className={`flex min-h-[82px] w-full items-center gap-3 px-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
                  isCurrentUser
                    ? isDark
                      ? "bg-pink-500/[0.10]"
                      : "bg-pink-500/[0.07]"
                    : isDark
                      ? "hover:bg-white/[0.045]"
                      : "hover:bg-zinc-900/[0.035]"
                } ${
                  index !== ranking.length - 1
                    ? isDark
                      ? "border-b border-white/[0.07]"
                      : "border-b border-zinc-900/[0.07]"
                    : ""
                }`}
              >
                <IconTile
                  size="xs"
                  className={`border text-xs font-black ${getRankStyle(
                    position,
                    isDark,
                  )}`}
                >
                  {position === 1 ? (
                    <Crown
                      className="h-4 w-4"
                      strokeWidth={2.2}
                      aria-label="Primo posto"
                    />
                  ) : position === 2 || position === 3 ? (
                    <Medal
                      className="h-4 w-4"
                      strokeWidth={2.2}
                      aria-label={`${position}° posto`}
                    />
                  ) : (
                    position
                  )}
                </IconTile>

                <IconTile
                  size="lg"
                  className={`bg-gradient-to-br ${avatarGradient} text-xs font-black text-white`}
                >
                  {getInitials(member.display_name || "Utente")}
                </IconTile>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`truncate text-sm font-extrabold ${theme.primaryText}`}
                    >
                      {member.display_name || "Utente"}
                    </span>

                    {isCurrentUser && (
                      <span className="rounded-full bg-pink-500/12 px-2 py-0.5 text-[10px] font-extrabold text-pink-600 dark:text-pink-300">
                        TU
                      </span>
                    )}

                    {isOwner && (
                      <Crown
                        className="h-3.5 w-3.5 shrink-0 text-amber-500"
                        strokeWidth={2.4}
                        aria-label="Proprietario della squadra"
                      />
                    )}
                  </div>

                  {podiumTitle && (
                    <p
                      className={`mt-0.5 truncate text-[11px] font-extrabold ${podiumTitle.className}`}
                    >
                      {podiumTitle.emoji} {podiumTitle.title}
                    </p>
                  )}

                  <div
                    className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium ${theme.muted}`}
                  >
                    <span className="whitespace-nowrap">
                      🔥{" "}
                      {Number(member.current_streak || 0).toLocaleString(
                        "it-IT",
                      )}{" "}
                      {Number(member.current_streak || 0) === 1
                        ? "giorno"
                        : "giorni"}
                    </span>

                    <span className="whitespace-nowrap">
                      ⭐ {Number(member.xp || 0).toLocaleString("it-IT")} XP
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <p
                    className={`text-lg font-black leading-none tracking-tight ${theme.primaryText}`}
                  >
                    {metric.toLocaleString("it-IT")}
                  </p>

                  <ChevronRight
                    className={`h-4 w-4 ${theme.subtle}`}
                    strokeWidth={2.2}
                  />
                </div>
              </motion.button>
            );
          })
        )}
      </Card>
    </section>
  );
}

function RankingButton({ active, onClick, isDark, theme, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
        active
          ? isDark
            ? "bg-zinc-100 text-zinc-950 shadow-sm"
            : "bg-zinc-900 text-white shadow-sm"
          : theme.muted
      }`}
    >
      {children}
    </button>
  );
}
