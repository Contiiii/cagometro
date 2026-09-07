import { motion } from "framer-motion";

export default function DailyCounter({
  todayCount,
  theme,
  prefersReducedMotion,
}) {
  return (
    <div className="relative flex items-start justify-between gap-4">
      <div>
        <p className={`text-sm font-semibold ${theme.muted}`}>
          Registrazioni di oggi
        </p>

        <div className="mt-1 flex items-end gap-3">
          <motion.output
            aria-live="polite"
            aria-label={`${todayCount} registrazioni effettuate oggi`}
            key={todayCount}
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 8, scale: 0.92 }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 24,
            }}
            className={`text-[clamp(4.5rem,17vw,7rem)] font-black leading-none tracking-[-0.09em] ${theme.primaryText}`}
          >
            {todayCount}
          </motion.output>

          <span
            className={`mb-3 text-sm font-semibold ${theme.muted}`}
          >
            {todayCount === 1 ? "volta" : "volte"}
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.08] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.65)]" />
        <span className="text-xs font-bold text-emerald-500">
          Live
        </span>
      </div>
    </div>
  );
}