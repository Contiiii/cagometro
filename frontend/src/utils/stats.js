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