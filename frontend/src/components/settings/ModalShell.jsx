import { useId, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import useModalFocusTrap from "../../hooks/useModalFocusTrap";

export default function ModalShell({
  title,
  theme,
  onClose,
  prefersReducedMotion,
  children,
}) {
  const dialogRef = useRef(null);

  useModalFocusTrap({ dialogRef, onClose, prefersReducedMotion });

  const titleId = useId();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        initial={
          prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 20, scale: 0.98 }
        }
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className={`max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-x-hidden overflow-y-auto overscroll-contain rounded-[2rem] border p-6 shadow-2xl sm:p-7 ${theme.modal}`}
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              Impostazioni
            </p>
            <h2
              id={titleId}
              className={`mt-1 text-2xl font-black tracking-[-0.05em] ${theme.primaryText}`}
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className={`grid h-11 w-11 place-items-center rounded-2xl border focus-visible:outline-none focus-visible:ring-2 ${theme.softSurface}`}
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </motion.section>
    </motion.div>
  );
}