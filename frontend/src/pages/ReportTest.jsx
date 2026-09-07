import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Share2,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import Header from "../components/HeaderTest";
import BottomNav from "../components/BottomNavTest";
import { useTheme } from "../hooks/useTheme";

const monthReports = [
  {
    id: "jul",
    label: "Luglio 2026",
    shortLabel: "Lug",
    previousLabel: "giugno",
    previousTotal: 30,
    streak: 8,
    record: 18,
    activeDays: 17,
    bestTime: "09:00 – 11:00",
    values: [
      0, 1, 2, 0, 2, 1, 0, 3, 1, 2, 0, 1, 1, 0, 2, 3, 1, 0, 2, 1, 0, 2, 2, 1, 0,
      3, 1, 2, 1, 0, 2,
    ],
  },
  {
    id: "aug",
    label: "Agosto 2026",
    shortLabel: "Ago",
    previousLabel: "luglio",
    previousTotal: 39,
    streak: 10,
    record: 18,
    activeDays: 20,
    bestTime: "08:00 – 10:00",
    values: [
      1, 2, 0, 2, 1, 0, 3, 1, 2, 2, 0, 1, 3, 0, 2, 1, 2, 0, 3, 1, 1, 2, 0, 2, 3,
      1, 0, 2, 1, 2, 1,
    ],
  },
  {
    id: "sep",
    label: "Settembre 2026",
    shortLabel: "Set",
    previousLabel: "agosto",
    previousTotal: 43,
    streak: 12,
    record: 18,
    activeDays: 21,
    bestTime: "08:00 – 10:00",
    values: [
      3, 5, 2, 4, 1, 4, 0, 3, 2, 4, 2, 1, 0, 3, 2, 4, 1, 3, 0, 2, 3, 1, 4, 2, 1,
      0, 2, 3, 1, 2,
    ],
  },
];

const weeklyReport = {
  label: "2 – 7 settembre",
  previousLabel: "scorsa settimana",
  previousTotal: 18,
  streak: 12,
  record: 18,
  activeDays: 6,
  bestTime: "08:00 – 10:00",
  points: [
    { id: "mon", label: "Lun", date: "1 settembre", value: 3 },
    { id: "tue", label: "Mar", date: "2 settembre", value: 5 },
    { id: "wed", label: "Mer", date: "3 settembre", value: 2 },
    { id: "thu", label: "Gio", date: "4 settembre", value: 4 },
    { id: "fri", label: "Ven", date: "5 settembre", value: 1 },
    { id: "sat", label: "Sab", date: "6 settembre", value: 4, today: true },
    { id: "sun", label: "Dom", date: "7 settembre", value: 0 },
  ],
};

const yearlyReports = [
  { id: "jan", label: "Gen", date: "Gennaio 2026", value: 22 },
  { id: "feb", label: "Feb", date: "Febbraio 2026", value: 27 },
  { id: "mar", label: "Mar", date: "Marzo 2026", value: 31 },
  { id: "apr", label: "Apr", date: "Aprile 2026", value: 28 },
  { id: "may", label: "Mag", date: "Maggio 2026", value: 34 },
  { id: "jun", label: "Giu", date: "Giugno 2026", value: 30 },
  { id: "jul", label: "Lug", date: "Luglio 2026", value: 39 },
  { id: "aug", label: "Ago", date: "Agosto 2026", value: 43 },
  { id: "sep", label: "Set", date: "Settembre 2026", value: 44, today: true },
];

const allReports = [
  { id: "2023", label: "2023", date: "Anno 2023", value: 74 },
  { id: "2024", label: "2024", date: "Anno 2024", value: 126 },
  { id: "2025", label: "2025", date: "Anno 2025", value: 181 },
  { id: "2026", label: "2026", date: "Anno 2026", value: 298, today: true },
];

