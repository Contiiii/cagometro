import { Info } from "lucide-react";

export default function VersionInfoButton({ onClick, theme, accentColor }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Novità della versione"
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 ${theme.softSurface}`}
      style={{ "--tw-ring-color": accentColor }}
    >
      <Info
        className="h-3.5 w-3.5"
        strokeWidth={2.4}
        style={{ color: accentColor }}
      />
    </button>
  );
}
