import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function useModalFocusTrap({
  dialogRef,
  open = true,
  onClose,
  initialFocusRef,
  restoreFocusRef,
  prefersReducedMotion,
}) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = restoreFocusRef?.current ?? document.activeElement;

    dialog.focus();

    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollY = window.scrollY;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.paddingRight =
      scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
    document.body.style.top = `-${scrollY}px`;

    const getFocusable = () =>
      Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0,
      );

    const initialFocus =
      initialFocusRef?.current ?? getFocusable()[0] ?? dialog;

    const timeout = window.setTimeout(
      () => initialFocus.focus(),
      prefersReducedMotion ? 0 : 120,
    );

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.width = previousWidth;
      document.body.style.paddingRight = previousPaddingRight;
      document.body.style.top = previousTop;
      window.scrollTo(0, scrollY);
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [dialogRef, open, initialFocusRef, restoreFocusRef, prefersReducedMotion]);
}