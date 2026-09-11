import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import ModalShell from "../teams/ModalShell";
import Panel from "../ui/Panel";

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
        <ModalShell
          theme={theme}
          prefersReducedMotion={prefersReducedMotion}
          onClose={onClose}
          labelledBy="report-detail-title"
          maxWidth="max-w-md"
          maxHeight=""
          overlayClass="bg-zinc-950/60"
        >
          <div className="p-6 sm:p-7">
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

            <Panel theme={theme} radius="panel" padding="lg" className="mt-7">
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
            </Panel>
          </div>
        </ModalShell>
      )}
    </AnimatePresence>
  );
}