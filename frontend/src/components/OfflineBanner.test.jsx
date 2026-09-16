// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import OfflineBanner from "./OfflineBanner";

function setOnline(value) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

beforeEach(() => {
  setOnline(true);
});

afterEach(() => {
  cleanup();
});

describe("OfflineBanner", () => {
  it("è nascosto quando si è online", () => {
    render(<OfflineBanner />);

    expect(screen.queryByText(/Sei offline/)).toBeNull();
  });

  it("appare quando la connessione cade", () => {
    render(<OfflineBanner />);

    fireEvent(window, new Event("offline"));

    expect(screen.getByText(/Sei offline/)).toBeDefined();
  });

  it("sparisce al ritorno online", () => {
    render(<OfflineBanner />);

    fireEvent(window, new Event("offline"));

    expect(screen.getByText(/Sei offline/)).toBeDefined();

    fireEvent(window, new Event("online"));

    expect(screen.queryByText(/Sei offline/)).toBeNull();
  });

  it("è visibile al mount quando si parte già offline", () => {
    setOnline(false);

    render(<OfflineBanner />);

    expect(screen.getByText(/Sei offline/)).toBeDefined();
  });
});