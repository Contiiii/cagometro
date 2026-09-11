import { getLocalDateKey, parseLocalDateKey } from "./date";

export function calculateStreak(entries) {
  let streak = 0;

  const currentDate = new Date();
  currentDate.setHours(12, 0, 0, 0);

  while (true) {
    const dateString = getLocalDateKey(currentDate);

    if ((entries[dateString] || 0) > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateBestStreak(entries) {
  const dates = Object.keys(entries)
    .filter((date) => entries[date] > 0)
    .sort();

  if (dates.length === 0) {
    return 0;
  }

  let bestStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < dates.length; index++) {
    const previousDate = parseLocalDateKey(
      dates[index - 1],
    );

    const currentDate = parseLocalDateKey(
      dates[index],
    );

    const differenceInDays =
      (currentDate - previousDate) /
      (1000 * 60 * 60 * 24);

    if (differenceInDays === 1) {
      currentStreak++;
      bestStreak = Math.max(
        bestStreak,
        currentStreak,
      );
    } else {
      currentStreak = 1;
    }
  }

  return bestStreak;
}

export function getTotalHistorical(entries) {
  return Object.values(entries).reduce((sum, value) => sum + value, 0);
}

export function getRecordHistorical(entries) {
  return Object.values(entries).length > 0
    ? Math.max(...Object.values(entries))
    : 0;
}

export function getLastNDaysTotal(entries, days) {
  let total = 0;

  for (let index = 0; index < days; index++) {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);

    const dateString = getLocalDateKey(date);

    total += entries[dateString] || 0;
  }

  return total;
}

export function getMonthTotal(entries, date) {
  const selectedYear = date.getFullYear();
  const selectedMonth = date.getMonth();

  return Object.entries(entries).reduce(
    (total, [dateKey, count]) => {
      const currentDate = parseLocalDateKey(dateKey);

      const isSelectedMonth =
        currentDate.getFullYear() === selectedYear &&
        currentDate.getMonth() === selectedMonth;

      return isSelectedMonth
        ? total + Number(count)
        : total;
    },
    0,
  );
}

export function getMonthBestStreak(entries, date) {
  const selectedYear = date.getFullYear();
  const selectedMonth = date.getMonth();

  const monthEntries = Object.entries(entries).reduce(
    (monthOnly, [dateKey, count]) => {
      const currentDate = parseLocalDateKey(dateKey);

      const isSelectedMonth =
        currentDate.getFullYear() === selectedYear &&
        currentDate.getMonth() === selectedMonth;

      if (isSelectedMonth) {
        monthOnly[dateKey] = count;
      }

      return monthOnly;
    },
    {},
  );

  return calculateBestStreak(monthEntries);
}

export function getWeeklyChartData(entries) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const dayNames = [
    "Lun",
    "Mar",
    "Mer",
    "Gio",
    "Ven",
    "Sab",
    "Dom",
  ];

  const daysFromMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);

  const data = [];

  for (let index = 0; index < 7; index++) {
    const date = new Date(monday);

    date.setDate(monday.getDate() + index);

    const dateString = getLocalDateKey(date);

    data.push({
      day: dayNames[(date.getDay() + 6) % 7],
      date: dateString,
      count: entries[dateString] || 0,
    });
  }

  return data;
}

export function getMonthChartData(entries, date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  const data = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    data.push({
      day,
      date: dateKey,
      count: entries[dateKey] || 0,
    });
  }

  return data;
}

export function getPreviousWeekTotal(entries) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const daysFromMonday = (today.getDay() + 6) % 7;
  const mondayOfPreviousWeek = new Date(today);
  mondayOfPreviousWeek.setDate(today.getDate() - daysFromMonday - 7);

  let total = 0;

  for (let index = 0; index < 7; index++) {
    const date = new Date(mondayOfPreviousWeek);

    date.setDate(mondayOfPreviousWeek.getDate() + index);

    total += entries[getLocalDateKey(date)] || 0;
  }

  return total;
}

export function getPreviousMonthTotal(entries, selectedDate) {
  const previousMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() - 1,
    1,
  );

  return getMonthTotal(entries, previousMonth);
}

export function getPreviousYearTotal(entries) {
  const previousYear = new Date().getFullYear() - 1;

  return Object.entries(entries).reduce(
    (total, [dateKey, count]) => {
      const date = parseLocalDateKey(dateKey);

      return date.getFullYear() === previousYear
        ? total + Number(count)
        : total;
    },
    0,
  );
}

export function getYearlyChartData(entries, minYears = 3) {
  const currentYear = new Date().getFullYear();

  const yearsWithData = Object.keys(entries).reduce((years, dateKey) => {
    years.add(parseLocalDateKey(dateKey).getFullYear());
    return years;
  }, new Set());

  const earliestYear = Math.min(
    yearsWithData.size > 0 ? Math.min(...yearsWithData) : currentYear,
    currentYear - (minYears - 1),
  );

  const counts = {};

  Object.entries(entries).forEach(([dateKey, count]) => {
    counts[parseLocalDateKey(dateKey).getFullYear()] =
      (counts[parseLocalDateKey(dateKey).getFullYear()] || 0) +
      Number(count || 0);
  });

  const data = [];

  for (let year = earliestYear; year <= currentYear; year++) {
    data.push({ year, count: counts[year] || 0 });
  }

  return data;
}