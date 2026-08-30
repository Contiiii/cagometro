export function calculateStreak(entries) {
  let streak = 0;
  const currentDate = new Date();

  while (true) {
    const dateString = currentDate.toISOString().split("T")[0];

    if ((entries[dateString] || 0) > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getTotalHistorical(entries) {
  return Object.values(entries).reduce(
    (sum, value) => sum + value,
    0
  );
}

export function getRecordHistorical(entries) {
  return Object.values(entries).length > 0
    ? Math.max(...Object.values(entries))
    : 0;
}

export function getLastNDaysTotal(entries, days) {
  let total = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date();

    date.setDate(date.getDate() - i);

    const dateString = date
      .toISOString()
      .split("T")[0];

    total += entries[dateString] || 0;
  }

  return total;
}

export function getMonthTotal(entries, date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  return Object.entries(entries).reduce(
    (sum, [day, count]) => {
      const current = new Date(day);

      if (
        current.getFullYear() === year &&
        current.getMonth() === month
      ) {
        return sum + count;
      }

      return sum;
    },
    0,
  );
}

export function getWeeklyChartData(entries) {
  const today = new Date();

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

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const isoDate = date.toISOString().split("T")[0];

    data.push({
      day: dayNames[date.getDay()],
      count: entries[isoDate] || 0,
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
    const isoDate = `${year}-${String(month + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    data.push({
      day,
      count: entries[isoDate] || 0,
    });
  }

  return data;
}