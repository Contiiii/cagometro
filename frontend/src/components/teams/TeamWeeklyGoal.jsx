import { Flame } from "lucide-react";
import { motion } from "framer-motion";

import Card from "../ui/Card";
import IconTile from "../ui/IconTile";

import { useTeamUI } from "../../context/TeamUIContext";

export default function TeamWeeklyGoal({
  totalWeekly,
  weeklyGoal,
}) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();

  const safeGoal = Math.max(1, Number(weeklyGoal) || 1);
  const safeTotal = Math.max(0, Number(totalWeekly) || 0);

  const weeklyProgress = Math.min(
    100,
    Math.round((safeTotal / safeGoal) * 100),
  );

  const remaining = Math.max(0, safeGoal - safeTotal);

  return (
    <section className="mx-auto mt-5 max-w-3xl">
      <Card as="article" theme={theme} radius="goal" padding="none" className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-sm font-bold ${theme.primaryText}`}>
              Obiettivo settimanale
            </p>

            <p className={`mt-1 text-xs font-medium ${theme.muted}`} aria-live="polite">
              Mancano {remaining} registrazioni al traguardo.
            </p>
          </div>

          <IconTile size="md" className="bg-amber-400/15 text-amber-500">
            <Flame
              className="h-5 w-5"
              strokeWidth={2.3}
            />
          </IconTile>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <span
              className={`text-3xl font-black tracking-[-0.06em] ${theme.primaryText}`}
            >
              {safeTotal.toLocaleString("it-IT")}
            </span>

            <span className={`ml-2 text-sm font-bold ${theme.muted}`}>
              / {safeGoal.toLocaleString("it-IT")}
            </span>
          </div>

          <span className="text-sm font-extrabold text-pink-500">
            {weeklyProgress}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={weeklyProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`Obiettivo settimanale completato al ${weeklyProgress}%`}
          className={`mt-3 h-2.5 overflow-hidden rounded-full ${
            isDark
              ? "bg-white/[0.08]"
              : "bg-zinc-900/[0.08]"
          }`}
        >
          <motion.div
            initial={false}
            animate={{ width: `${weeklyProgress}%` }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.55,
              ease: "easeOut",
            }}
            className="h-full rounded-full bg-pink-500"
          />
        </div>
      </Card>
    </section>
  );
}