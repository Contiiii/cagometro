const ANONYMOUS_ENTRIES_KEY = "entries_anonymous";

const SETTINGS_KEY = "cagometro_settings";
const THEME_KEY = "cagometro_theme";
const SHOWN_ACHIEVEMENTS_KEY = "shownAchievements";

const LEGACY_ACHIEVEMENT_IDS = {
  "Prima Cacca": "prima-cacca",
  Abitudinario: "abitudinario",
  Veterano: "veterano",
  Costante: "costante",
  Leggenda: "leggenda",
};

export function getShownAchievements() {
  const storedAchievements = JSON.parse(
    localStorage.getItem(SHOWN_ACHIEVEMENTS_KEY) || "[]",
  );

  return storedAchievements.map(
    (achievement) => LEGACY_ACHIEVEMENT_IDS[achievement] ?? achievement,
  );
}

export function saveShownAchievements(achievements) {
  localStorage.setItem(
    SHOWN_ACHIEVEMENTS_KEY,
    JSON.stringify(achievements),
  );
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

export function clearAllLocalData(userId) {
  localStorage.removeItem(ANONYMOUS_ENTRIES_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem(SHOWN_ACHIEVEMENTS_KEY);

  if (userId) {
    localStorage.removeItem(getUserEntriesKey(userId));
    localStorage.removeItem(getPendingSyncKey(userId));
  }
}

const TEAM_SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getTeamSnapshotKey(userId) {
  return `team_snapshot_${userId}`;
}

export function loadTeamSnapshot(userId) {
  if (!userId) return null;
  try {
    const stored = localStorage.getItem(getTeamSnapshotKey(userId));
    if (!stored) return null;
    const snapshot = JSON.parse(stored);
    const age = Date.now() - snapshot.timestamp;
    if (age > TEAM_SNAPSHOT_TTL_MS) {
      localStorage.removeItem(getTeamSnapshotKey(userId));
      return null;
    }
    return snapshot.data;
  } catch (error) {
    console.error("Errore caricamento snapshot team:", error);
    return null;
  }
}

export function saveTeamSnapshot(userId, data) {
  if (!userId) return;
  try {
    localStorage.setItem(
      getTeamSnapshotKey(userId),
      JSON.stringify({
        timestamp: Date.now(),
        data,
      }),
    );
  } catch (error) {
    console.error("Errore salvataggio snapshot team:", error);
  }
}

export function clearTeamSnapshot(userId) {
  if (!userId) return;
  localStorage.removeItem(getTeamSnapshotKey(userId));
}
