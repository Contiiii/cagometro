export const accentOptions = [
  {
    id: "pink",
    label: "Rosa",
    fill: "#ec4899",
    contrast: "#18181b",
    inkLight: "#be185d",
    inkDark: "#ec4899",
  },
  {
    id: "amber",
    label: "Ambra",
    fill: "#f59e0b",
    contrast: "#18181b",
    inkLight: "#92400e",
    inkDark: "#f59e0b",
  },
  {
    id: "emerald",
    label: "Verde",
    fill: "#10b981",
    contrast: "#18181b",
    inkLight: "#065f46",
    inkDark: "#10b981",
  },
  {
    id: "violet",
    label: "Viola",
    fill: "#7c3aed",
    contrast: "#ffffff",
    inkLight: "#6d28d9",
    inkDark: "#a78bfa",
  },
];

export const VALID_ACCENTS = accentOptions.map((option) => option.id);

export const DEFAULT_ACCENT = "pink";

export function getAccentColor(accentId) {
  return (
    accentOptions.find((option) => option.id === accentId)?.fill ??
    accentOptions[0].fill
  );
}

export function getAccentContrast(accentId) {
  return (
    accentOptions.find((option) => option.id === accentId)?.contrast ??
    accentOptions[0].contrast
  );
}

export function getAccentInk(accentId, isDark) {
  const option =
    accentOptions.find((item) => item.id === accentId) ?? accentOptions[0];

  return isDark ? (option.inkDark ?? option.fill) : option.inkLight;
}