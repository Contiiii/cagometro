import { AnimatePresence, motion } from "framer-motion";

export default function AchievementUnlockModal({
  achievement,
  open,
  onClose,
  theme,
  prefersReducedMotion,
}) {
  if (!achievement) return null;

  const Icon = achievement.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] grid place-items-center bg-black/85 backdrop-blur-lg p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <motion.span
              key={item}
              initial={{
                opacity: 1,
                scale: 0.4,
                x: 0,
                y: 0,
              }}
              animate={{
                opacity: 0,
                scale: 1.25,
                x: Math.cos((item * Math.PI) / 4) * 160,
                y: Math.sin((item * Math.PI) / 4) * 160,
              }}
              transition={{
                duration: 0.9,
                ease: "easeOut",
              }}
              className={`absolute h-3 w-3 rounded-full ${
                item % 2 === 0 ? "bg-pink-400" : "bg-amber-400"
              }`}
            />
          ))}

          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={
              prefersReducedMotion
                ? false
                : {
                    opacity: 0,
                    scale: 0.82,
                    y: 30,
                  }
            }
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.92,
            }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 24,
            }}
            className={`relative z-10 w-full max-w-sm overflow-hidden rounded-[2rem] border shadow-2xl ${theme.sheet}`}
          >
            <div className="p-8 text-center">
              {typeof Icon === "string" ? (
                <span className="text-5xl">{Icon}</span>
              ) : (
                <Icon className="h-10 w-10" strokeWidth={2.3} />
              )}

              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-pink-500">
                Achievement ottenuto
              </p>

              <h2
                className={`mt-3 text-3xl font-black tracking-[-0.06em] ${theme.text}`}
              >
                {achievement.title}
              </h2>

              <p
                className={`mt-3 text-sm font-medium leading-relaxed ${theme.muted}`}
              >
                {achievement.description}
              </p>

              <div className="mt-6">
                <span className="rounded-full bg-pink-500/10 px-4 py-2 text-sm font-black text-pink-500">
                  +{achievement.xp} XP
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-8 flex min-h-12 w-full items-center justify-center rounded-2xl bg-pink-500 text-sm font-extrabold text-white transition hover:bg-pink-400"
              >
                Continua
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
