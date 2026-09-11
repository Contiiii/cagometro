import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

import Card from "../ui/Card";
import HeroMetric from "./HeroMetric";

export default function AchievementsHero({
  unlocked,
  allAchievements,
  inProgress,
  overallProgress,
  theme,
  isDark,
  circumference,
  dashOffset,
  prefersReducedMotion,
}) {
  return (
    <Card
      as="section"
      theme={theme}
      className="mx-auto mt-5 max-w-2xl sm:mt-7"
    >
      <div className="pointer-events-none absolute -right-12 top-2 h-36 w-36 rounded-full bg-pink-500/[0.07] blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold ${theme.muted}`}>
            Progressione totale
          </p>

          <p
            className={`mt-2 text-4xl font-black tracking-[-0.06em] ${theme.text}`}
          >
            {unlocked.length}
            <span className={`text-xl ${theme.subtle}`}>
              {" "}
              / {allAchievements.length}
            </span>
          </p>

          <p className={`mt-1 text-sm font-semibold ${theme.muted}`}>
            {overallProgress}% completato
          </p>
        </div>

        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="44"
              strokeWidth="10"
              className={
                isDark
                  ? "stroke-white/[0.08]"
                  : "stroke-zinc-900/[0.08]"
              }
              fill="none"
            />

            <motion.circle
              cx="60"
              cy="60"
              r="44"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              className="stroke-pink-500"
              initial={false}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.7,
              }}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: circumference,
              }}
            />
          </svg>

          <div className="absolute inset-0 grid place-items-center">
            <Trophy
              className="h-8 w-8 text-pink-500"
              strokeWidth={2.2}
            />
          </div>
        </div>
      </div>

      <div
        className={`relative mt-5 border-t ${
          isDark
            ? "border-white/[0.08]"
            : "border-zinc-900/[0.08]"
        }`}
      >
        <div className="grid grid-cols-3 pt-4">
          <HeroMetric
            label="Ottenuti"
            value={unlocked.length}
            theme={theme}
          />

          <HeroMetric
            label="In corso"
            value={inProgress.length}
            theme={theme}
            bordered
            isDark={isDark}
          />

          <HeroMetric
            label="Segreti"
            value={
              allAchievements.filter((a) => a.secret).length
            }
            theme={theme}
          />
        </div>
      </div>
    </Card>
  );
}