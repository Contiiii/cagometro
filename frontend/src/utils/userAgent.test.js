import { describe, it, expect } from "vitest";

import { parseUserAgent } from "./userAgent";

describe("parseUserAgent", () => {
  it("riconosce Chrome su Windows", () => {
    const info = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    );

    expect(info.browser).toBe("Chrome");
    expect(info.os).toBe("Windows");
    expect(info.device).toBe("Desktop");
  });

  it("riconosce Firefox su macOS", () => {
    const info = parseUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Gecko/20100101 Firefox/127.0",
    );

    expect(info.browser).toBe("Firefox");
    expect(info.os).toBe("macOS");
    expect(info.device).toBe("Desktop");
  });

  it("riconosce Edge anche se la stringa contiene Chrome", () => {
    const info = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
    );

    expect(info.browser).toBe("Edge");
  });

  it("classifica Mobile iPhone con Safari", () => {
    const info = parseUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    );

    expect(info.browser).toBe("Safari");
    expect(info.os).toBe("iOS");
    expect(info.device).toBe("Mobile");
  });

  it("classifica Tablet iPad", () => {
    const info = parseUserAgent(
      "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    );

    expect(info.os).toBe("iPadOS");
    expect(info.device).toBe("Tablet");
  });

  it("gestisce input nullo e sconosciuto", () => {
    expect(parseUserAgent(null)).toEqual({
      browser: null,
      os: null,
      device: null,
    });

    const unknown = parseUserAgent("AlienWeb/1.0");
    expect(unknown.browser).toBeNull();
    expect(unknown.os).toBeNull();
    expect(unknown.device).toBe("Desktop");
  });
});