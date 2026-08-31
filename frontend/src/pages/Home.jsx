import Header from "../components/Header.jsx";
import Streak from "../components/Streak.jsx";
import PoopButton from "../components/PoopButton.jsx";
import UndoBotton from "../components/UndoBotton.jsx";
import BottomNav from "../components/BottomNav.jsx";
import AchievementModal from "../components/AchievementModal";

import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion";

import { useEntries } from "../hooks/useEntries";
import { useStats } from "../hooks/useStats";
import { useAchievements } from "../hooks/useAchievements";

import { calculateStreak } from "../utils/stats";
import { getLocalDateKey } from "../utils/date";

/* database */
import { useAuth } from "../hooks/useAuth";
import { saveEntry } from "../services/entriesService";

function App() {
  const { user } = useAuth();

  const {
    unlockedAchievement,
    showConfetti,
    setUnlockedAchievement,
    checkAchievements,
  } = useAchievements();

  const { entries, todayCount, incrementToday, decrementToday } = useEntries();

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { streak, bestStreak } = useStats(entries);

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
      <div className="relative z-10 flex h-full flex-col">
        <Header />

        <main
          className="
          mx-auto
          flex
          w-full
          max-w-xl
          flex-1
          flex-col
          items-center
          justify-center
          px-5
          py-5
          text-center
        "
        >
          {/* Streak */}
          <Streak streak={streak} bestStreak={bestStreak} />

          {/* Separatore */}
          <div
            className="
            my-5
            h-px
            w-28
            bg-gradient-to-r
            from-transparent
            via-pink-500/50
            to-transparent
          "
          />

          {/* Contatore */}
          <p
            className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.25em]
            text-zinc-500
          "
          >
            Cagate di oggi
          </p>

          <motion.div
            key={todayCount}
            initial={{
              scale: 0.85,
              opacity: 0,
              rotate: -4,
            }}
            animate={{
              scale: [0.85, 1.2, 1],
              opacity: 1,
              rotate: [-4, 4, 0],
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
            className="
            my-2
            text-8xl
            font-black
            tracking-tighter
            text-pink-400
            drop-shadow-[0_0_35px_rgba(244,114,182,0.45)]
            md:text-9xl
          "
          >
            {todayCount}
          </motion.div>

          {/* Pulsante principale */}
          <PoopButton
            onClick={async () => {
              const newEntries = await incrementToday();

              if (user) {

                const today = getLocalDateKey();

                await saveEntry({
                  userId: user.id,
                  date: today,
                  count: newEntries[today],
                });
              }

              if ("vibrate" in navigator) {
                navigator.vibrate(50);
              }

              const total = Object.values(newEntries).reduce(
                (sum, value) => sum + value,
                0,
              );

              const updatedStreak = calculateStreak(newEntries);

              checkAchievements(total, updatedStreak);
            }}
          />

          {/* Annulla */}
          <div className="mt-1">
            <UndoBotton onClick={decrementToday} />
          </div>
        </main>

        {/* Confetti */}
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.15}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 100,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Modale achievement */}
        <AchievementModal
          achievement={unlockedAchievement}
          onClose={() => setUnlockedAchievement(null)}
        />

        <BottomNav />
      </div>
    </div>
  );
}

export default App;
