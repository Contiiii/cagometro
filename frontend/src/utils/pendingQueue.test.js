// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  loadPendingOps,
  savePendingOps,
  clearPendingOps,
  enqueueOp,
  dequeueOp,
  hasPendingOps,
  createOpId,
} from "./pendingQueue";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("pendingQueue", () => {
  const USER_ID = "user-1";

  it("carica coda vuota per utente inesistente", () => {
    expect(loadPendingOps("unknown")).toEqual([]);
  });

  it("salva e carica operazioni", () => {
    const ops = [
      { id: "1", type: "saveEntry", payload: { date: "2026-09-15", count: 1 } },
      { id: "2", type: "createTeamActivity", payload: { activityType: "entry_created", points: 1 } },
    ];

    savePendingOps(USER_ID, ops);
    expect(loadPendingOps(USER_ID)).toEqual(ops);
  });

  it("clearPendingOps rimuove la coda", () => {
    savePendingOps(USER_ID, [{ id: "1", type: "test" }]);
    clearPendingOps(USER_ID);
    expect(loadPendingOps(USER_ID)).toEqual([]);
  });

  it("enqueueOp aggiunge operazione con id e timestamp", () => {
    enqueueOp(USER_ID, { type: "saveEntry", payload: { date: "2026-09-15", count: 1 } });
    const ops = loadPendingOps(USER_ID);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "saveEntry", payload: { date: "2026-09-15", count: 1 } });
    expect(ops[0].id).toBeDefined();
    expect(ops[0].timestamp).toBeDefined();
  });

  it("dequeueOp rimuove operazione per id", () => {
    enqueueOp(USER_ID, { type: "saveEntry", payload: { date: "2026-09-15", count: 1 } });
    const op = loadPendingOps(USER_ID)[0];

    dequeueOp(USER_ID, op.id);
    expect(loadPendingOps(USER_ID)).toEqual([]);
  });

  it("hasPendingOps restituisce true se ci sono operazioni", () => {
    expect(hasPendingOps(USER_ID)).toBe(false);
    enqueueOp(USER_ID, { type: "test" });
    expect(hasPendingOps(USER_ID)).toBe(true);
  });

  it("code diverse per utenti diversi", () => {
    enqueueOp("user-a", { type: "test" });
    enqueueOp("user-b", { type: "test" });

    expect(loadPendingOps("user-a")).toHaveLength(1);
    expect(loadPendingOps("user-b")).toHaveLength(1);
    expect(loadPendingOps("user-c")).toEqual([]);
  });

  it("createOpId genera id univoci con formato timestamp-suffisso", () => {
    const ids = new Set();

    for (let i = 0; i < 50; i += 1) {
      const id = createOpId();
      expect(id).toMatch(/^\d{13}-[a-z0-9]{7}$/);
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
  });

  it("enqueueOp usa createOpId per l'id dell'operazione", () => {
    enqueueOp(USER_ID, { type: "saveEntry" });

    const op = loadPendingOps(USER_ID)[0];

    expect(op.id).toMatch(/^\d{13}-[a-z0-9]{7}$/);
  });
});