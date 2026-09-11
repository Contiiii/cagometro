import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useTheme } from "../hooks/useTheme";

import { useEntries } from "../hooks/useEntries";
import { useTeam } from "../hooks/useTeam";

import AchievementDetailModal from "../components/achievements/AchievementDetailModal";
import AchievementCard from "../components/achievements/AchievementCard";
import NextAchievementCard from "../components/achievements/NextAchievementCard";
import AchievementsHero from "../components/achievements/AchievementsHero";
import AchievementFilters from "../components/achievements/AchievementFilters";
import AchievementSectionSwitcher from "../components/achievements/AchievementSectionSwitcher";

import AchievementUnlockModal from "../components/achievements/AchievementUnlockModal";

import { useAchievements } from "../hooks/useAchievements";

import {
  getAchievementTheme,
  getAchievementAccentStyles,
} from "../config/achievementTheme";

import { useAchievementsData } from "../hooks/useAchievementsData";

const filters = ["Tutti", "Ottenuti", "In corso", "Segreti"];

export default function Achievements() {
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const { entries } = useEntries();
  const { leaderboard, members } = useTeam();
  const isDark = resolvedTheme === "dark";

  const { unlockedAchievement, closeAchievement } = useAchievements();

  const [section, setSection] = useState(() => {
    return localStorage.getItem("achievements-section") || "personali";
  });
  const [activeFilter, setActiveFilter] = useState("Tutti");
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [animateEntrance, setAnimateEntrance] = useState(true);

  const switchSection = (nextSection) => {
    setSection(nextSection);
    localStorage.setItem("achievements-section", nextSection);
    setActiveFilter("Tutti");
    setAnimateEntrance(false);
  };

  const changeFilter = (filter) => {
    setActiveFilter(filter);
    setAnimateEntrance(false);
  };

  const {
    allAchievements,
    unlocked,
    inProgress,
    filteredAchievements,
    nextAchievement,
    overallProgress,
    nextAchievementProgress,
  } = useAchievementsData({
    entries,
    leaderboard,
    members,
    section,
    activeFilter,
  });

  const theme = getAchievementTheme(isDark);

  const accentStyles = getAchievementAccentStyles(isDark);

  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="La tua collezione" title="Traguardi" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <section className="mx-auto max-w-2xl">
          <p className={`text-sm font-medium ${theme.muted}`}>
            {section === "personali"
              ? "Archivio personale"
              : "Archivio della squadra"}
          </p>

          <h1
            className={`mt-1 text-[clamp(2.15rem,7vw,4rem)] font-black leading-[0.95] tracking-[-0.075em] ${theme.text}`}
          >
            I tuoi traguardi,
            <br />
            messi <span className="text-pink-500">nero su rosa.</span>
          </h1>

          <AchievementSectionSwitcher
            section={section}
            switchSection={switchSection}
            theme={theme}
            isDark={isDark}
          />
        </section>

        <AchievementsHero
          unlocked={unlocked}
          allAchievements={allAchievements}
          inProgress={inProgress}
          overallProgress={overallProgress}
          theme={theme}
          isDark={isDark}
          circumference={circumference}
          dashOffset={dashOffset}
          prefersReducedMotion={prefersReducedMotion}
        />

        <NextAchievementCard
          nextAchievement={nextAchievement}
          nextAchievementProgress={nextAchievementProgress}
          theme={theme}
          isDark={isDark}
          accentStyles={accentStyles}
          prefersReducedMotion={prefersReducedMotion}
          onOpen={setSelectedAchievement}
        />

        <section className="mx-auto mt-8 max-w-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={`text-sm font-semibold ${theme.muted}`}>
                {section === "personali"
                  ? "Archivio personale"
                  : "Archivio della squadra"}
              </p>
              <h2
                className={`mt-1 text-2xl font-black tracking-[-0.05em] ${theme.text}`}
              >
                Bacheca completa
              </h2>
            </div>

            <AchievementFilters
              filters={filters}
              activeFilter={activeFilter}
              setActiveFilter={changeFilter}
              theme={theme}
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map((achievement, index) => (
                <AchievementCard
                  key={`${section}-${achievement.id}`}
                  achievement={achievement}
                  index={index}
                  theme={theme}
                  isDark={isDark}
                  accentStyles={accentStyles}
                  prefersReducedMotion={prefersReducedMotion}
                  animateEntrance={animateEntrance}
                  onClick={() => setSelectedAchievement(achievement)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <BottomNav />

      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-3 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedAchievement(null);
              }
            }}
          >
            <AchievementDetailModal
              achievement={selectedAchievement}
              isUnlocked={selectedAchievement.unlocked}
              isDark={isDark}
              theme={theme}
              prefersReducedMotion={prefersReducedMotion}
              onClose={() => setSelectedAchievement(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AchievementUnlockModal
        achievement={unlockedAchievement}
        open={!!unlockedAchievement}
        onClose={closeAchievement}
        theme={theme}
        prefersReducedMotion={prefersReducedMotion}
      />
    </div>
  );
}
