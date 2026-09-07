import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import Header from "../components/HeaderTest";
import BottomNav from "../components/BottomNavTest";
import { useTheme } from "../hooks/useTheme";

export default function CagometroHome() {
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const [count, setCount] = useState(3);
  const [burst, setBurst] = useState(0);
  const [message, setMessage] = useState("Sei in ritmo. Continua così.");

  const registerActivity = () => {
    setCount((current) => current + 1);
    setBurst((current) => current + 1);
    setMessage("Registrazione aggiunta. Ottimo lavoro.");

    if ("vibrate" in navigator) {
      navigator.vibrate(18);
    }
  };

  const undoActivity = () => {
    if (count === 0) return;

    setCount((current) => current - 1);
    setMessage("Ultima registrazione annullata.");
  };

  const theme = isDark
    ? {
        app: "bg-[#0c0c0f] text-zinc-100",
        surface: "bg-zinc-900/80 border-white/[0.08]",
        softSurface: "bg-white/[0.035] border-white/[0.07]",
        muted: "text-zinc-400",
        subtle: "text-zinc-500",
        primaryText: "text-zinc-50",
        secondary:
          "bg-white/[0.055] border-white/[0.08] text-zinc-300 hover:bg-white/[0.09]",
        counterRing: "border-white/[0.07]",
        buttonShadow: "shadow-[0_16px_45px_rgba(236,72,153,0.30)]",
        buttonOuter: "border-pink-300/30",
      }
    : {
        app: "bg-[#f8f5f3] text-zinc-900",
        surface: "bg-white/85 border-zinc-200/80",
        softSurface: "bg-zinc-900/[0.035] border-zinc-900/[0.07]",
        muted: "text-zinc-500",
        subtle: "text-zinc-400",
        primaryText: "text-zinc-950",
        secondary:
          "bg-zinc-900/[0.045] border-zinc-900/[0.08] text-zinc-600 hover:bg-zinc-900/[0.08]",
        counterRing: "border-zinc-900/[0.07]",
        buttonShadow: "shadow-[0_16px_45px_rgba(236,72,153,0.28)]",
        buttonOuter: "border-pink-500/20",
      };

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="Bentornato" title="Cagometro" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <section className="mx-auto max-w-2xl">
          <p className={`mb-2 text-sm font-medium ${theme.muted}`}>
            Sabato, 6 settembre
          </p>
          <h1
            className={`max-w-md text-[clamp(2rem,7vw,3.6rem)] font-black leading-[0.98] tracking-[-0.065em] ${theme.primaryText}`}
          >
            Come sta andando
            <br />
            la tua <span className="text-pink-500">giornata?</span>
          </h1>

          <div
            className={`mt-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${theme.softSurface}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-lg">
                🔥
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${theme.primaryText}`}>
                  12 giorni di fila
                </p>
                <p className={`text-xs font-medium ${theme.muted}`}>
                  Record personale: 18 giorni
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-500">
              In fiamme
            </span>
          </div>
        </section>

        <section
          className={`relative mx-auto mt-5 max-w-2xl overflow-hidden rounded-[2rem] border p-5 sm:mt-7 sm:p-7 ${theme.surface}`}
        >
          <div className="pointer-events-none absolute -right-12 top-2 h-36 w-36 rounded-full bg-pink-500/[0.07] blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-amber-400/[0.05] blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold ${theme.muted}`}>
                Registrazioni di oggi
              </p>
              <div className="mt-1 flex items-end gap-3">
                <motion.output
                  aria-live="polite"
                  aria-label={`${count} registrazioni effettuate oggi`}
                  key={count}
                  initial={
                    prefersReducedMotion
                      ? false
                      : { opacity: 0, y: 8, scale: 0.92 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 24 }}
                  className={`text-[clamp(4.5rem,17vw,7rem)] font-black leading-none tracking-[-0.09em] ${theme.primaryText}`}
                >
                  {count}
                </motion.output>

                <span className={`mb-3 text-sm font-semibold ${theme.muted}`}>
                  {count === 1 ? "volta" : "volte"}
                </span>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.08] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.65)]" />
              <span className="text-xs font-bold text-emerald-500">Live</span>
            </div>
          </div>

          <p className={`relative mt-2 text-sm font-medium ${theme.muted}`}>
            {message}
          </p>

          <div className="relative my-5 h-px w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-10" />

          <div className="relative flex flex-col items-center">
            <div className="relative grid h-[228px] w-[228px] place-items-center sm:h-[258px] sm:w-[258px]">
              <motion.div
                aria-hidden="true"
                className={`absolute inset-1 rounded-full border ${theme.counterRing}`}
                animate={prefersReducedMotion ? {} : { rotate: 360 }}
                transition={{ duration: 28, ease: "linear", repeat: Infinity }}
              />
              <div
                aria-hidden="true"
                className={`absolute inset-5 rounded-full border border-dashed ${theme.buttonOuter}`}
              />

              <motion.button
                type="button"
                aria-label="Aggiungi una registrazione"
                onClick={registerActivity}
                whileHover={prefersReducedMotion ? {} : { scale: 1.035 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
                animate={
                  burst === 0 || prefersReducedMotion
                    ? {}
                    : { scale: [1, 1.08, 1] }
                }
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className={`relative z-10 grid h-[172px] w-[172px] place-items-center rounded-full border-4 border-pink-300/30 bg-pink-500 text-[72px] ${theme.buttonShadow} transition-colors hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/50 focus-visible:ring-offset-4 ${
                  isDark
                    ? "focus-visible:ring-offset-zinc-900"
                    : "focus-visible:ring-offset-white"
                } sm:h-[194px] sm:w-[194px]`}
              >
                <span
                  className="translate-y-[-2px] select-none"
                  role="img"
                  aria-label="cacca"
                >
                  💩
                </span>
                <span className="sr-only">Registra attività</span>
              </motion.button>

              {!prefersReducedMotion && burst > 0 && (
                <>
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <motion.span
                      key={`${burst}-${item}`}
                      aria-hidden="true"
                      initial={{ opacity: 0.85, scale: 0.4, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        scale: 1,
                        x: Math.cos((item * Math.PI) / 3) * 112,
                        y: Math.sin((item * Math.PI) / 3) * 112,
                      }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className="absolute z-20 h-2.5 w-2.5 rounded-full bg-pink-300"
                    />
                  ))}
                </>
              )}
            </div>

            <p
              className={`mt-1 text-center text-sm font-semibold ${theme.primaryText}`}
            >
              Tocca per registrare
            </p>
            <p
              className={`mt-1 text-center text-xs font-medium ${theme.muted}`}
            >
              Un tap, punto XP, giornata migliore.
            </p>

            <button
              type="button"
              onClick={undoActivity}
              disabled={count === 0}
              aria-label="Annulla ultima registrazione"
              className={`mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 ${
                theme.secondary
              } ${isDark ? "focus-visible:ring-offset-zinc-900" : "focus-visible:ring-offset-white"}`}
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.2} />
              Annulla ultima
            </button>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
