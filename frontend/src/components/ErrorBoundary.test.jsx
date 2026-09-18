// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary, { RETRY_FEEDBACK_MS } from "./ErrorBoundary";

let shouldThrow = true;

function AlwaysBoom() {
  throw new Error("boom");
}

function ConditionalBoom() {
  if (shouldThrow) {
    throw new Error("boom");
  }

  return <p>contenuto ok</p>;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
  shouldThrow = true;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("mostra i figli quando non ci sono errori", () => {
    render(
      <ErrorBoundary>
        <p>contenuto ok</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText("contenuto ok")).toBeDefined();
  });

  it("mostra la schermata di errore quando un figlio lancia", () => {
    render(
      <ErrorBoundary>
        <AlwaysBoom />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Qualcosa è andato storto/)).toBeDefined();
  });

  it("al click su Riprova mostra il feedback e poi torna all'errore", () => {
    render(
      <ErrorBoundary>
        <AlwaysBoom />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));

    const retryingButton = screen.getByRole("button", { name: /Riprovo/ });

    expect(retryingButton.disabled).toBe(true);
    expect(retryingButton.getAttribute("aria-busy")).toBe("true");

    act(() => {
      vi.advanceTimersByTime(RETRY_FEEDBACK_MS);
    });

    expect(screen.getByText(/Qualcosa è andato storto/)).toBeDefined();

    const resetButton = screen.getByRole("button", { name: "Riprova" });

    expect(resetButton.disabled).toBe(false);
    expect(resetButton.getAttribute("aria-busy")).toBe("false");
  });

  it("dopo il retry riesce a rimontare i figli se l'errore è rientrato", () => {
    render(
      <ErrorBoundary>
        <ConditionalBoom />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Qualcosa è andato storto/)).toBeDefined();

    shouldThrow = false;

    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));

    act(() => {
      vi.advanceTimersByTime(RETRY_FEEDBACK_MS);
    });

    expect(screen.getByText("contenuto ok")).toBeDefined();
    expect(screen.queryByText(/Qualcosa è andato storto/)).toBeNull();
  });
});
