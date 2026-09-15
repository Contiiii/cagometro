import { useId, useRef, useState } from "react";
import { Check, Sparkles, UsersRound, X, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useModalFocusTrap from "../hooks/useModalFocusTrap";

export default function ReleaseNotesModal({
  open,
  onClose,
  notes = [],
  isDark = true,
  prefersReducedMotion = false,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const navigate = useNavigate();

  useModalFocusTrap({
    dialogRef,
    open,
    onClose,
    prefersReducedMotion,
  });

  const [showAllVersions, setShowAllVersions] = useState(false);

  const latest = notes[0];
  const latestVersion = latest?.version ?? "";
  const latestFeatures = latest?.features ?? [];

  const visibleFeatures = showAllVersions ? latestFeatures : latestFeatures.slice(0, 3);
  const hiddenFeaturesCount = Math.max(latestFeatures.length - visibleFeatures.length, 0);

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

  const renderFeature = (feature, index, isExpanded = false) => {
    const Icon = feature.icon ?? Check;
    return (
      <motion.div
        key={feature.id ?? feature.title}
        initial={
          prefersReducedMotion
            ? false
            : {
                opacity: 0,
                y: isExpanded ? 0 : 10,
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
        className={`flex items-start gap-3 rounded-[1.35rem] border p-4 ${theme.softSurface}`}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.3} />
        </span>

        <div className="min-w-0">
          <p className={`text-sm font-black ${theme.primaryText}`}>
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
  };

  const renderVersionBlock = (note, isLatest = false) => {
    const featuresToShow = isLatest && !showAllVersions
      ? note.features.slice(0, 3)
      : note.features;

    return (
      <div key={note.version} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
              Ultima versione
            </span>
            <span className={`text-lg font-bold ${theme.primaryText}`}>
              v{note.version}
            </span>
            {note.date && (
              <span className={`text-xs ${theme.muted}`}>
                {note.date}
              </span>
            )}
          </div>

        <div className="grid gap-3">
          {featuresToShow.map((feature, index) => renderFeature(feature, index, !isLatest || showAllVersions))}
        </div>
        {isLatest && note.features.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAllVersions((current) => !current)}
            className={`mt-2 flex items-center justify-center gap-1.5 text-sm font-bold transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${theme.softSurface}`}
          >
            <span className="flex items-center gap-1">
              {showAllVersions ? "Mostra meno" : `Mostra altre ${hiddenFeaturesCount} novità`}
              {showAllVersions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
        )}
      </div>
    );
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
            aria-labelledby={titleId}
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
            className={`relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-x-hidden overflow-y-auto overscroll-contain rounded-[2rem] border shadow-2xl ${theme.modal}`}
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-accent/[0.12] blur-3xl" />

            <div className="relative p-6 sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Nuova versione
                  </div>

                  <h2
                    id={titleId}
                    className={`mt-4 text-3xl font-black tracking-[-0.06em] ${theme.primaryText}`}
                  >
                    Cosa c’è di nuovo
                  </h2>

                  <p
                    id="release-notes-description"
                    className={`mt-2 text-sm leading-relaxed ${theme.muted}`}
                  >
                    Cagometro è stato aggiornato alla versione{" "}
                    <span className={`font-bold ${theme.primaryText}`}>{latestVersion}</span>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Chiudi novità"
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${theme.softSurface}`}
                >
                  <X className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {latest && renderVersionBlock(latest, true)}

                {notes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/changelog");
                    }}
                    className={`mt-3 flex items-center justify-center gap-1.5 text-sm font-bold transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${theme.softSurface}`}
                  >
                    <span className="flex items-center gap-1">
                      Versioni precedenti
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_color-mix(in_oklab,var(--accent)_25%,transparent)] transition hover:bg-accent hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
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