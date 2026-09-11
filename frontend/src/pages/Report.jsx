import { useState } from "react";
import { useReducedMotion } from "framer-motion";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useTheme } from "../hooks/useTheme";

import { useEntries } from "../hooks/useEntries";

import ReportDetailsModal from "../components/report/ReportDetailsModal";
import ReportStreakCard from "../components/report/ReportStreakCard";
import ReportSummaryCard from "../components/report/ReportSummaryCard";
import ReportHeroCard from "../components/report/ReportHeroCard";
import ReportChart from "../components/report/ReportChart";
import ReportPeriodSelector from "../components/report/ReportPeriodSelector";
import ReportMonthSelector from "../components/report/ReportMonthSelector";
import ReportShareModal from "../components/report/ReportShareModal";

import { getLocalDateKey } from "../utils/date";

import { useReportData } from "../hooks/useReportData";

export default function CagometroReport() {
  const prefersReducedMotion = useReducedMotion();

  const { entries } = useEntries();

  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const [period, setPeriod] = useState("week");
  const [selectedPointId, setSelectedPointId] = useState(() =>
    getLocalDateKey(),
  );

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const {
    report,
    total,
    average,
    difference,
    change,
    maxValue,
    selectedPoint,
    bestPoint,
    daysToRecord,
    averageLabel,
    bestLabel,
    weekPoints,
    monthPoints,
    yearPoints,
    allPoints,
  } = useReportData({
    entries,
    period,
    selectedMonth,
    selectedPointId,
  });

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

    if (nextPeriod === "month") {
      setSelectedPointId(monthPoints[monthPoints.length - 1]?.id ?? null);
      return;
    }

    if (nextPeriod === "year") {
      setSelectedPointId(yearPoints[yearPoints.length - 1]?.id ?? null);
      return;
    }

    if (nextPeriod === "all") {
      setSelectedPointId(allPoints[allPoints.length - 1]?.id ?? null);
      return;
    }

    const todayPoint = weekPoints.find((point) => point.id === todayKey);

    setSelectedPointId(todayPoint?.id ?? weekPoints[weekPoints.length - 1]?.id ?? null);
  };

  const currentMonth = new Date();

  const todayKey = getLocalDateKey();

  const todayTotal = entries?.[todayKey] ?? 0;

  const isCurrentMonth =
    selectedMonth.getMonth() === currentMonth.getMonth() &&
    selectedMonth.getFullYear() === currentMonth.getFullYear();

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="Statistiche" title="Report" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <section className="mx-auto max-w-3xl">
          <p className={`text-sm font-medium ${theme.muted}`}>{report.label}</p>

          <h1
            className={`mt-1 text-[clamp(2.15rem,7vw,4rem)] font-black leading-[0.95] tracking-[-0.075em] ${theme.text}`}
          >
            Il tuo ritmo,
            <br />
            messo <span className="text-pink-500">nero su rosa.</span>
          </h1>

          <ReportPeriodSelector
            period={period}
            changePeriod={changePeriod}
            isDark={isDark}
            theme={theme}
          />

          {period === "month" && (
            <ReportMonthSelector
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              isCurrentMonth={isCurrentMonth}
              theme={theme}
            />
          )}
        </section>

        <ReportHeroCard
          report={report}
          total={total}
          average={average}
          averageLabel={averageLabel}
          change={change}
          difference={difference}
          isDark={isDark}
          theme={theme}
          prefersReducedMotion={prefersReducedMotion}
          onShare={() => setShareOpen(true)}
        />

        <ReportChart
          report={report}
          selectedPoint={selectedPoint}
          setSelectedPointId={setSelectedPointId}
          setDetailsOpen={setDetailsOpen}
          maxValue={maxValue}
          prefersReducedMotion={prefersReducedMotion}
          isDark={isDark}
          theme={theme}
        />

        <section className="mx-auto mt-5 grid max-w-3xl gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <ReportStreakCard
            streak={report.streak}
            record={report.record}
            daysToRecord={daysToRecord}
            prefersReducedMotion={prefersReducedMotion}
            theme={theme}
            isDark={isDark}
          />

          <ReportSummaryCard
            period={period}
            bestLabel={bestLabel}
            bestPoint={bestPoint}
            report={report}
            average={average}
            theme={theme}
          />
        </section>
      </main>

      <BottomNav />

      <ReportDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        selectedPoint={selectedPoint}
        average={average}
        theme={theme}
        prefersReducedMotion={prefersReducedMotion}
      />

      <ReportShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        report={report}
        period={period}
        total={total}
        todayTotal={todayTotal}
        bestPoint={bestPoint}
        theme={theme}
        prefersReducedMotion={prefersReducedMotion}
        resolvedTheme={resolvedTheme}
      />
    </div>
  );
}
