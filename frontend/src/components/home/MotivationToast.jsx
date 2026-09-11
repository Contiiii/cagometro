import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const TOAST_DURATION_MS = 2500;

export default function MotivationToast({
  toast,
  isDark,
  prefersReducedMotion,
  onClose,
}) {
  useEffect(() => {
    if (!toast) return;

    const timerId = window.setTimeout(onClose, TOAST_DURATION_MS);

    return () => window.clearTimeout(timerId);
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-[9998] flex justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
        >
          <motion.div
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 40 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 20 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 26 }
            }
            className={`max-w-xs rounded-2xl border px-5 py-3.5 text-center shadow-2xl ${
              isDark
                ? "border-pink-400/30 bg-pink-950/95"
                : "border-pink-500/20 bg-pink-100"
            }`}
          >
            <span
              className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                isDark ? "text-pink-400" : "text-pink-500"
              }`}
            >
              Registrazione aggiunta
            </span>

            <p
              className={`mt-1 text-sm font-semibold leading-snug ${
                isDark ? "text-pink-50" : "text-pink-950"
              }`}
            >
              {toast.phrase}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}