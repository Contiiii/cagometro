const SYNC_TONE = {
  synced: {
    label: "Sincronizzazione automatica attiva",
    dotClass: "bg-emerald-500",
    iconColor: null,
    ping: true,
  },
  pending: {
    label: (pendingCount) =>
      pendingCount > 0
        ? pendingCount === 1
          ? "1 modifica in attesa"
          : `${pendingCount} modifiche in attesa`
        : "In attesa di sincronizzazione",
    dotClass: "bg-amber-500",
    iconColor: "#f59e0b",
    ping: false,
  },
  error: {
    label: "Errore di sincronizzazione",
    dotClass: "bg-rose-500",
    iconColor: "#f43f5e",
    ping: false,
  },
  off: {
    label: "Sincronizzazione non disponibile",
    dotClass: "bg-amber-500",
    iconColor: "#f59e0b",
    ping: false,
  },
};

export function resolveSyncState(user, syncStatus, pendingOps) {
  let tone;

  if (!user) {
    tone = "off";
  } else if (syncStatus === "error") {
    tone = "error";
  } else if (pendingOps.length > 0) {
    tone = "pending";
  } else if (syncStatus === "pending") {
    tone = "pending";
  } else {
    tone = "synced";
  }

  const entry = SYNC_TONE[tone];

  return {
    tone,
    label:
      typeof entry.label === "function"
        ? entry.label(pendingOps.length)
        : entry.label,
    dotClass: entry.dotClass,
    iconColor: entry.iconColor,
    ping: entry.ping,
  };
}