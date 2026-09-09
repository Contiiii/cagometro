export default function ReportSummaryCard({
  bestLabel,
  bestPoint,
  report,
  average,
  theme,
}) {
  return (
    <article
      className={`rounded-[1.75rem] border p-5 ${theme.surface}`}
    >
      <p className={`text-sm font-bold ${theme.text}`}>
        Il periodo in tre righe
      </p>

      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5">
        <div>
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
          >
            {bestLabel}
          </p>

          <p className={`mt-1 text-base font-black ${theme.text}`}>
            {bestPoint.date}
          </p>

          <p className="mt-0.5 text-xs font-bold text-pink-500">
            {bestPoint.value} registrazioni
          </p>
        </div>

        <div>
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
          >
            Giorni attivi
          </p>

          <p className={`mt-1 text-base font-black ${theme.text}`}>
            {report.activeDays}
          </p>

          <p className={`mt-0.5 text-xs font-medium ${theme.muted}`}>
            senza contare le pause
          </p>
        </div>

        <div>
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
          >
            Fascia preferita
          </p>

          <p className={`mt-1 text-base font-black ${theme.text}`}>
            {report.bestTime}
          </p>

          <p className={`mt-0.5 text-xs font-medium ${theme.muted}`}>
            Qui il ritmo sale
          </p>
        </div>

        <div>
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
          >
            Media periodo
          </p>

          <p className={`mt-1 text-base font-black ${theme.text}`}>
            {average.toFixed(1)}
          </p>

          <p className="mt-0.5 text-xs font-medium text-emerald-500">
            attività per punto
          </p>
        </div>
      </div>
    </article>
  );
}