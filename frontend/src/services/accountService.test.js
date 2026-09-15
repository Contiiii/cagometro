import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  getMySessions,
  revokeSession,
  revokeOtherSessions,
  deleteAccount,
} from "./accountService";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockRpc(overrides = {}) {
  const result = {
    data: null,
    error: null,
    ...overrides,
  };

  supabase.rpc.mockResolvedValue(result);

  return result;
}

describe("getMySessions", () => {
  it("chiama la rpc get_my_sessions senza parametri", async () => {
    mockRpc({ data: [{ id: "s-1" }] });

    const sessions = await getMySessions();

    expect(supabase.rpc).toHaveBeenCalledWith("get_my_sessions");
    expect(sessions).toEqual([{ id: "s-1" }]);
  });

  it("restituisce una lista vuota quando il data è null", async () => {
    mockRpc({ data: null });

    await expect(getMySessions()).resolves.toEqual([]);
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "sessione scaduta" } });

    await expect(getMySessions()).rejects.toThrow("sessione scaduta");
  });
});

describe("revokeSession", () => {
  it("chiama la rpc revoke_session con il session id", async () => {
    mockRpc();

    await revokeSession("s-42");

    expect(supabase.rpc).toHaveBeenCalledWith("revoke_session", {
      p_session_id: "s-42",
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "impossibile revocare" } });

    await expect(revokeSession("s-42")).rejects.toThrow("impossibile revocare");
  });
});

describe("revokeOtherSessions", () => {
  it("chiama la rpc revoke_other_sessions senza parametri", async () => {
    mockRpc();

    await revokeOtherSessions();

    expect(supabase.rpc).toHaveBeenCalledWith("revoke_other_sessions");
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "revoca fallita" } });

    await expect(revokeOtherSessions()).rejects.toThrow("revoca fallita");
  });
});

describe("deleteAccount", () => {
  it("chiama la rpc delete_account senza parametri", async () => {
    mockRpc();

    await deleteAccount();

    expect(supabase.rpc).toHaveBeenCalledWith("delete_account");
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "eliminazione fallita" } });

    await expect(deleteAccount()).rejects.toThrow("eliminazione fallita");
  });
});