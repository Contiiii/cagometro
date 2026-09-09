export default function ReportPeriodSelector({
  period,
  changePeriod,
  isDark,
  theme,
}) {
  return (
    <div
      role="group"
      aria-label="Seleziona il periodo del report"
      className={`mt-6 grid grid-cols-4 rounded-2xl border p-1.5 ${theme.softSurface}`}
    >
      {[
        ["week", "Sett."],
        ["month", "Mese"],
        ["year", "Anno"],
        ["all", "Tutto"],
      ].map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => changePeriod(key)}
          aria-pressed={period === key}
          className={`min-h-11 rounded-xl px-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
            period === key
              ? isDark
                ? "bg-zinc-100 text-zinc-950 shadow-sm"
                : "bg-zinc-900 text-white shadow-sm"
              : theme.muted
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}