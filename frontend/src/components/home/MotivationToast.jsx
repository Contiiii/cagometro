import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const TOAST_DURATION_MS = 2500;

export default function MotivationToast({
  toast,
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
            className="flex w-full max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-zinc-950/85 px-5 py-4 text-left shadow-2xl backdrop-blur-md"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-pink-500/25 bg-pink-500/15">
              <Sparkles
                className="h-4 w-4 text-pink-400"
                strokeWidth={2.3}
                aria-hidden="true"
              />
            </span>

            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-pink-400">
                Registrazione aggiunta
              </span>

              <p className="mt-0.5 text-sm font-semibold leading-snug text-zinc-100">
                {toast.phrase}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}