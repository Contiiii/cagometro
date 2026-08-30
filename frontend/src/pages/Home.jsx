import Header from "../components/Header.jsx";
import Streak from "../components/Streak.jsx";
import PoopButton from "../components/PoopButton.jsx";
import UndoBotton from "../components/UndoBotton.jsx";
import BottomNav from "../components/BottomNav.jsx";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

function App() {
  const today = new Date().toISOString().split("T")[0];

  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("entries");
    return savedEntries ? JSON.parse(savedEntries) : {};
  });

  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries]);

  const todayCount = entries[today] || 0;

  function calculateStreak() {
    let streak = 0;
    const currentDate = new Date();

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];

      if ((entries[dateString] || 0) > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  function checkAchievements(total, currentStreak) {
    const shownAchievements = JSON.parse(
      localStorage.getItem("shownAchievements") || "[]",
    );

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
        toast.success(`🏆 Achievement sbloccato!\n${achievement.title}`);

        updated.push(achievement.title);
      }
    });

    localStorage.setItem("shownAchievements", JSON.stringify(updated));
  }

  const bestStreak = Number(localStorage.getItem("bestStreak") || 0);
  const streak = calculateStreak();

  useEffect(() => {
    const savedBestStreak = Number(localStorage.getItem("bestStreak") || 0);

    if (streak > savedBestStreak) {
      localStorage.setItem("bestStreak", streak);
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

        <div
          className="
                      text-7xl
                      md:text-8xl
                      text-pink-400
                      font-bold
                      tracking-tight
                      drop-shadow-[0_0_20px_rgba(244,114,182,0.35)]
                    "
        >
          {todayCount}
        </div>

        <PoopButton
          onClick={() => {
            const newEntries = {
              ...entries,
              [today]: todayCount + 1,
            };

            setEntries(newEntries);

            const total = Object.values(newEntries).reduce(
              (sum, value) => sum + value,
              0,
            );

            checkAchievements(total, streak);
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

      <BottomNav />
    </div>
  );
}

export default App;
