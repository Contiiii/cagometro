import { describe, expect, it, vi, beforeEach } from "vitest";

import { submitFeedback } from "./feedbackService";
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

describe("submitFeedback", () => {
  it("chiama la rpc submit_feedback con i parametri", async () => {
    mockRpc();

    await submitFeedback({
      category: "bug",
      message: "Si rompe tutto",
      name: "Mario",
    });

    expect(supabase.rpc).toHaveBeenCalledWith("submit_feedback", {
      p_category: "bug",
      p_message: "Si rompe tutto",
      p_author_name: "Mario",
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "Troppe segnalazioni oggi. Riprova domani." } });

    await expect(
      submitFeedback({
        category: "altro",
        message: "Test",
        name: "Mario",
      }),
    ).rejects.toThrow("Troppe segnalazioni oggi. Riprova domani.");
  });
});