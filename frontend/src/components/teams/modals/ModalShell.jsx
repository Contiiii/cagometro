import { useRef } from "react";
import { motion } from "framer-motion";
import useModalFocusTrap from "../../../hooks/useModalFocusTrap";

export default function ModalShell({
  children,
  onClose,
  theme,
  prefersReducedMotion,
  labelledBy,
  describedBy,
  maxWidth = "max-w-lg",
  tone = "sheet",
  overlayClass = "bg-zinc-950/55",
  maxHeight = "max-h-[calc(100dvh-3rem)]",
  overflowClass = "overflow-x-hidden overflow-y-auto overscroll-contain",
  restoreFocusRef,
}) {
  const dialogRef = useRef(null);

  useModalFocusTrap({ dialogRef, onClose, prefersReducedMotion, restoreFocusRef });

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-end justify-center ${overlayClass} p-3 sm:items-center sm:p-6`}
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
        className={`${maxHeight} w-full ${maxWidth} ${overflowClass} rounded-[2rem] border shadow-2xl ${theme[tone]}`}
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