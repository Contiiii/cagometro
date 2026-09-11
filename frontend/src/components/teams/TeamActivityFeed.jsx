import { useState } from "react";
import {
  Activity,
  ChevronDown,
  Crown,
  Flame,
  Plus,
  UserPlus,
  UsersRound,
  Wifi,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useTeamUI } from "../../hooks/useTeamUI";

import { getAvatarGradient, getInitials } from "../../utils/avatar";

import Card from "../ui/Card";
import IconTile from "../ui/IconTile";
import Section from "../ui/Section";
import SectionHeader from "../ui/SectionHeader";

function getActivityIcon(type) {
  const icons = {
    entry_created: Plus,
    member_joined: UserPlus,
    member_left: UsersRound,
    ownership_transferred: Crown,
    member_removed: X,
    streak_bonus: Flame,
  };

  return icons[type] || Activity;
}

function getActivityStyle(type, isDark) {
  const styles = {
    entry_created: isDark
      ? "bg-pink-500/15 text-pink-400"
      : "bg-pink-500/12 text-pink-600",

    member_joined: isDark
      ? "bg-emerald-400/15 text-emerald-400"
      : "bg-emerald-500/12 text-emerald-700",

    member_left: isDark
      ? "bg-zinc-400/15 text-zinc-300"
      : "bg-zinc-500/12 text-zinc-600",

    ownership_transferred: isDark
      ? "bg-amber-400/15 text-amber-300"
      : "bg-amber-400/15 text-amber-700",

    member_removed: isDark
      ? "bg-rose-400/15 text-rose-400"
      : "bg-rose-500/12 text-rose-700",

    streak_bonus: isDark
      ? "bg-orange-400/15 text-orange-400"
      : "bg-orange-500/12 text-orange-700",
  };

  return styles[type] || styles.entry_created;
}

function getActivityText(item) {
  const displayName = item.display_name || "Un utente";
  const targetName =
    item.target_display_name || "un membro";
  const points = Number(item.points || 0);

  switch (item.activity_type) {
    case "entry_created":
      return `${displayName} ha registrato ${points} ${
        points === 1 ? "punto" : "punti"
      }`;

    case "member_joined":
      return `${displayName} è entrato nella squadra`;

    case "member_left":
      return `${displayName} ha lasciato la squadra`;

    case "ownership_transferred":
      return `${displayName} ha trasferito la proprietà${
        item.target_display_name
          ? ` a ${targetName}`
          : ""
      }`;

    case "member_removed":
      return `${displayName} ha rimosso ${targetName} dalla squadra`;

    case "streak_bonus":
      return `${displayName} ha ottenuto +${points} ${
        points === 1
          ? "punto bonus streak"
          : "punti bonus streak"
      }`;

    default:
      return `${displayName} ha aggiornato la squadra`;
  }
}

function formatActivityTime(createdAt) {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeamActivityFeed({
  activity = [],
}) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();

  const [showAllActivities, setShowAllActivities] =
    useState(false);

  const visibleActivities = showAllActivities
    ? activity
    : activity.slice(0, 3);

  return (
    <Section spacing="lg">
      <SectionHeader
        title="Attività recente"
        theme={theme}
        aside={
          <span className="flex items-center gap-1.5 pb-1 text-xs font-bold text-emerald-600 dark:text-emerald-500">
            <Wifi className="h-4 w-4" strokeWidth={2.2} />
            Live
          </span>
        }
      />

      <Card
        aria-live="polite"
        theme={theme}
        radius="panel"
        padding="none"
        className="mt-4"
      >
        {visibleActivities.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Activity
              className={`mx-auto h-7 w-7 ${theme.subtle}`}
              strokeWidth={1.8}
            />

            <p
              className={`mt-3 text-sm font-bold ${theme.primaryText}`}
            >
              Nessuna attività recente
            </p>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              Le azioni della squadra appariranno qui.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleActivities.map((item, index) => {
              const ActivityIcon = getActivityIcon(
                item.activity_type,
              );

              const avatarGradient = getAvatarGradient(
                String(item.user_id || item.id || ""),
              );

              return (
                <motion.article
                  layout
                  key={
                    item.id ||
                    `${item.activity_type}-${item.created_at}`
                  }
                  initial={
                    prefersReducedMotion
                      ? false
                      : { opacity: 0, y: -8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, height: 0 }
                  }
                  transition={{
                    duration: prefersReducedMotion
                      ? 0
                      : 0.25,
                  }}
                  className={`relative flex gap-3 px-4 py-4 ${
                    index !==
                    visibleActivities.length - 1
                      ? isDark
                        ? "border-b border-white/[0.07]"
                        : "border-b border-zinc-900/[0.07]"
                      : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <IconTile
                size="md"
                className={`bg-gradient-to-br ${avatarGradient} text-[11px] font-black text-white`}
              >
                {getInitials(item.display_name || "Utente")}
              </IconTile>

                    <span
                      className={`absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-lg ${getActivityStyle(
                        item.activity_type,
                        isDark,
                      )}`}
                    >
                      <ActivityIcon
                        className="h-3 w-3"
                        strokeWidth={2.6}
                      />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${theme.primaryText}`}
                    >
                      {getActivityText(item)}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${theme.subtle}`}
                      >
                        {formatActivityTime(
                          item.created_at,
                        )}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        )}

        {activity.length > 3 && (
          <button
            type="button"
            onClick={() =>
              setShowAllActivities((current) => !current)
            }
            aria-expanded={showAllActivities}
            className={`flex min-h-14 w-full items-center justify-center gap-2 border-t text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
              isDark
                ? "border-white/[0.07] hover:bg-white/[0.045]"
                : "border-zinc-900/[0.07] hover:bg-zinc-900/[0.035]"
            } ${theme.primaryText}`}
          >
            {showAllActivities
              ? "Mostra meno"
              : `Carica altre ${
                  activity.length - 3
                } attività`}

            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showAllActivities ? "rotate-180" : ""
              }`}
              strokeWidth={2.4}
            />
          </button>
        )}
      </Card>
    </Section>
  );
}
