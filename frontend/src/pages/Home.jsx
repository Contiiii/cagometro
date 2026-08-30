import Header from "../components/Header.jsx";
import Streak from "../components/Streak.jsx";
import PoopButton from "../components/PoopButton.jsx";
import UndoBotton from "../components/UndoBotton.jsx";
import BottomNav from "../components/BottomNav.jsx";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import { calculateStreak } from "../utils/stats";

import {
  loadEntries,
  saveEntries,
  getBestStreak,
  saveBestStreak,
  getShownAchievements,
  saveShownAchievements,
} from "../utils/storage";

function App() {
  const today = new Date().toISOString().split("T")[0];

  const [entries, setEntries] = useState(loadEntries);

  const [unlockedAchievement, setUnlockedAchievement] = useState(null);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const todayCount = entries[today] || 0;

  function checkAchievements(total, currentStreak) {
    const shownAchievements = getShownAchievements();

    const achievements = [
      {
        title: "Prima Cacca",
        unlocked: total >= 1,
      },
      {
        title: "Abitudinario",
        unlocked: total >= 10,
      },
      {
        title: "Veterano",
        unlocked: total >= 100,
      },
      {
        title: "Costante",
        unlocked: currentStreak >= 7,
      },
      {
        title: "Leggenda",
        unlocked: currentStreak >= 30,
      },
    ];

    let updated = [...shownAchievements];

    achievements.forEach((achievement) => {
      if (
        achievement.unlocked &&
        !shownAchievements.includes(achievement.title)
      ) {
        setUnlockedAchievement(achievement);

        setTimeout(() => {
          setUnlockedAchievement(null);
        }, 3000);

        toast.success(`🏆 ${achievement.title}`, {
          duration: 4000,
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid rgba(244,114,182,.3)",
            borderRadius: "16px",
            padding: "12px 16px",
          },
        });

        updated.push(achievement.title);
      }
    });

    saveShownAchievements(updated);
  }

  const bestStreak = getBestStreak();
  const streak = calculateStreak(entries);

  useEffect(() => {
    const savedBestStreak = getBestStreak();

    if (streak > savedBestStreak) {
      saveBestStreak(streak);
    }
  }, [streak]);

  return (
    <div
      className="App
                  pb-24 
                  px-4 
                  text-white 
                  flex 
                  flex-col 
                  bg-gradient-to-b 
                  bg-black
                  min-h-screen"
    >
      <Header />

      <main
        className="
                    flex-1
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-4"
      >
        <Streak streak={streak} bestStreak={bestStreak} />

        <div className="flex items-center flex-col text-lg text-gray-300">
          Oggi hai fatto la cacca:
        </div>

        <motion.div
          key={todayCount}
          initial={{
            scale: 1,
            rotate: 0,
          }}
          animate={{
            scale: [1, 1.25, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          className="
                      text-7xl
                      md:text-8xl
                      text-pink-400
                      font-bold
                      tracking-tight
                      drop-shadow-[0_0_30px_rgba(244,114,182,0.45)]
                    "
        >
          {todayCount}
        </motion.div>

        <PoopButton
          onClick={() => {
            const newEntries = {
              ...entries,
              [today]: todayCount + 1,
            };

            setEntries(newEntries);

            if ("vibrate" in navigator) {
              navigator.vibrate(50);
            }

            const total = Object.values(newEntries).reduce(
              (sum, value) => sum + value,
              0,
            );

            const tomorrowStreak = calculateStreak(newEntries);

            checkAchievements(total, tomorrowStreak);
          }}
        />

        <UndoBotton
          onClick={() => {
            if (todayCount > 0) {
              setEntries({
                ...entries,
                [today]: todayCount - 1,
              });
            }
          }}
        />
      </main>
      {unlockedAchievement && (
        <div
          onClick={() => setUnlockedAchievement(null)}
          className="
                      fixed
                      inset-0
                      bg-black/70
                      backdrop-blur-sm
                      flex
                      items-center
                      justify-center
                      z-50
                    "
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="
                        bg-zinc-900
                        border
                        border-pink-500/30
                        rounded-3xl
                        p-8
                        text-center
                        shadow-2xl
                        shadow-pink-500/20
                      "
          >
            <div className="text-6xl mb-4">🏆</div>

            <h2 className="text-2xl font-bold text-pink-400">
              Achievement Sbloccato!
            </h2>

            <p className="text-xl mt-4">{unlockedAchievement.title}</p>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default App;
