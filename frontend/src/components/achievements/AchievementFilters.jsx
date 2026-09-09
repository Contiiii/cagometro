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
          className={`min-h-10 shrink-0 rounded-full px-3.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
            activeFilter === filter
              ? "bg-pink-500 text-white shadow-[0_6px_16px_rgba(236,72,153,0.22)]"
              : `${theme.surfaceAlt} border ${theme.muted}`
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}