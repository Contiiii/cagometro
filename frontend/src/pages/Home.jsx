import Header from "../components/Header.jsx";
import Streak from "../components/Streak.jsx";
import PoopButton from "../components/PoopButton.jsx";
import UndoBotton from "../components/UndoBotton.jsx";
import BottomNav from "../components/BottomNav.jsx";

import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { AnimatePresence, motion } from "framer-motion";

import { useEntries } from "../hooks/useEntries";
import { useStats } from "../hooks/useStats";
import { useAchievements } from "../hooks/useAchievements";

import { calculateStreak } from "../utils/stats";


function App() {
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
            onClick={() => {
              const newEntries = incrementToday();

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
        <AnimatePresence>
          {unlockedAchievement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUnlockedAchievement(null)}
              className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-black/75
              px-5
              backdrop-blur-md
            "
            >
              <motion.div
                onClick={(event) => event.stopPropagation()}
                initial={{
                  scale: 0.7,
                  opacity: 0,
                  y: 30,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  scale: 0.8,
                  opacity: 0,
                  y: 20,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 18,
                }}
                className="
                relative
                w-full
                max-w-sm
                overflow-hidden
                rounded-[2rem]
                border
                border-pink-500/30
                bg-gradient-to-b
                from-zinc-800
                via-zinc-900
                to-black
                p-8
                text-center
                shadow-2xl
                shadow-pink-500/25
              "
              >
                <div
                  className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-0
                  h-36
                  w-36
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  bg-pink-500/30
                  blur-3xl
                "
                />

                <motion.div
                  initial={{
                    rotate: -15,
                    scale: 0,
                  }}
                  animate={{
                    rotate: [0, 10, -5, 0],
                    scale: 1,
                  }}
                  transition={{
                    delay: 0.1,
                    duration: 0.5,
                  }}
                  className="
                  relative
                  mx-auto
                  mb-5
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-amber-300/30
                  bg-amber-400/10
                  text-5xl
                  shadow-lg
                  shadow-amber-400/10
                "
                >
                  🏆
                </motion.div>

                <p
                  className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.25em]
                  text-pink-400
                "
                >
                  Nuovo traguardo
                </p>

                <h2
                  className="
                  mt-3
                  text-2xl
                  font-black
                  text-white
                "
                >
                  Achievement sbloccato!
                </h2>

                <p
                  className="
                  mt-4
                  text-xl
                  font-bold
                  text-pink-300
                "
                >
                  {unlockedAchievement.title}
                </p>

                <p className="mt-5 text-xs text-zinc-500">
                  Tocca fuori per chiudere
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>
    </div>
  );
}

export default App;
