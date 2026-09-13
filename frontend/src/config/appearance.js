export const accentOptions = [
  {
    id: "pink",
    label: "Rosa classico",
    color: "#ec4899",
    contrastText: "#ffffff",
  },
  {
    id: "amber",
    label: "Ambra sospetta",
    color: "#f59e0b",
    contrastText: "#18181b",
  },
  {
    id: "emerald",
    label: "Verde compost",
    color: "#10b981",
    contrastText: "#ffffff",
  },
  {
    id: "violet",
    label: "Viola illegale",
    color: "#8b5cf6",
    contrastText: "#ffffff",
  },
];

export const VALID_ACCENTS = accentOptions.map((option) => option.id);

export const DEFAULT_ACCENT = "pink";

export function getAccentColor(accentId) {
  return (
    accentOptions.find((option) => option.id === accentId)?.color ??
    accentOptions[0].color
  );
}

export function getAccentContrast(accentId) {
  return (
    accentOptions.find((option) => option.id === accentId)?.contrastText ??
    accentOptions[0].contrastText
  );
}