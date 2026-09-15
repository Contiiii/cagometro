import { describe, expect, it, vi, beforeEach } from "vitest";

import { getEntries, saveEntry, importEntries } from "./entriesService";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockFromChain(overrides = {}) {
  const builder = {
    data: null,
    error: null,
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    onConflict: vi.fn(() => builder),
    ...overrides,
  };

  supabase.from.mockReturnValue(builder);

  return builder;
}

describe("getEntries", () => {
  it("seleziona date e count per l'utente e restituisce i dati", async () => {
    const chain = mockFromChain({
      data: [
        { date: "2026-09-13", count: 3 },
        { date: "2026-09-14", count: 1 },
      ],
    });

    const data = await getEntries("user-1");

    expect(supabase.from).toHaveBeenCalledWith("entries");
    expect(chain.select).toHaveBeenCalledWith("date,count");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(data).toEqual([
      { date: "2026-09-13", count: 3 },
      { date: "2026-09-14", count: 1 },
    ]);
  });

  it("propaga l'errore del database", async () => {
    mockFromChain({ error: { message: "rete ko" } });

    await expect(getEntries("user-1")).rejects.toThrow("rete ko");
  });
});

describe("saveEntry", () => {
  it("esegue un upsert con onConflict user_id,date", async () => {
    const chain = mockFromChain({ data: [{ user_id: "user-1", date: "2026-09-13", count: 1 }] });

    const data = await saveEntry({
      userId: "user-1",
      date: "2026-09-13",
      count: 1,
    });

    expect(supabase.from).toHaveBeenCalledWith("entries");
    expect(chain.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", date: "2026-09-13", count: 1 },
      { onConflict: "user_id,date" },
    );
    expect(data).toEqual([{ user_id: "user-1", date: "2026-09-13", count: 1 }]);
  });

  it("propaga l'errore del database", async () => {
    mockFromChain({ error: { message: "scrittura bloccata" } });

    await expect(
      saveEntry({ userId: "user-1", date: "2026-09-13", count: 1 }),
    ).rejects.toThrow("scrittura bloccata");
  });
});

describe("importEntries", () => {
  it("mappa le entries in righe con user_id,date,count", async () => {
    const chain = mockFromChain({
      data: [
        { user_id: "user-1", date: "2026-09-13", count: 3 },
        { user_id: "user-1", date: "2026-09-14", count: 2 },
      ],
    });

    const data = await importEntries("user-1", {
      "2026-09-13": 3,
      "2026-09-14": 2,
    });

    expect(chain.upsert).toHaveBeenCalledWith(
      [
        { user_id: "user-1", date: "2026-09-13", count: 3 },
        { user_id: "user-1", date: "2026-09-14", count: 2 },
      ],
      { onConflict: "user_id,date" },
    );
    expect(data).toEqual([
      { user_id: "user-1", date: "2026-09-13", count: 3 },
      { user_id: "user-1", date: "2026-09-14", count: 2 },
    ]);
  });

  it("con entries vuote non contatta il database", async () => {
    const data = await importEntries("user-1", {});

    expect(supabase.from).not.toHaveBeenCalled();
    expect(data).toEqual([]);
  });

  it("propaga l'errore del database", async () => {
    mockFromChain({ error: { message: "import fallito" } });

    await expect(importEntries("user-1", { "2026-09-13": 1 })).rejects.toThrow(
      "import fallito",
    );
  });
});