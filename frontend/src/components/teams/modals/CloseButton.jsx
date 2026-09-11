import { X } from "lucide-react";

export default function CloseButton({
  onClick,
  theme,
  isDark,
  disabled = false,
  label = "Chiudi pannello",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        theme.secondary
      } ${
        isDark
          ? "focus-visible:ring-offset-[#17171b]"
          : "focus-visible:ring-offset-[#fdfbf9]"
      }`}
    >
      <X className="h-5 w-5" strokeWidth={2.2} />
    </button>
  );
}