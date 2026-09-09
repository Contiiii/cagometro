export default function AchievementSectionSwitcher({
  section,
  switchSection,
  theme,
  isDark,
}) {
  return (
    <div
      role="group"
      aria-label="Seleziona tipo di traguardi"
      className={`mt-5 inline-grid grid-cols-2 rounded-2xl border p-1 ${theme.surfaceAlt}`}
    >
      <button
        type="button"
        onClick={() => switchSection("personali")}
        aria-pressed={section === "personali"}
        className={`min-h-11 rounded-xl px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
          section === "personali"
            ? isDark
              ? "bg-zinc-100 text-zinc-950 shadow-sm"
              : "bg-zinc-900 text-white shadow-sm"
            : theme.muted
        }`}
      >
        Personali
      </button>

      <button
        type="button"
        onClick={() => switchSection("squadra")}
        aria-pressed={section === "squadra"}
        className={`min-h-11 rounded-xl px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
          section === "squadra"
            ? isDark
              ? "bg-zinc-100 text-zinc-950 shadow-sm"
              : "bg-zinc-900 text-white shadow-sm"
            : theme.muted
        }`}
      >
        Squadra
      </button>
    </div>
  );
}