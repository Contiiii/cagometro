import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useEntries } from "../hooks/useEntries";

import { useMemo } from "react";

import {
  ACHIEVEMENTS,
  getAchievementProgress,
} from "../config/achievements.js";

import { useEntries } from "../hooks/useEntries";

import { motion } from "framer-motion";

import { calculateStreak, getTotalHistorical } from "../utils/stats";

export default function Achievements() {
  const { entries } = useEntries();

  const totalHistorical = useMemo(() => getTotalHistorical(entries), [entries]);

  const streak = useMemo(() => calculateStreak(entries), [entries]);

  const achievements = useMemo(() => {
    return ACHIEVEMENTS.map((achievement) => {
      const progress = getAchievementProgress(achievement, {
        total: totalHistorical,
        streak,
      });

      return {
        ...achievement,
        progress,
        unlocked: progress >= achievement.target,
      };
    });
  }, [totalHistorical, streak]);

  const completedAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.unlocked).length,
    [achievements],
  );

  const completionPercentage =
    achievements.length > 0
      ? Math.round((completedAchievements / achievements.length) * 100)
      : 0;

  return (
    <div
      className="
        relative
        min-h-dvh
        overflow-x-hidden
        bg-black
        pb-28
        text-white
      "
    >
      {/* Luce decorativa */}
      <div
        className="
          pointer-events-none
          fixed
          left-1/2
          top-1/3
          h-80
          w-80
          -translate-x-1/2
          rounded-full
          bg-pink-500/10
          blur-[130px]
        "
      />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Header />

        <main
          className="
            mx-auto
            flex
            w-full
            max-w-3xl
            flex-1
            flex-col
            gap-5
            px-4
            py-6
            sm:px-6
          "
        >
          {/* Intestazione */}
          <div>
            <h1 className="text-3xl font-black text-pink-400">
              🏆 Achievements
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Completa le missioni e conquista tutti i traguardi
            </p>
          </div>

          {/* Progresso complessivo */}
          <div
            className="
              relative
              overflow-hidden
              rounded-[2rem]
              border
              border-pink-500/20
              bg-gradient-to-br
              from-pink-500/15
              via-zinc-900/70
              to-zinc-950
              p-6
              shadow-xl
              shadow-pink-500/10
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-10
                -top-10
                h-36
                w-36
                rounded-full
                bg-pink-500/15
                blur-3xl
              "
            />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">
                    Collezione completata
                  </p>

                  <p className="mt-2 text-4xl font-black text-pink-400">
                    {completedAchievements}
                    <span className="text-xl text-zinc-500">
                      {" "}
                      / {achievements.length}
                    </span>
                  </p>
                </div>

                <div
                  className="
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-pink-500/20
                    bg-pink-500/10
                    text-3xl
                  "
                >
                  🏆
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div
                  className="
                    h-3
                    flex-1
                    overflow-hidden
                    rounded-full
                    bg-zinc-800
                    shadow-inner
                  "
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${completionPercentage}%`,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-pink-600
                      to-pink-400
                      shadow-[0_0_14px_rgba(244,114,182,0.45)]
                    "
                  />
                </div>

                <span className="min-w-10 text-right text-sm font-bold text-pink-300">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Lista Achievement */}
          <div className="flex flex-col gap-4">
            {achievements.map((achievement, index) => {
              const currentProgress = Math.min(
                achievement.progress,
                achievement.target,
              );

              const progressPercentage = Math.min(
                Math.round((achievement.progress / achievement.target) * 100),
                100,
              );

              return (
                <motion.div
                  key={achievement.id}
                  initial={{
                    opacity: 0,
                    y: 16,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  whileHover={{
                    y: -3,
                  }}
                  className={
                    achievement.unlocked
                      ? `
                        relative
                        overflow-hidden
                        rounded-3xl
                        border
                        border-pink-500/25
                        bg-gradient-to-r
                        from-pink-500/10
                        to-zinc-900/70
                        p-5
                        shadow-lg
                        shadow-pink-500/10
                      `
                      : `
                        relative
                        overflow-hidden
                        rounded-3xl
                        border
                        border-zinc-800
                        bg-zinc-900/50
                        p-5
                        transition-colors
                        duration-300
                        hover:border-pink-500/25
                      `
                  }
                >
                  {achievement.unlocked && (
                    <div
                      className="
                        pointer-events-none
                        absolute
                        -right-12
                        -top-12
                        h-28
                        w-28
                        rounded-full
                        bg-pink-500/10
                        blur-3xl
                      "
                    />
                  )}

                  <div className="relative flex items-start gap-4">
                    {/* Icona */}
                    <div
                      className={
                        achievement.unlocked
                          ? `
                            flex
                            h-14
                            w-14
                            shrink-0
                            items-center
                            justify-center
                            rounded-2xl
                            border
                            border-pink-500/20
                            bg-pink-500/10
                            text-3xl
                          `
                          : `
                            flex
                            h-14
                            w-14
                            shrink-0
                            items-center
                            justify-center
                            rounded-2xl
                            border
                            border-zinc-800
                            bg-zinc-950/70
                            text-3xl
                            grayscale
                            opacity-50
                          `
                      }
                    >
                      {achievement.icon}
                    </div>

                    {/* Contenuto */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className={
                              achievement.unlocked
                                ? "text-lg font-bold text-white"
                                : "text-lg font-bold text-zinc-400"
                            }
                          >
                            {achievement.title}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            {achievement.description}
                          </p>
                        </div>

                        <span
                          className={
                            achievement.unlocked
                              ? `
                                shrink-0
                                rounded-full
                                border
                                border-green-400/20
                                bg-green-400/10
                                px-2.5
                                py-1
                                text-xs
                                font-semibold
                                text-green-300
                              `
                              : `
                                shrink-0
                                rounded-full
                                border
                                border-zinc-700
                                bg-zinc-800/70
                                px-2.5
                                py-1
                                text-xs
                                font-semibold
                                text-zinc-500
                              `
                          }
                        >
                          {achievement.unlocked ? "Completato" : "Bloccato"}
                        </span>
                      </div>

                      {/* Barra di avanzamento */}
                      <div className="mt-4 flex items-center gap-3">
                        <div
                          className="
                            h-2.5
                            flex-1
                            overflow-hidden
                            rounded-full
                            bg-zinc-800
                            shadow-inner
                          "
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${progressPercentage}%`,
                            }}
                            transition={{
                              duration: 0.7,
                              delay: 0.15 + index * 0.07,
                              ease: "easeOut",
                            }}
                            className={
                              achievement.unlocked
                                ? `
                                  h-full
                                  rounded-full
                                  bg-gradient-to-r
                                  from-green-500
                                  to-green-300
                                `
                                : `
                                  h-full
                                  rounded-full
                                  bg-gradient-to-r
                                  from-pink-600
                                  to-pink-400
                                `
                            }
                          />
                        </div>

                        <span
                          className="
                            min-w-fit
                            text-xs
                            font-medium
                            text-zinc-400
                          "
                        >
                          {currentProgress} / {achievement.target}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-zinc-600">
                        {achievement.unlocked
                          ? "Missione completata con successo"
                          : `${progressPercentage}% completato`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
