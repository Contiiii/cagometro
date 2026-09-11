import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

import Card from "../ui/Card";
import Section from "../ui/Section";

export default function ReportHeroCard({
  report,
  total,
  average,
  averageLabel,
  change,
  difference,
  theme,
  isDark,
  prefersReducedMotion,
  onShare,
}) {
  const isNegative = change < 0;
  const isDecrease = difference < 0;
  return (
    <Section
      as={motion.section}
      key={report.label}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
    >
      <Card theme={theme}>
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pink-500/[0.07] blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold ${theme.muted}`}>
            Registrazioni nel periodo
          </p>

          <motion.output
            key={total}
            aria-live="polite"
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 8, scale: 0.95 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`mt-2 block text-[clamp(5rem,19vw,8rem)] font-black leading-[0.8] tracking-[-0.11em] ${theme.text}`}
          >
            {total}
          </motion.output>

          <p className={`mt-5 text-sm font-semibold ${theme.muted}`}>
            Media:{" "}
            <span className={theme.text}>
              {average.toFixed(1)} {averageLabel}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-extrabold ${
    isNegative
      ? "bg-red-500/[0.10] text-red-500"
      : "bg-emerald-500/[0.10] text-emerald-500"
  }`}
>
  {isNegative ? (
    <TrendingDown
      className="h-4 w-4"
      strokeWidth={2.4}
    />
  ) : (
    <TrendingUp
      className="h-4 w-4"
      strokeWidth={2.4}
    />
  )}

  {!isNegative && change > 0 ? "+" : ""}
  {change}%
</span>

          <button
            type="button"
            onClick={onShare}
            className="rounded-xl bg-pink-500 px-4 py-2 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)] transition hover:bg-pink-400"
          >
            📤 Condividi
          </button>
        </div>
      </div>

      <div
        className={`relative mt-8 border-t pt-5 ${
          isDark ? "border-white/[0.08]" : "border-zinc-900/[0.08]"
        }`}
      >
        <p
          className={`max-w-[48ch] text-base font-bold leading-relaxed ${theme.text}`}
        >
          Hai registrato{" "}
<span
  className={
    isDecrease
      ? "text-red-500"
      : "text-pink-500"
  }
>
  {Math.abs(difference)} attività{" "}
  {isDecrease ? "in meno" : "in più"}
</span>{" "}
rispetto a {report.previousLabel}.
        </p>
      </div>
    </Card>
    </Section>
  );
}
