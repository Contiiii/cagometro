import { useMemo } from "react";

import {
  getMonthTotal,
  getWeeklyChartData,
  getMonthChartData,
  calculateStreak,
  calculateBestStreak,
  getPreviousWeekTotal,
  getPreviousMonthTotal,
  getPreviousYearTotal,
} from "../utils/stats";

export function useReportData({
  entries,
  period,
  selectedMonth,
  selectedPointId,
}) {
  const weeklyChartData = useMemo(() => getWeeklyChartData(entries), [entries]);

  const weekPoints = useMemo(
    () =>
      weeklyChartData.map((item) => ({
        id: item.day,
        label: item.day,
        date: item.day,
        value: item.count,
      })),
    [weeklyChartData],
  );

  const monthlyChartData = useMemo(
    () => getMonthChartData(entries, selectedMonth),
    [entries, selectedMonth],
  );

  const currentStreak = useMemo(() => calculateStreak(entries), [entries]);

  const bestStreak = useMemo(() => calculateBestStreak(entries), [entries]);

  const previousWeekTotal = useMemo(
    () => getPreviousWeekTotal(entries),
    [entries],
  );

  const previousMonthTotal = useMemo(
    () => getPreviousMonthTotal(entries, selectedMonth),
    [entries, selectedMonth],
  );

  const previousYearTotal = useMemo(
    () => getPreviousYearTotal(entries),
    [entries],
  );

  const monthPoints = useMemo(
    () =>
      monthlyChartData.map((item) => ({
        id: `${selectedMonth.getMonth()}-${item.day}`,
        label: String(item.day),
        date: `${item.day} ${selectedMonth.toLocaleDateString("it-IT", {
          month: "long",
        })}`,
        value: item.count,
      })),
    [monthlyChartData, selectedMonth],
  );

  const yearPoints = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthDate = new Date(new Date().getFullYear(), monthIndex, 1);

      return {
        id: `month-${monthIndex}`,

        label: monthDate.toLocaleDateString("it-IT", {
          month: "short",
        }),

        date: monthDate.toLocaleDateString("it-IT", {
          month: "long",
          year: "numeric",
        }),

        value: getMonthTotal(entries, monthDate),
      };
    });
  }, [entries]);

  const allPoints = useMemo(() => {
    const years = {};

    Object.entries(entries).forEach(([date, value]) => {
      const year = new Date(date).getFullYear();

      years[year] = (years[year] || 0) + Number(value || 0);
    });

    return Object.entries(years)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, total]) => ({
        id: year,
        label: year,
        date: year,
        value: Number(total),
      }));
  }, [entries]);

  const report = useMemo(() => {
    if (period === "month") {
      return {
        label: selectedMonth.toLocaleDateString("it-IT", {
          month: "long",
          year: "numeric",
        }),

        previousLabel: "mese precedente",

        previousTotal: previousMonthTotal,

        streak: currentStreak,

        record: bestStreak,

        activeDays: monthPoints.filter((point) => point.value > 0).length,

        bestTime: "-",

        points: monthPoints,
      };
    }

    if (period === "year") {
      return {
        label: `Anno ${new Date().getFullYear()}`,

        previousLabel: "anno precedente",

        previousTotal: previousYearTotal,

        streak: currentStreak,

        record: bestStreak,

        activeDays: yearPoints.filter((point) => point.value > 0).length,

        bestTime: "-",

        points: yearPoints,
      };
    }

    if (period === "all") {
      return {
        label: "Tutto",

        previousLabel: "periodo precedente",

        previousTotal: 0,

        streak: currentStreak,

        record: bestStreak,

        activeDays: allPoints.filter((point) => point.value > 0).length,

        bestTime: "-",

        points: allPoints,
      };
    }

    return {
      label: "Ultimi 7 giorni",

      previousLabel: "settimana precedente",

      previousTotal: previousWeekTotal,

      streak: currentStreak,

      record: bestStreak,

      activeDays: weekPoints.filter((point) => point.value > 0).length,

      bestTime: "-",

      points: weekPoints,
    };
  }, [
    period,
    weekPoints,
    monthPoints,
    yearPoints,
    selectedMonth,
    allPoints,
    currentStreak,
    bestStreak,
    previousWeekTotal,
    previousMonthTotal,
    previousYearTotal,
  ]);

  const total = useMemo(
    () => report.points.reduce((sum, point) => sum + point.value, 0),
    [report.points],
  );

  const average = report.points.length > 0 ? total / report.points.length : 0;
  const difference = total - report.previousTotal;
  const change =
    report.previousTotal > 0
      ? Math.round(
          ((total - report.previousTotal) / report.previousTotal) * 100,
        )
      : total > 0
        ? 100
        : 0;

  const selectedPoint = report.points.find(
    (point) => point.id === selectedPointId,
  ) ||
    report.points[report.points.length - 1] || {
      id: "empty",
      value: 0,
      date: "-",
      label: "-",
    };

  const bestPoint =
    report.points.length > 0
      ? report.points.reduce(
          (best, point) => (point.value > best.value ? point : best),
          report.points[0],
        )
      : {
          date: "-",
          value: 0,
        };

  const daysToRecord = Math.max(0, report.record - report.streak);

  const averageLabel =
    period === "year"
      ? "per mese"
      : period === "all"
        ? "per anno"
        : "per giorno";

  const bestLabel =
    period === "year"
      ? "Mese migliore"
      : period === "all"
        ? "Anno migliore"
        : "Giorno migliore";

  const maxValue = Math.max(...report.points.map((point) => point.value), 1);

  return {
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
  };
}
