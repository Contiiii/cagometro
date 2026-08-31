const ANONYMOUS_ENTRIES_KEY = "entries_anonymous";


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

export function loadAnonymousEntries() {
  return JSON.parse(
    localStorage.getItem(
      ANONYMOUS_ENTRIES_KEY
    ) || "{}"
  );
}

export function saveAnonymousEntries(
  entries
) {
  localStorage.setItem(
    ANONYMOUS_ENTRIES_KEY,
    JSON.stringify(entries)
  );
}

export function loadEntries() {
  return loadAnonymousEntries();
}

export function saveEntries(entries) {
  saveAnonymousEntries(entries);
}

function getUserEntriesKey(userId) {
  return `entries_user_${userId}`;
}

export function loadUserEntries(userId) {
  return JSON.parse(
    localStorage.getItem(
      getUserEntriesKey(userId)
    ) || "{}"
  );
}

export function saveUserEntries(
  userId,
  entries
) {
  localStorage.setItem(
    getUserEntriesKey(userId),
    JSON.stringify(entries)
  );
}

export function hasAnonymousEntries() {
  return (
    Object.keys(
      loadAnonymousEntries(),
    ).length > 0
  );
}

export function clearAnonymousEntries() {
  localStorage.removeItem(
    ANONYMOUS_ENTRIES_KEY,
  );
}
