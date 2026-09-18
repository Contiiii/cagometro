// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import {
  getPushOptInEligibility,
  hasSeenPushInstallPrompt,
  hasSeenPushOptIn,
  isIosDevice,
  isIosNonStandalone,
  isStandaloneDisplay,
  markPushInstallPromptSeen,
  markPushOptInSeen,
} from "./pushOptIn";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

afterEach(() => {
  window.localStorage.clear();

  delete window.navigator.standalone;
  delete window.matchMedia;
});

describe("pushOptIn storage flags", () => {
  it("parte non visto e memorizza opt-in e install separatamente", () => {
    expect(hasSeenPushOptIn()).toBe(false);
    expect(hasSeenPushInstallPrompt()).toBe(false);

    markPushOptInSeen();

    expect(hasSeenPushOptIn()).toBe(true);
    expect(hasSeenPushInstallPrompt()).toBe(false);

    markPushInstallPromptSeen();

    expect(hasSeenPushInstallPrompt()).toBe(true);
  });

  it("non lancia se lo storage è inaccessibile", () => {
    const brokenStorage = {
      getItem() {
        throw new Error("bloccato");
      },
      setItem() {
        throw new Error("bloccato");
      },
    };

    expect(hasSeenPushOptIn(brokenStorage)).toBe(false);
    expect(() => markPushOptInSeen(brokenStorage)).not.toThrow();
  });
});

describe("rilevamento iOS", () => {
  it("riconosce iPhone e Android", () => {
    expect(isIosDevice(IPHONE_UA)).toBe(true);
    expect(isIosDevice(ANDROID_UA)).toBe(false);
    expect(isIosDevice("")).toBe(false);
  });

  it("rileva la modalità standalone da navigator.standalone", () => {
    expect(isStandaloneDisplay()).toBe(false);

    Object.defineProperty(window.navigator, "standalone", {
      value: true,
      configurable: true,
    });

    expect(isStandaloneDisplay()).toBe(true);
    expect(isIosNonStandalone(IPHONE_UA)).toBe(false);
  });

  it("rileva la modalità standalone da matchMedia", () => {
    window.matchMedia = () => ({ matches: true });

    expect(isStandaloneDisplay()).toBe(true);
    expect(isIosNonStandalone(IPHONE_UA)).toBe(false);
  });

  it("iOS in Safari non installata è non-standalone", () => {
    expect(isIosNonStandalone(IPHONE_UA)).toBe(true);
    expect(isIosNonStandalone(ANDROID_UA)).toBe(false);
  });
});

describe("getPushOptInEligibility", () => {
  const base = {
    user: { id: "u-1" },
    isSupported: true,
    initialized: true,
    permission: "default",
    isSubscribed: false,
    optInSeen: false,
    installPromptSeen: false,
    iosNonStandalone: false,
  };

  it("non propone nulla senza utente", () => {
    expect(getPushOptInEligibility({ ...base, user: null })).toEqual({
      shouldPrompt: false,
      mode: null,
    });
  });

  it("propone l'opt-in quando è tutto pronto", () => {
    expect(getPushOptInEligibility(base)).toEqual({
      shouldPrompt: true,
      mode: "optin",
    });
  });

  it("non ripete l'opt-in già visto", () => {
    expect(getPushOptInEligibility({ ...base, optInSeen: true })).toEqual({
      shouldPrompt: false,
      mode: null,
    });
  });

  it("non propone se il permesso non è più default", () => {
    expect(
      getPushOptInEligibility({ ...base, permission: "granted" }).shouldPrompt,
    ).toBe(false);
    expect(
      getPushOptInEligibility({ ...base, permission: "denied" }).shouldPrompt,
    ).toBe(false);
  });

  it("non propone se già sottoscritto, non supportato o non inizializzato", () => {
    expect(
      getPushOptInEligibility({ ...base, isSubscribed: true }).shouldPrompt,
    ).toBe(false);
    expect(
      getPushOptInEligibility({ ...base, isSupported: false }).shouldPrompt,
    ).toBe(false);
    expect(
      getPushOptInEligibility({ ...base, initialized: false }).shouldPrompt,
    ).toBe(false);
  });

  it("su iOS non installata propone l'invito a installare", () => {
    expect(getPushOptInEligibility({ ...base, iosNonStandalone: true })).toEqual(
      { shouldPrompt: true, mode: "install" },
    );
  });

  it("su iOS non installata non ripete l'invito già visto", () => {
    expect(
      getPushOptInEligibility({
        ...base,
        iosNonStandalone: true,
        installPromptSeen: true,
      }),
    ).toEqual({ shouldPrompt: false, mode: null });
  });

  it("su iOS non installata non conta lo stato di opt-in", () => {
    expect(
      getPushOptInEligibility({
        ...base,
        iosNonStandalone: true,
        isSupported: false,
        optInSeen: true,
      }),
    ).toEqual({ shouldPrompt: true, mode: "install" });
  });
});
