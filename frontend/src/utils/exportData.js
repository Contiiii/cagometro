export const CSV_BOM = "\uFEFF";

const DEFAULT_DELIMITER = ";";

export function escapeCSVField(value) {
  const text = String(value ?? "");

  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function entriesToCSV(entries, { delimiter = DEFAULT_DELIMITER } = {}) {
  const rows = Object.entries(entries)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, count]) =>
      [date, count].map((value) => escapeCSVField(value)).join(delimiter),
    );

  const header = ["Data", "Segnalazioni"].join(delimiter);

  if (rows.length === 0) {
    return `${CSV_BOM}${header}`;
  }

  return `${CSV_BOM}${header}\r\n${rows.join("\r\n")}`;
}