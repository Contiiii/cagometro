export function loadEntries() {
  return JSON.parse(
    localStorage.getItem("entries") || "{}"
  );
}

export function saveEntries(entries) {
  localStorage.setItem(
    "entries",
    JSON.stringify(entries)
  );
}

export function getShownAchievements() {
  return JSON.parse(
    localStorage.getItem("shownAchievements") || "[]"
  );
}

export function saveShownAchievements(
  achievements
) {
  localStorage.setItem(
    "shownAchievements",
    JSON.stringify(achievements)
  );
}


