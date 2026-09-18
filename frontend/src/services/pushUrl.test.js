import { describe, expect, it } from "vitest";

import { isInternalPushUrl, resolvePushClickTarget } from "./pushUrl";

const ORIGIN = "https://cagometro.app";

describe("isInternalPushUrl - percorsi validi", () => {
  it.each([
    "/",
    "/teams",
    "/settings",
    "/report",
    "/achievements",
    "/team",
    "/login",
    "/privacy",
    "/changelog",
    "/join/ABC123",
    "/settings/generale",
    "/teams/",
    "/report?from=2026-01-01",
    "/TEAMS",
  ])("accetta %s", (value) => {
    expect(isInternalPushUrl(value)).toBe(true);
  });
});

describe("isInternalPushUrl - URL bloccate", () => {
  it.each([
    "https://evil.com",
    "https://evil.com/path",
    "http://evil.com",
    "//evil.com",
    "//evil.com/path",
    "javascript:alert(1)",
    "javascript://comment%0aalert(1)",
    "data:text/html,<script>alert(1)</script>",
    "data:;base64,SGVsbG8=",
  ])("blocca %s", (value) => {
    expect(isInternalPushUrl(value)).toBe(false);
  });
});

describe("isInternalPushUrl - URL vuote e maleformate", () => {
  it.each(["", "   ", "not-a-path", "/teams\n", "/evil\\x.com", "/:foo", "\\server\\share", "/teams:evila"])(
    "blocca %j",
    (value) => {
      expect(isInternalPushUrl(value)).toBe(false);
    },
  );

  it("blocca path oltre la lunghezza massima", () => {
    expect(isInternalPushUrl(`/${"a".repeat(2048)}`)).toBe(false);
  });

  it("blocca valori non stringa", () => {
    expect(isInternalPushUrl(null)).toBe(false);
    expect(isInternalPushUrl(undefined)).toBe(false);
    expect(isInternalPushUrl(123)).toBe(false);
  });
});

describe("resolvePushClickTarget", () => {
  it("URL interna -> URL assoluto same-origin", () => {
    const target = resolvePushClickTarget("/teams", ORIGIN);

    expect(target?.origin).toBe("https://cagometro.app");
    expect(target?.pathname).toBe("/teams");
  });

  it("URL assente NULL -> fallback a /", () => {
    expect(resolvePushClickTarget(undefined, ORIGIN)?.pathname).toBe("/");
    expect(resolvePushClickTarget(null, ORIGIN)?.pathname).toBe("/");
    expect(resolvePushClickTarget("", ORIGIN)?.pathname).toBe("/");
  });

  it("URL esterna -> null (click ignorato)", () => {
    expect(resolvePushClickTarget("https://evil.com", ORIGIN)).toBeNull();
    expect(resolvePushClickTarget("//evil.com", ORIGIN)).toBeNull();
  });

  it("schemi pericolosi -> null", () => {
    expect(resolvePushClickTarget("javascript:alert(1)", ORIGIN)).toBeNull();
    expect(resolvePushClickTarget("data:text/html,x", ORIGIN)).toBeNull();
  });

  it("converte un percorso relativo al percorso di origine", () => {
    const target = resolvePushClickTarget("/settings", "https://cagometro.app/sub/app");

    expect(target?.origin).toBe("https://cagometro.app");
    expect(target?.pathname).toBe("/settings");
  });
});