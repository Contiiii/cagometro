import { getWeekRangeLabel } from "../../utils/date";

export default function ReportWeekSelector({
  selectedWeek,
  setSelectedWeek,
  isCurrentWeek,
  theme,
}) {
  const moveWeek = (offset) => {
    const next = new Date(selectedWeek);
    next.setHours(12, 0, 0, 0);
    next.setDate(next.getDate() + offset);
    setSelectedWeek(next);
  };

  return (
    <div
      className={`mt-4 flex items-center justify-between rounded-2xl border p-2 ${theme.softSurface}`}
    >
      <button
        type="button"
        onClick={() => moveWeek(-7)}
        className="px-3 py-2"
      >
        ←
      </button>

      <span className="font-bold">{getWeekRangeLabel(selectedWeek)}</span>

      <button
        type="button"
        disabled={isCurrentWeek}
        onClick={() => moveWeek(7)}
        className="px-3 py-2 disabled:opacity-30"
      >
        →
      </button>
    </div>
  );
}