export const FREE_PLAN_LIMITS = {
  database_size_bytes: 500 * 1024 * 1024,
  storage_bytes: 1024 * 1024 * 1024,
  mau: 50_000,
  egress_bytes: 5 * 1024 * 1024 * 1024,
};

export function formatBytes(value) {
  const amount = Number(value) || 0;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let scaled = amount;

  while (scaled >= 1024 && index < units.length - 1) {
    scaled /= 1024;
    index += 1;
  }

  const decimals = Number.isInteger(scaled) ? 0 : 1;

  return `${scaled.toLocaleString("it-IT", {
    maximumFractionDigits: decimals,
  })} ${units[index]}`;
}

export function percentUsed(value, limit) {
  const current = Number(value) || 0;
  const max = Number(limit) || 0;

  if (max <= 0) return null;

  return Math.min(100, Math.max(0, Math.round((current / max) * 100)));
}