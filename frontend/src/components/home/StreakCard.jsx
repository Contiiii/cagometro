import IconTile from "../ui/IconTile";

export default function StreakCard({ streak, bestStreak, theme }) {
  return (
    <div
      className={`mt-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${theme.softSurface}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <IconTile size="sm" className="bg-amber-400/15 text-lg">
          🔥
        </IconTile>

        <div className="min-w-0">
          <p className={`text-sm font-bold ${theme.primaryText}`}>
            {streak === 1
              ? "1 giorno di fila"
              : `${streak} giorni di fila`}
          </p>

          <p className={`text-xs font-medium ${theme.muted}`}>
            Record personale:{" "}
            {bestStreak === 1
              ? "1 giorno"
              : `${bestStreak} giorni`}
          </p>
        </div>
      </div>

      <span className="shrink-0 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-500">
        {streak > 0 ? "In fiamme" : "Da iniziare"}
      </span>
    </div>
  );
}