import { Flame } from "lucide-react";
import { motion } from "framer-motion";

import Card from "../ui/Card";

export default function ReportStreakCard({
  streak,
  record,
  daysToRecord,
  prefersReducedMotion,
  theme,
  isDark,
}) {
  return (
    <Card
      as="article"
      theme={theme}
      tone="softSurface"
      radius="panel"
      padding="none"
      className="p-5"
    >
      <div className="pointer-events-none absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-amber-400/[0.09] blur-2xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className={`text-sm font-bold ${theme.text}`}>
            Streak attuale
          </p>

          <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
            Il filo non si è spezzato.
          </p>
        </div>

        <Flame
          className="h-6 w-6 text-amber-500"
          strokeWidth={2.3}
        />
      </div>

      <div className="relative mt-7 flex items-end gap-2">
        <span className="text-6xl font-black leading-none tracking-[-0.09em] text-amber-500">
          {streak}
        </span>

        <span className={`mb-2 text-sm font-bold ${theme.muted}`}>
          giorni
        </span>
      </div>

      <div
        className={`relative mt-6 h-2 overflow-hidden rounded-full ${
          isDark
            ? "bg-white/[0.08]"
            : "bg-zinc-900/[0.08]"
        }`}
      >
        <motion.div
          initial={false}
          animate={{
            width:
              record > 0
                ? `${(streak / record) * 100}%`
                : "0%",
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.5,
            ease: "easeOut",
          }}
          className="h-full rounded-full bg-amber-500"
        />
      </div>

      <p className={`relative mt-3 text-xs font-semibold ${theme.muted}`}>
        {daysToRecord === 0
          ? "Hai appena eguagliato il tuo record. Evento raro."
          : `Ancora ${daysToRecord} giorni per raggiungere il record di ${record}.`}
      </p>
    </Card>
  );
}