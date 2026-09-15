export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function getWeekRangeLabel(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0);

  const daysFromMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const dayNumberFormatter = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
  });

  const monthFormatter = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
  });

  const fullFormatter = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (
    monday.getMonth() === sunday.getMonth() &&
    monday.getFullYear() === sunday.getFullYear()
  ) {
    return `${dayNumberFormatter.format(monday)} – ${fullFormatter.format(sunday)}`;
  }

  if (monday.getFullYear() === sunday.getFullYear()) {
    return `${monthFormatter.format(monday)} – ${fullFormatter.format(sunday)}`;
  }

  return `${fullFormatter.format(monday)} – ${fullFormatter.format(sunday)}`;
}
