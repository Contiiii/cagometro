import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function ReportDetailsModal({
  open,
  onClose,
  selectedPoint,
  average,
  theme,
  prefersReducedMotion,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-detail-title"
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 24 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 20 }
            }
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
            }}
            className={`w-full max-w-md rounded-[2rem] border p-6 shadow-2xl sm:p-7 ${theme.sheet}`}
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className={`text-sm font-semibold ${theme.muted}`}>
                  Dettaglio selezionato
                </p>

                <h2
                  id="report-detail-title"
                  className={`mt-1 text-2xl font-black tracking-tight ${theme.text}`}
                >
                  {selectedPoint.date}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`grid h-11 w-11 place-items-center rounded-2xl border ${theme.softSurface}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className={`mt-7 rounded-[1.5rem] border p-5 ${theme.softSurface}`}
            >
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.13em] ${theme.subtle}`}
              >
                Registrazioni
              </p>

              <p
                className={`mt-2 text-6xl font-black leading-none tracking-[-0.08em] ${theme.text}`}
              >
                {selectedPoint.value}
              </p>

              <p
                className={`mt-5 text-sm font-semibold leading-relaxed ${theme.muted}`}
              >
                {selectedPoint.value === 0
                  ? "Giornata di pausa. Anche le statistiche hanno bisogno di respirare."
                  : selectedPoint.value >= average
                    ? `Sopra la media di ${average.toFixed(1)}: qui hai tenuto un bel ritmo.`
                    : `Sotto la media di ${average.toFixed(1)}, ma ogni attività fa volume nel tempo.`}
              </p>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}