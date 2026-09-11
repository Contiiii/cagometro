import { Check, LockKeyhole, X } from "lucide-react";
import { motion } from "framer-motion";

import ModalShell from "../teams/ModalShell";

export default function AchievementDetailModal({
  achievement,
  isUnlocked,
  isDark,
  theme,
  prefersReducedMotion,
  onClose,
}) {

  const icon = achievement.icon;
  const progress = achievement.target
    ? Math.min(
        100,
        Math.round((achievement.progress / achievement.target) * 100),
      )
    : 0;

  const styles = {
    pink: {
      solid: "bg-pink-500 text-white",
      soft: "bg-pink-500/10 text-pink-500",
      text: "text-pink-500",
      progress: "bg-pink-500",
    },
    amber: {
      solid: "bg-amber-500 text-zinc-950",
      soft: "bg-amber-400/15 text-amber-500",
      text: "text-amber-500",
      progress: "bg-amber-500",
    },
    emerald: {
      solid: "bg-emerald-500 text-white",
      soft: "bg-emerald-500/10 text-emerald-500",
      text: "text-emerald-500",
      progress: "bg-emerald-500",
    },
    zinc: {
      solid: isDark ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-white",
      soft: isDark
        ? "bg-zinc-800 text-zinc-400"
        : "bg-zinc-900/10 text-zinc-500",
      text: isDark ? "text-zinc-400" : "text-zinc-500",
      progress: "bg-zinc-500",
    },
  };

  const accent = styles[achievement.accent];

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={onClose}
      labelledBy="achievement-title"
      maxWidth="max-w-md"
      maxHeight=""
      overlayClass="bg-zinc-950/60"
      overflowClass="overflow-hidden"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div
            className={`grid h-16 w-16 place-items-center rounded-[1.4rem] ${
              isUnlocked ? accent.solid : accent.soft
            }`}
          >
            <span className="text-4xl">{icon}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi dettaglio traguardo"
            className={`grid h-11 w-11 place-items-center rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.surfaceAlt}`}
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        <p
          className={`mt-7 text-xs font-bold uppercase tracking-[0.13em] ${theme.subtle}`}
        >
          {achievement.rarity}
        </p>

        <h2
          id="achievement-title"
          className={`mt-2 text-3xl font-black tracking-[-0.06em] ${theme.text}`}
        >
          {achievement.title}
        </h2>

        <p
          className={`mt-3 text-sm font-medium leading-relaxed ${theme.muted}`}
        >
          {achievement.secret
            ? "Il requisito verrà rivelato solo quando i dati decideranno che te lo sei meritato."
            : achievement.description}
        </p>

        {isUnlocked ? (
          <div
            className={`mt-7 rounded-[1.5rem] border p-5 ${theme.surfaceAlt}`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm font-extrabold text-emerald-500">
                <Check className="h-5 w-5" strokeWidth={2.5} />
                Traguardo ottenuto
              </span>

              <span className={`text-sm font-black ${theme.text}`}>
                +{achievement.xp} XP
              </span>
            </div>

            <p className={`mt-4 text-xs font-semibold ${theme.muted}`}>
              Sbloccato il {achievement.unlockedAt}.
            </p>
          </div>
        ) : !achievement.secret ? (
          <div
            className={`mt-7 rounded-[1.5rem] border p-5 ${theme.surfaceAlt}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${theme.text}`}>
                Progresso attuale
              </span>
              <span
                className={`text-sm font-black ${accent.text}`}
              >
                {achievement.progress} / {achievement.target}
              </span>
            </div>

            <div
              className={`mt-4 h-2.5 overflow-hidden rounded-full ${
                isDark ? "bg-white/[0.08]" : "bg-zinc-900/[0.08]"
              }`}
            >
              <motion.div
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.55 }}
                className={`h-full rounded-full ${accent.progress}`}
              />
            </div>

            <p
              className={`mt-4 text-xs font-semibold leading-relaxed ${theme.muted}`}
            >
              {achievement.note}
            </p>
          </div>
        ) : (
          <div
            className={`mt-7 rounded-[1.5rem] border p-5 ${theme.surfaceAlt}`}
          >
            <LockKeyhole
              className={`h-6 w-6 ${theme.muted}`}
              strokeWidth={2.2}
            />
            <p
              className={`mt-4 text-sm font-semibold leading-relaxed ${theme.muted}`}
            >
              {achievement.note}
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