export default function CagometroReport() {
  const prefersReducedMotion = useReducedMotion();

  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const [period, setPeriod] = useState("week");
  const [monthIndex, setMonthIndex] = useState(2);
  const [selectedPointId, setSelectedPointId] = useState("sat");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => {
    if (period === "week") return weeklyReport;

    if (period === "month") {
      const month = monthReports[monthIndex];

      return {
        ...month,
        points: month.values.map((value, index) => ({
          id: `${month.id}-${index + 1}`,
          label: `${index + 1}`,
          date: `${index + 1} ${month.label.split(" ")[0].toLowerCase()}`,
          value,
          today: month.id === "sep" && index + 1 === 6,
        })),
      };
    }

    if (period === "year") {
      return {
        label: "Il tuo 2026",
        previousLabel: "2025",
        previousTotal: 181,
        streak: 12,
        record: 18,
        activeDays: 128,
        bestTime: "Mattina",
        points: yearlyReports,
      };
    }

    return {
      label: "Tutto il percorso",
      previousLabel: "periodo precedente",
      previousTotal: 412,
      streak: 12,
      record: 18,
      activeDays: 297,
      bestTime: "Mattina",
      points: allReports,
    };
  }, [monthIndex, period]);

  const total = useMemo(
    () => report.points.reduce((sum, point) => sum + point.value, 0),
    [report.points],
  );

  const average = total / report.points.length;
  const difference = total - report.previousTotal;
  const change = Math.round((difference / report.previousTotal) * 100);
  const maxValue = Math.max(...report.points.map((point) => point.value), 1);

  const selectedPoint =
    report.points.find((point) => point.id === selectedPointId) ||
    report.points.find((point) => point.today) ||
    report.points[0];

  const bestPoint = report.points.reduce(
    (best, point) => (point.value > best.value ? point : best),
    report.points[0],
  );

  const daysToRecord = Math.max(0, report.record - report.streak);

  const theme = isDark
    ? {
        app: "bg-[#0c0c0f] text-zinc-100",
        surface: "border-white/[0.08] bg-zinc-900/80",
        softSurface: "border-white/[0.07] bg-white/[0.035]",
        text: "text-zinc-50",
        muted: "text-zinc-400",
        subtle: "text-zinc-500",
        sheet: "border-white/[0.09] bg-[#17171b]",
      }
    : {
        app: "bg-[#f8f5f3] text-zinc-900",
        surface: "border-zinc-200/80 bg-white/85",
        softSurface: "border-zinc-900/[0.07] bg-zinc-900/[0.035]",
        text: "text-zinc-950",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        sheet: "border-zinc-900/[0.09] bg-[#fdfbf9]",
      };

  const changePeriod = (nextPeriod) => {
    setPeriod(nextPeriod);

    if (nextPeriod === "week") {
      setSelectedPointId("sat");
      return;
    }

    if (nextPeriod === "month") {
      setSelectedPointId(`${monthReports[monthIndex].id}-6`);
      return;
    }

    if (nextPeriod === "year") {
      setSelectedPointId("sep");
      return;
    }

    setSelectedPointId("2026");
  };

  const changeMonth = (direction) => {
    const nextIndex = Math.min(
      Math.max(monthIndex + direction, 0),
      monthReports.length - 1,
    );

    setMonthIndex(nextIndex);
    setSelectedPointId(`${monthReports[nextIndex].id}-1`);
  };

  const copyReport = async () => {
    const summary = `Cagometro — ${report.label}: ${total} registrazioni, streak di ${report.streak} giorni, miglior periodo: ${bestPoint.date}.`;

    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      // Nel prototipo il feedback viene comunque mostrato.
    }

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2200);
  };

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="Statistiche" title="Report" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <section className="mx-auto max-w-3xl">
          <p className={`text-sm font-medium ${theme.muted}`}>
            Dati dimostrativi · {report.label}
          </p>

          <h1
            className={`mt-1 text-[clamp(2.15rem,7vw,4rem)] font-black leading-[0.95] tracking-[-0.075em] ${theme.text}`}
          >
            Il tuo ritmo,
            <br />
            messo <span className="text-pink-500">nero su rosa.</span>
          </h1>

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

          {period === "month" && (
            <div
              className={`mt-4 flex items-center justify-between rounded-2xl border p-1.5 ${theme.softSurface}`}
            >
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                disabled={monthIndex === 0}
                aria-label="Mostra il mese precedente"
                className={`grid h-11 w-11 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.text}`}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>

              <div className="text-center">
                <p className={`text-sm font-black ${theme.text}`}>
                  {monthReports[monthIndex].label}
                </p>
                <p
                  className={`mt-0.5 text-[11px] font-semibold ${theme.muted}`}
                >
                  Tocca le frecce per cambiare mese
                </p>
              </div>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                disabled={monthIndex === monthReports.length - 1}
                aria-label="Mostra il mese successivo"
                className={`grid h-11 w-11 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.text}`}
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </section>

        <AnimatePresence mode="wait">
          <motion.section
            key={`${period}-${monthIndex}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
            className={`relative mx-auto mt-5 max-w-3xl overflow-hidden rounded-[2rem] border p-5 sm:p-7 ${theme.surface}`}
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pink-500/[0.07] blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-semibold ${theme.muted}`}>
                  Registrazioni nel periodo
                </p>

                <motion.output
                  key={total}
                  aria-live="polite"
                  initial={
                    prefersReducedMotion
                      ? false
                      : { opacity: 0, y: 8, scale: 0.95 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`mt-2 block text-[clamp(5rem,19vw,8rem)] font-black leading-[0.8] tracking-[-0.11em] ${theme.text}`}
                >
                  {total}
                </motion.output>

                <p className={`mt-5 text-sm font-semibold ${theme.muted}`}>
                  Media:{" "}
                  <span className={theme.text}>
                    {average.toFixed(1)} per giorno
                  </span>
                </p>
              </div>

              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/[0.10] px-3 py-2 text-xs font-extrabold text-emerald-500">
                <TrendingUp className="h-4 w-4" strokeWidth={2.4} />+{change}%
              </span>
            </div>

            <div
              className={`relative mt-8 border-t pt-5 ${isDark ? "border-white/[0.08]" : "border-zinc-900/[0.08]"}`}
            >
              <p
                className={`max-w-[48ch] text-base font-bold leading-relaxed ${theme.text}`}
              >
                Hai registrato{" "}
                <span className="text-pink-500">
                  {difference} attività in più
                </span>{" "}
                rispetto a {report.previousLabel}.
              </p>
            </div>
          </motion.section>
        </AnimatePresence>

        <section
          className={`mx-auto mt-5 max-w-3xl overflow-hidden rounded-[1.85rem] border ${theme.surface}`}
        >
          <div className="flex items-end justify-between gap-4 px-5 pb-3 pt-5 sm:px-7 sm:pt-7">
            <div>
              <p className={`text-sm font-semibold ${theme.muted}`}>
                Andamento delle registrazioni
              </p>
              <h2
                className={`mt-1 text-2xl font-black tracking-[-0.055em] ${theme.text}`}
              >
                Il tuo ritmo nel tempo
              </h2>
            </div>

            <p
              className={`pb-1 text-right text-[11px] font-semibold ${theme.subtle}`}
            >
              Tocca una barra
            </p>
          </div>

          <div className="px-4 pb-5 pt-5 sm:px-7">
            <div
              role="list"
              aria-label={`Grafico registrazioni di ${report.label}`}
              className={`flex h-[225px] items-end ${
                period === "month" ? "gap-1" : "gap-2 sm:gap-3"
              }`}
            >
              {report.points.map((point, index) => {
                const isSelected = point.id === selectedPoint.id;
                const height = Math.max(7, (point.value / maxValue) * 100);

                const showLabel =
                  period !== "month" ||
                  index === 0 ||
                  index === 7 ||
                  index === 14 ||
                  index === 21 ||
                  index === report.points.length - 1;

                return (
                  <button
                    key={point.id}
                    type="button"
                    role="listitem"
                    aria-label={`${point.date}: ${point.value} registrazioni`}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedPointId(point.id);
                      setDetailsOpen(true);
                    }}
                    className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                  >
                    <span
                      className={`text-xs font-black ${
                        isSelected ? "text-pink-500" : "opacity-0"
                      }`}
                    >
                      {point.value}
                    </span>

                    <div
                      className={`flex h-[156px] w-full items-end overflow-hidden rounded-full ${
                        isDark ? "bg-white/[0.045]" : "bg-zinc-900/[0.045]"
                      }`}
                    >
                      <motion.span
                        initial={prefersReducedMotion ? false : { height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.42,
                          delay: prefersReducedMotion ? 0 : index * 0.025,
                          ease: "easeOut",
                        }}
                        className={`w-full rounded-full transition-colors ${
                          isSelected
                            ? "bg-pink-500"
                            : point.today
                              ? "bg-pink-400"
                              : "bg-pink-500/45 group-hover:bg-pink-500/70"
                        }`}
                      />
                    </div>

                    <span
                      className={`h-3 text-[10px] font-bold ${
                        isSelected ? "text-pink-500" : theme.subtle
                      }`}
                    >
                      {showLabel ? point.label : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className={`mt-5 flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border px-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.softSurface}`}
            >
              <span>
                <span className={`block text-sm font-black ${theme.text}`}>
                  {selectedPoint.date}
                </span>
                <span
                  className={`mt-1 block text-xs font-medium ${theme.muted}`}
                >
                  {selectedPoint.value >= average
                    ? `Sopra la media di ${average.toFixed(1)}: buon colpo.`
                    : `Sotto la media di ${average.toFixed(1)}, ma il ritmo resta vivo.`}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <strong
                  className={`block text-2xl font-black tracking-tight ${theme.text}`}
                >
                  {selectedPoint.value}
                </strong>
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.1em] ${theme.subtle}`}
                >
                  attività
                </span>
              </span>
            </button>
          </div>
        </section>

        <section className="mx-auto mt-5 grid max-w-3xl gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <article
            className={`relative overflow-hidden rounded-[1.75rem] border p-5 ${theme.softSurface}`}
          >
            <div className="pointer-events-none absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-amber-400/[0.09] blur-2xl" />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm font-bold ${theme.text}`}>
                  Streak attuale
                </p>
                <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                  Il filo non si è spezzato.
                </p>
              </div>

              <Flame className="h-6 w-6 text-amber-500" strokeWidth={2.3} />
            </div>

            <div className="relative mt-7 flex items-end gap-2">
              <span className="text-6xl font-black leading-none tracking-[-0.09em] text-amber-500">
                {report.streak}
              </span>
              <span className={`mb-2 text-sm font-bold ${theme.muted}`}>
                giorni
              </span>
            </div>

            <div
              className={`relative mt-6 h-2 overflow-hidden rounded-full ${isDark ? "bg-white/[0.08]" : "bg-zinc-900/[0.08]"}`}
            >
              <motion.div
                initial={false}
                animate={{ width: `${(report.streak / report.record) * 100}%` }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.5,
                  ease: "easeOut",
                }}
                className="h-full rounded-full bg-amber-500"
              />
            </div>

            <p className={`relative mt-3 text-xs font-semibold ${theme.muted}`}>
              {daysToRecord === 0
                ? "Hai appena eguagliato il tuo record. Evento raro."
                : `Ancora ${daysToRecord} giorni per raggiungere il record di ${report.record}.`}
            </p>
          </article>

          <article className={`rounded-[1.75rem] border p-5 ${theme.surface}`}>
            <p className={`text-sm font-bold ${theme.text}`}>
              Il periodo in tre righe
            </p>

            <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5">
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
                >
                  Giorno migliore
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
                <p className={`mt-0.5 text-xs font-medium text-emerald-500`}>
                  attività per punto
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>

      <BottomNav />

      <AnimatePresence>
        {detailsOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-3 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setDetailsOpen(false);
              }
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-detail-title"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }
              }
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
              }}
              className={`w-full max-w-md rounded-[2rem] border p-6 shadow-2xl sm:p-7 ${theme.sheet}`}
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className={`text-sm font-semibold ${theme.muted}`}>
                    Dettaglio selezionato
                  </p>
                  <h2
                    id="report-detail-title"
                    className={`mt-1 text-2xl font-black tracking-tight ${theme.text}`}
                  >
                    {selectedPoint.date}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  aria-label="Chiudi dettagli"
                  className={`grid h-11 w-11 place-items-center rounded-2xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.softSurface}`}
                >
                  <X className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>

              <div
                className={`mt-7 rounded-[1.5rem] border p-5 ${theme.softSurface}`}
              >
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.13em] ${theme.subtle}`}
                >
                  Registrazioni
                </p>

                <p
                  className={`mt-2 text-6xl font-black leading-none tracking-[-0.08em] ${theme.text}`}
                >
                  {selectedPoint.value}
                </p>

                <p
                  className={`mt-5 text-sm font-semibold leading-relaxed ${theme.muted}`}
                >
                  {selectedPoint.value === 0
                    ? "Giornata di pausa. Anche le statistiche hanno bisogno di respirare."
                    : selectedPoint.value >= average
                      ? `Sopra la media di ${average.toFixed(1)}: qui hai tenuto un bel ritmo.`
                      : `Sotto la media di ${average.toFixed(1)}, ma ogni attività fa volume nel tempo.`}
                </p>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-3 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShareOpen(false);
              }
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-report-title"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }
              }
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
              }}
              className={`w-full max-w-md rounded-[2rem] border p-6 shadow-2xl sm:p-7 ${theme.sheet}`}
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className={`text-sm font-semibold ${theme.muted}`}>
                    Anteprima report
                  </p>
                  <h2
                    id="share-report-title"
                    className={`mt-1 text-2xl font-black tracking-tight ${theme.text}`}
                  >
                    Condividi il ritmo
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  aria-label="Chiudi anteprima"
                  className={`grid h-11 w-11 place-items-center rounded-2xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.softSurface}`}
                >
                  <X className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>

              <div className="mt-7 rounded-[1.7rem] bg-pink-500 p-6 text-white shadow-[0_16px_38px_rgba(236,72,153,0.26)]">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">💩</span>
                  <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/75">
                    Cagometro
                  </span>
                </div>

                <p className="mt-8 text-sm font-bold text-white/80">
                  {report.label}
                </p>
                <p className="mt-2 text-7xl font-black leading-none tracking-[-0.09em]">
                  {total}
                </p>
                <p className="mt-2 text-sm font-bold text-white/85">
                  registrazioni · streak di {report.streak} giorni
                </p>
                <p className="mt-7 text-sm font-semibold text-white/90">
                  Miglior momento: {bestPoint.date}, con {bestPoint.value}{" "}
                  registrazioni.
                </p>
              </div>

              <button
                type="button"
                onClick={copyReport}
                className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                    Riepilogo copiato
                  </>
                ) : (
                  <>
                    <Share2 className="h-5 w-5" strokeWidth={2.3} />
                    Copia riepilogo
                  </>
                )}
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
