export default function AchievementFilters({
  filters,
  activeFilter,
  setActiveFilter,
  theme,
}) {
  return (
    <div
      role="group"
      aria-label="Filtra traguardi"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => setActiveFilter(filter)}
          aria-pressed={activeFilter === filter}
          className={`min-h-10 shrink-0 rounded-full px-3.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            activeFilter === filter
              ? "bg-accent text-accent-contrast shadow-[0_6px_16px_color-mix(in_oklab,var(--accent)_22%,transparent)]"
              : `${theme.softSurface} border ${theme.muted}`
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}