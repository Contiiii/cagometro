const PENDING_QUEUE_PREFIX = "pending_ops_";

function getPendingQueueKey(userId) {
  return `${PENDING_QUEUE_PREFIX}${userId}`;
}

export function loadPendingOps(userId) {
  if (!userId) return [];
  try {
    const stored = localStorage.getItem(getPendingQueueKey(userId));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Errore caricamento coda operazioni:", error);
    return [];
  }
}

export function savePendingOps(userId, ops) {
  if (!userId) return;
  try {
    localStorage.setItem(getPendingQueueKey(userId), JSON.stringify(ops));
  } catch (error) {
    console.error("Errore salvataggio coda operazioni:", error);
  }
}

export function clearPendingOps(userId) {
  if (!userId) return;
  localStorage.removeItem(getPendingQueueKey(userId));
}

export function removePendingOps(userId, opIds) {
  if (!userId || !opIds?.length) return [];
  const ops = loadPendingOps(userId);
  const remaining = ops.filter((op) => !opIds.includes(op.id));
  savePendingOps(userId, remaining);
  return remaining;
}

export function enqueueOp(userId, op) {
  if (!userId) return;
  const ops = loadPendingOps(userId);
  ops.push({
    ...op,
    timestamp: Date.now(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  });
  savePendingOps(userId, ops);
  return ops;
}

export function dequeueOp(userId, opId) {
  if (!userId) return;
  const ops = loadPendingOps(userId);
  const filtered = ops.filter((op) => op.id !== opId);
  savePendingOps(userId, filtered);
  return filtered;
}

export function hasPendingOps(userId) {
  return loadPendingOps(userId).length > 0;
}