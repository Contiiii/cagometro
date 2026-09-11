export const avatarGradients = [
  "from-pink-400 to-fuchsia-600",
  "from-violet-400 to-indigo-600",
  "from-sky-400 to-blue-600",
  "from-emerald-300 to-teal-600",
  "from-amber-300 to-orange-500",
];

export function getAvatarGradient(userId = "") {
  const normalizedId = String(userId || "");

  const value = [...normalizedId].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return avatarGradients[value % avatarGradients.length];
}

export function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}