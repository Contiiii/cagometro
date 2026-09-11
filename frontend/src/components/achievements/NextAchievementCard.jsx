import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import Card from "../ui/Card";

export default function NextAchievementCard({
  nextAchievement,
  nextAchievementProgress,
  theme,
  isDark,
  accentStyles,
  prefersReducedMotion,
  onOpen,
}) {
  if (!nextAchievement) {
    return null;
  }

  return (
    <section className="mx-auto mt-5 max-w-2xl sm:mt-7">
      <Card theme={theme} padding="none">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-pink-500/[0.07] blur-3xl" />

        <div className="relative p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-[1.3rem] ${
                accentStyles[nextAchievement.accent].soft
              }`}
            >
              <span className="text-3xl">{nextAchievement.icon}</span>
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-bold uppercase tracking-[0.14em] ${theme.subtle}`}
              >
                Prossimo traguardo
              </p>

              <h2
                className={`mt-1 text-xl font-black tracking-[-0.04em] ${theme.text}`}
              >
                {nextAchievement.title}
              </h2>

              <p
                className={`mt-1.5 text-sm leading-relaxed ${theme.muted}`}
              >
                {nextAchievement.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpen(nextAchievement)}
              className={`group shrink-0 grid h-11 w-11 place-items-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.surfaceAlt}`}
            >
              <ChevronRight
                className={`h-5 w-5 transition-transform group-hover:translate-x-0.5 ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
                strokeWidth={2.4}
              />
            </button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${theme.muted}`}>
                {nextAchievement.progress} / {nextAchievement.target}
              </span>

              <span
                className={`text-sm font-black ${
                  accentStyles[nextAchievement.accent].text
                }`}
              >
                {nextAchievementProgress}%
              </span>
            </div>

            <div
              className={`mt-2.5 h-2 overflow-hidden rounded-full ${
                isDark ? "bg-white/[0.08]" : "bg-zinc-900/[0.08]"
              }`}
            >
              <motion.div
                initial={false}
                animate={{
                  width: `${nextAchievementProgress}%`,
                }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.55,
                }}
                className={`h-full rounded-full ${
                  accentStyles[nextAchievement.accent].line
                }`}
              />
            </div>

            <p className={`mt-3 text-xs font-semibold ${theme.muted}`}>
              {nextAchievement.note}
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}