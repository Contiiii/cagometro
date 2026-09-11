export default function ReportSummaryCard({
  period,
  bestLabel,
  bestPoint,
  report,
  average,
  theme,
}) {
  const isWeekReport = period === "week";
  const isMonthReport = period === "month";

  const safeBestPoint = bestPoint ?? {
    date: "—",
    value: 0,
  };

  const safeAverage = Number.isFinite(average) ? average : 0;

  const periodTitle = isMonthReport
    ? "Il mese in tre righe"
    : isWeekReport
      ? "La settimana in tre righe"
      : "Il periodo in tre righe";

  const bestDayLabel = isMonthReport
    ? "Miglior giorno del mese"
    : isWeekReport
      ? "Miglior giorno della settimana"
      : bestLabel;

  const averageLabel = isMonthReport
    ? "Media giornaliera"
    : isWeekReport
      ? "Media giornaliera"
      : "Media periodo";

  const averageDescription = isMonthReport
    ? "registrazioni al giorno"
    : isWeekReport
      ? "registrazioni al giorno"
      : "attività per punto";

  const bestStreak = report.record ?? 0;
  const currentStreak = report.streak ?? 0;

  return (
    <article className={`rounded-[1.75rem] border p-5 ${theme.surface}`}>
      <p className={`text-sm font-bold ${theme.text}`}>
        {periodTitle}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5">
  <div>
    <p
      className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
    >
      {bestDayLabel}
    </p>

    <p className={`mt-1 text-base font-black ${theme.text}`}>
      {safeBestPoint.date}
    </p>

    <p className="mt-0.5 text-xs font-bold text-pink-500">
      {safeBestPoint.value} registrazioni
    </p>
  </div>

  <div>
    <p
      className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
    >
      {averageLabel}
    </p>

    <p className={`mt-1 text-base font-black ${theme.text}`}>
      {safeAverage.toFixed(1)}
    </p>

    <p className="mt-0.5 text-xs font-medium text-emerald-500">
      {averageDescription}
    </p>
  </div>

  <div>
    <p
      className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
    >
      Streak attuale
    </p>

    <p className={`mt-1 text-base font-black ${theme.text}`}>
      {currentStreak} giorni
    </p>

    <p className={`mt-0.5 text-xs font-medium ${theme.muted}`}>
      Serie attiva fino a oggi
    </p>
  </div>

  <div>
    <p
      className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
    >
      Streak migliore
    </p>

    <p className={`mt-1 text-base font-black ${theme.text}`}>
      {bestStreak} giorni
    </p>

    <p className={`mt-0.5 text-xs font-medium ${theme.muted}`}>
      Il tuo record consecutivo
    </p>
  </div>
</div>
    </article>
  );
}