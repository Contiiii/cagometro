import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

let bodyLockCount = 0;
let savedBodyStyle = null;
let savedScrollY = 0;

function lockBodyScroll() {
  bodyLockCount += 1;

  if (bodyLockCount !== 1) return;

  const body = document.body;

  savedBodyStyle = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
  };

  savedScrollY = window.scrollY;
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.width = "100%";
  body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
  body.style.top = `-${savedScrollY}px`;
}

function unlockBodyScroll() {
  if (bodyLockCount === 0) return;

  bodyLockCount -= 1;

  if (bodyLockCount !== 0) return;

  if (!savedBodyStyle) return;

  const body = document.body;

  body.style.overflow = savedBodyStyle.overflow;
  body.style.position = savedBodyStyle.position;
  body.style.top = savedBodyStyle.top;
  body.style.width = savedBodyStyle.width;
  body.style.paddingRight = savedBodyStyle.paddingRight;

  savedBodyStyle = null;
  window.scrollTo(0, savedScrollY);
  savedScrollY = 0;
}

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

    const getFocusable = () =>
      Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0,
      );

    const initialFocus =
      initialFocusRef?.current ?? getFocusable()[0] ?? dialog;

    lockBodyScroll();

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
      unlockBodyScroll();
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [dialogRef, open, initialFocusRef, restoreFocusRef, prefersReducedMotion]);
}