export default function ReportMonthSelector({
  selectedMonth,
  setSelectedMonth,
  isCurrentMonth,
  theme,
}) {
  return (
    <div
      className={`mt-4 flex items-center justify-between rounded-2xl border p-2 ${theme.softSurface}`}
    >
      <button
        type="button"
        onClick={() =>
          setSelectedMonth(
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth() - 1,
              1,
            ),
          )
        }
        className="px-3 py-2"
      >
        ←
      </button>

      <span className="font-bold">
        {selectedMonth.toLocaleDateString("it-IT", {
          month: "long",
          year: "numeric",
        })}
      </span>

      <button
        type="button"
        disabled={isCurrentMonth}
        onClick={() =>
          setSelectedMonth(
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth() + 1,
              1,
            ),
          )
        }
        className="px-3 py-2 disabled:opacity-30"
      >
        →
      </button>
    </div>
  );
}