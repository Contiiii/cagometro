const ANONYMOUS_ENTRIES_KEY = "entries_anonymous";

const LEGACY_ACHIEVEMENT_IDS = {
  "Prima Cacca": "prima-cacca",
  Abitudinario: "abitudinario",
  Veterano: "veterano",
  Costante: "costante",
  Leggenda: "leggenda",
};

export function getShownAchievements() {
  const storedAchievements = JSON.parse(
    localStorage.getItem("shownAchievements") || "[]",
  );

  return storedAchievements.map(
    (achievement) => LEGACY_ACHIEVEMENT_IDS[achievement] ?? achievement,
  );
}

export function saveShownAchievements(achievements) {
  localStorage.setItem("shownAchievements", JSON.stringify(achievements));
}

export function loadAnonymousEntries() {
  return JSON.parse(localStorage.getItem(ANONYMOUS_ENTRIES_KEY) || "{}");
}

export function saveAnonymousEntries(entries) {
  localStorage.setItem(ANONYMOUS_ENTRIES_KEY, JSON.stringify(entries));
}

function getUserEntriesKey(userId) {
  return `entries_user_${userId}`;
}

export function loadUserEntries(userId) {
  return JSON.parse(localStorage.getItem(getUserEntriesKey(userId)) || "{}");
}

export function saveUserEntries(userId, entries) {
  localStorage.setItem(getUserEntriesKey(userId), JSON.stringify(entries));
}

export function hasAnonymousEntries() {
  return Object.keys(loadAnonymousEntries()).length > 0;
}

export function clearAnonymousEntries() {
  localStorage.removeItem(ANONYMOUS_ENTRIES_KEY);
}

function getPendingSyncKey(userId) {
  return `pending_sync_${userId}`;
}

export function loadPendingSync(userId) {
  return JSON.parse(localStorage.getItem(getPendingSyncKey(userId)) || "[]");
}

export function savePendingSync(userId, changes) {
  localStorage.setItem(getPendingSyncKey(userId), JSON.stringify(changes));
}

export function clearPendingSync(userId) {
  localStorage.removeItem(getPendingSyncKey(userId));
}
