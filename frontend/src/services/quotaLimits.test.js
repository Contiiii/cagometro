import { describe, expect, it } from "vitest";

import {
  FREE_PLAN_LIMITS,
  formatBytes,
  percentUsed,
} from "./quotaLimits";

describe("formatBytes", () => {
  it("formatta i byte nelle unità corrette", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1,5 KB");
    expect(formatBytes(500 * 1024 * 1024)).toBe("500 MB");
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe("1,5 GB");
  });
});

describe("percentUsed", () => {
  it("calcola la percentuale di utilizzo", () => {
    expect(percentUsed(100 * 1024 * 1024, 500 * 1024 * 1024)).toBe(20);
    expect(percentUsed(450 * 1024 * 1024, 500 * 1024 * 1024)).toBe(90);
    expect(percentUsed(0, 500 * 1024 * 1024)).toBe(0);
  });

  it("blocca al 100% e restituisce null senza limite", () => {
    expect(percentUsed(600 * 1024 * 1024, 500 * 1024 * 1024)).toBe(100);
    expect(percentUsed(100, 0)).toBeNull();
  });
});

describe("FREE_PLAN_LIMITS", () => {
  it("espone i limiti del piano gratuito", () => {
    expect(FREE_PLAN_LIMITS.database_size_bytes).toBe(500 * 1024 * 1024);
    expect(FREE_PLAN_LIMITS.storage_bytes).toBe(1024 * 1024 * 1024);
    expect(FREE_PLAN_LIMITS.mau).toBe(50_000);
    expect(FREE_PLAN_LIMITS.egress_bytes).toBe(5 * 1024 * 1024 * 1024);
  });
});