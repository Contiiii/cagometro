// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  canSubmitFeedback,
  recordFeedbackSubmission,
} from "../utils/rateLimit";

function setStorageEntries(entries) {
  Object.entries(entries).forEach(([key, value]) => {
    window.localStorage.setItem(key, value);
  });
}

function clearStorageEntries() {
  window.localStorage.clear();
}

beforeEach(() => {
  clearStorageEntries();
});

describe("canSubmitFeedback", () => {
  it("permette il primo invio senza alcuna registrazione", () => {
    expect(canSubmitFeedback()).toEqual({ ok: true, waitMs: 0 });
  });

  it("blocca l'invio durante il cooldown di 60 secondi", () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    recordFeedbackSubmission();

    expect(canSubmitFeedback().ok).toBe(false);
    expect(canSubmitFeedback().waitMs).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it("permette di nuovo l'invio dopo i 60 secondi", () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    recordFeedbackSubmission();

    vi.setSystemTime(now + 61_000);

    expect(canSubmitFeedback()).toEqual({ ok: true, waitMs: 0 });

    vi.useRealTimers();
  });

  it("limita a 10 invii al giorno", () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    for (let index = 0; index < 10; index += 1) {
      recordFeedbackSubmission();
      vi.setSystemTime(now + (index + 1) * 61_000);
    }

    expect(canSubmitFeedback()).toEqual({ ok: false, waitMs: 0 });

    vi.useRealTimers();
  });

  it("azzera il contatore il giorno successivo", () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    for (let index = 0; index < 10; index += 1) {
      recordFeedbackSubmission();
      vi.setSystemTime(now + (index + 1) * 61_000);
    }

    vi.setSystemTime(now + 24 * 60 * 60 * 1000);

    expect(canSubmitFeedback()).toEqual({ ok: true, waitMs: 0 });

    vi.useRealTimers();
  });

  it("ignora valori corrotti in localStorage", () => {
    setStorageEntries({ feedback_count: "abc", feedback_cooldown: "xyz" });

    expect(canSubmitFeedback()).toEqual({ ok: true, waitMs: 0 });
  });
});