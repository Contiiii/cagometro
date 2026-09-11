import { useRef, useState } from "react";
import { Check, Sparkles, UsersRound, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useModalFocusTrap from "../hooks/useModalFocusTrap";

export default function ReleaseNotesModal({
  open,
  onClose,
  version,
  features = [],
  isDark = true,
  prefersReducedMotion = false,
}) {
  const dialogRef = useRef(null);

  useModalFocusTrap({
    dialogRef,
    open,
    onClose,
    prefersReducedMotion,
  });

  const [showAll, setShowAll] = useState(false);

  const visibleFeatures = showAll ? features : features.slice(0, 3);

  const hiddenFeaturesCount = Math.max(
    features.length - visibleFeatures.length,
    0,
  );
  const theme = isDark
    ? {
        panel: "border-white/[0.09] bg-[#17171b]",
        soft: "border-white/[0.08] bg-white/[0.04]",
        text: "text-zinc-50",
        muted: "text-zinc-400",
        overlay: "bg-zinc-950/70",
      }
    : {
        panel: "border-zinc-900/[0.09] bg-[#fffaf6]",
        soft: "border-zinc-900/[0.08] bg-zinc-900/[0.035]",
        text: "text-zinc-950",
        muted: "text-zinc-600",
        overlay: "bg-zinc-950/45",
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[100] flex items-end justify-center p-3 backdrop-blur-sm sm:items-center sm:p-6 ${theme.overlay}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.2,
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-labelledby="release-notes-title"
            aria-describedby="release-notes-description"
            initial={
              prefersReducedMotion
                ? false
                : {
                    opacity: 0,
                    y: 28,
                    scale: 0.97,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    y: 20,
                    scale: 0.98,
                  }
            }
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
              duration: prefersReducedMotion ? 0 : undefined,
            }}
            className={`relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[2rem] border shadow-2xl ${theme.panel}`}
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-pink-500/[0.12] blur-3xl" />

            <div className="relative p-6 sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-pink-500">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Nuova versione
                  </div>

                  <h2
                    id="release-notes-title"
                    className={`mt-4 text-3xl font-black tracking-[-0.06em] ${theme.text}`}
                  >
                    Cosa c’è di nuovo
                  </h2>

                  <p
                    id="release-notes-description"
                    className={`mt-2 text-sm leading-relaxed ${theme.muted}`}
                  >
                    Cagometro è stato aggiornato alla versione{" "}
                    <span className={`font-bold ${theme.text}`}>{version}</span>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Chiudi novità"
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.soft}`}
                >
                  <X className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                {visibleFeatures.map((feature, index) => {
                  const Icon = feature.icon ?? Check;

                  return (
                    <motion.div
                      key={feature.id ?? feature.title}
                      initial={
                        prefersReducedMotion
                          ? false
                          : {
                              opacity: 0,
                              y: 10,
                            }
                      }
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: prefersReducedMotion ? 0 : 0.08 + index * 0.06,
                        duration: prefersReducedMotion ? 0 : 0.22,
                      }}
                      className={`flex items-start gap-3 rounded-[1.35rem] border p-4 ${theme.soft}`}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pink-500/10 text-pink-500">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2.3} />
                      </span>

                      <div className="min-w-0">
                        <p className={`text-sm font-black ${theme.text}`}>
                          {feature.title}
                        </p>

                        <p
                          className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}
                        >
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {features.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                  className={`mt-3 flex min-h-11 w-full items-center justify-center rounded-2xl border px-4 text-sm font-bold transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.soft}`}
                >
                  {showAll
                    ? "Mostra meno"
                    : `Mostra altre ${hiddenFeaturesCount} novità`}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(236,72,153,0.25)] transition hover:bg-pink-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
              >
                <UsersRound className="h-5 w-5" strokeWidth={2.3} />
                Scopri la nuova versione
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
