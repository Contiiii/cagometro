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

export function getWeeklyChartData(entries) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const dayNames = [
    "Dom",
    "Lun",
    "Mar",
    "Mer",
    "Gio",
    "Ven",
    "Sab",
  ];

  const data = [];

  for (let index = 6; index >= 0; index--) {
    const date = new Date(today);

    date.setDate(today.getDate() - index);

    const dateString = getLocalDateKey(date);

    data.push({
      day: dayNames[date.getDay()],
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
