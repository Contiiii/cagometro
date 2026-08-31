import { AnimatePresence, motion } from "framer-motion";

export default function AchievementModal({
  achievement,
  onClose,
}) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
            onClick={(e) => e.stopPropagation()}
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
              {achievement.title}
            </p>

            <p className="mt-5 text-xs text-zinc-500">
              Tocca fuori per chiudere
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}