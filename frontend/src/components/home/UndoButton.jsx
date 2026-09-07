import { RotateCcw } from "lucide-react";

export default function UndoButton({
  onClick,
  disabled,
  isUndoing,
  isDark,
  theme,
  prefersReducedMotion,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={isUndoing}
      aria-label="Annulla ultima registrazione"
      className={`mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 ${
        theme.secondary
      } ${
        isDark
          ? "focus-visible:ring-offset-zinc-900"
          : "focus-visible:ring-offset-white"
      }`}
    >
      <RotateCcw
        className={`h-4 w-4 ${
          isUndoing && !prefersReducedMotion
            ? "animate-spin"
            : ""
        }`}
        strokeWidth={2.2}
      />

      {isUndoing
        ? "Annullamento..."
        : "Annulla ultima registrazione"}
    </button>
  );
}