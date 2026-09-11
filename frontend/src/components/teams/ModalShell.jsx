import { useRef } from "react";
import { motion } from "framer-motion";
import useModalFocusTrap from "../../hooks/useModalFocusTrap";

export default function ModalShell({
  children,
  onClose,
  theme,
  prefersReducedMotion,
  labelledBy,
  describedBy,
  maxWidth = "max-w-lg",
}) {
  const dialogRef = useRef(null);

  useModalFocusTrap({ dialogRef, onClose, prefersReducedMotion });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/55 p-3 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.2,
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`max-h-[calc(100dvh-3rem)] w-full ${maxWidth} overflow-x-hidden overflow-y-auto overscroll-contain rounded-[2rem] border shadow-2xl ${theme.sheet}`}
        initial={
          prefersReducedMotion
            ? false
            : {
                opacity: 0,
                y: 28,
                scale: 0.98,
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
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}