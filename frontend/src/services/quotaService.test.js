// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { supabase } from "../lib/supabase";
import {
  getLatestQuotaSnapshot,
  fetchQuotaSnapshot,
  QUOTA_STORAGE_KEY,
} from "./quotaService";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

function mockQuery(resolved) {
  supabase.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue(resolved),
        }),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("quotaService", () => {
  it("restituisce null se la tabella non esiste", async () => {
    mockQuery({
      data: null,
      error: { message: 'relation "quota_snapshots" does not exist' },
    });

    await expect(getLatestQuotaSnapshot()).resolves.toBeNull();
  });

  it("restituisce lo snapshot più recente", async () => {
    const row = {
      recorded_at: "2026-09-16T10:00:00.000Z",
      period_end: "2026-09-16",
      requests: 120,
      usage: { requests_pct: 25 },
      limits: { mau: 50000 },
    };

    mockQuery({ data: row, error: null });

    await expect(getLatestQuotaSnapshot()).resolves.toEqual(row);
  });

  it("fetchQuotaSnapshot mappa e salva in cache", async () => {
    mockQuery({
      data: {
        recorded_at: "2026-09-16T10:00:00.000Z",
        period_end: "2026-09-16",
        requests: 120,
        usage: { requests_pct: 25 },
        limits: { mau: 50000 },
      },
      error: null,
    });

    const result = await fetchQuotaSnapshot();

    expect(result).toMatchObject({
      recordedAt: "2026-09-16T10:00:00.000Z",
      periodEnd: "2026-09-16",
      requests: 120,
    });
    expect(
      JSON.parse(window.localStorage.getItem(QUOTA_STORAGE_KEY)),
    ).toMatchObject({ requests: 120, periodEnd: "2026-09-16" });
  });

  it("fetchQuotaSnapshot usa la cache quando non ci sono dati", async () => {
    mockQuery({ data: null, error: null });

    window.localStorage.setItem(
      QUOTA_STORAGE_KEY,
      JSON.stringify({ requests: 42, usage: { requests_pct: 10 } }),
    );

    const result = await fetchQuotaSnapshot();

    expect(result).toMatchObject({ requests: 42 });
  });

  it("fetchQuotaSnapshot restituisce null senza dati né cache", async () => {
    mockQuery({ data: null, error: null });

    await expect(fetchQuotaSnapshot()).resolves.toBeNull();
  });
});