import { Check, LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";

export default function AchievementCard({
  achievement,
  index,
  theme,
  isDark,
  accentStyles,
  prefersReducedMotion,
  animateEntrance = true,
  onClick,
}) {
  const icon = achievement.icon;
  const style = accentStyles[achievement.accent];

  const progress = achievement.target
    ? Math.min(
        100,
        Math.round(
          (achievement.progress / achievement.target) * 100,
        ),
      )
    : 0;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={
        prefersReducedMotion
          ? false
          : animateEntrance
            ? { opacity: 0, y: 12 }
            : { opacity: 0 }
      }
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: prefersReducedMotion
          ? 0
          : animateEntrance
            ? 0.24
            : 0.18,
        delay: prefersReducedMotion
          ? 0
          : animateEntrance
            ? index * 0.035
            : 0,
      }}
      className={`group overflow-hidden rounded-[1.75rem] border p-4 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.surface}`}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-[1.1rem] ${
            achievement.unlocked ? style.solid : style.soft
          }`}
        >
          <span className="text-xl">{icon}</span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-base font-black tracking-tight ${
                achievement.unlocked
                  ? theme.text
                  : theme.muted
              }`}
            >
              {achievement.title}
            </h3>

            {achievement.unlocked && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-500">
                <Check
                  className="h-3 w-3"
                  strokeWidth={2.5}
                />
                Ottenuto
              </span>
            )}
          </div>

          <p
            className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}
          >
            {achievement.secret
              ? "Qualcosa è nascosto qui. Nessuno rovina la sorpresa."
              : achievement.description}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 rounded-[1.1rem] border p-3 ${theme.surfaceAlt}`}
      >
        {achievement.unlocked ? (
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold ${theme.muted}`}
            >
              Sbloccato {achievement.unlockedAt}
            </span>

            <span
              className={`text-xs font-black ${
                style.text
              }`}
            >
              +{achievement.xp} XP
            </span>
          </div>
        ) : achievement.secret ? (
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold ${theme.muted}`}
            >
              Segreto
            </span>

            <LockKeyhole
              className={`h-4 w-4 ${theme.muted}`}
              strokeWidth={2.2}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold ${theme.muted}`}
              >
                {achievement.progress} / {achievement.target}
              </span>

              <span
                className={`text-xs font-extrabold ${
                  style.text
                }`}
              >
                {progress}%
              </span>
            </div>

            <div
              className={`mt-2 h-1.5 overflow-hidden rounded-full ${
                isDark
                  ? "bg-white/[0.08]"
                  : "bg-zinc-900/[0.08]"
              }`}
            >
              <motion.div
                initial={false}
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.45,
                }}
                className={`h-full rounded-full ${style.line}`}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] ${style.border} ${style.text}`}
        >
          {achievement.rarity}
        </span>

        <span
          className={`text-xs font-semibold ${theme.subtle}`}
        >
          Tocca per aprire
        </span>
      </div>
    </motion.button>
  );
}