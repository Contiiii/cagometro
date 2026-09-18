import { describe, expect, it } from "vitest";

import {
  DEFAULT_VAPID_SUBJECT,
  decodeBase64Url,
  isVapidRejected,
  isValidVapidPrivateKey,
  isValidVapidPublicKey,
  isValidVapidSubject,
  loadVapidConfig,
  verifyVapidPair,
} from "./vapid.ts";

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function publicKeyBytes(length = 65, prefix = 0x04): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes[0] = prefix;

  for (let index = 1; index < length; index += 1) {
    bytes[index] = index % 256;
  }

  return bytes;
}

function privateKeyBytes(length = 32): Uint8Array {
  const bytes = new Uint8Array(length);

  for (let index = 0; index < length; index += 1) {
    bytes[index] = (index + 1) % 256;
  }

  return bytes;
}

function validEnv() {
  return {
    VAPID_PUBLIC_KEY: toBase64Url(publicKeyBytes()),
    VAPID_PRIVATE_KEY: toBase64Url(privateKeyBytes()),
    VAPID_SUBJECT: "mailto:admin@cagometro.app",
  };
}

describe("decodeBase64Url", () => {
  it("decodifica base64url con e senza padding", () => {
    const bytes = privateKeyBytes(8);
    const encoded = toBase64Url(bytes);

    expect(Array.from(decodeBase64Url(encoded) ?? [])).toEqual(
      Array.from(bytes),
    );
  });

  it("rifiuta valori non stringa, vuoti o con caratteri invalidi", () => {
    expect(decodeBase64Url(undefined)).toBeNull();
    expect(decodeBase64Url("")).toBeNull();
    expect(decodeBase64Url("   ")).toBeNull();
    expect(decodeBase64Url("not a key!")).toBeNull();
  });
});

describe("validazione formato chiavi VAPID", () => {
  it("accetta una pubblica di 65 byte con prefisso 0x04", () => {
    expect(isValidVapidPublicKey(toBase64Url(publicKeyBytes()))).toBe(true);
  });

  it("rifiuta pubbliche con lunghezza o prefisso errati", () => {
    expect(isValidVapidPublicKey(toBase64Url(publicKeyBytes(64)))).toBe(false);
    expect(isValidVapidPublicKey(toBase64Url(publicKeyBytes(66)))).toBe(false);
    expect(
      isValidVapidPublicKey(toBase64Url(publicKeyBytes(65, 0x02))),
    ).toBe(false);
    expect(isValidVapidPublicKey(undefined)).toBe(false);
  });

  it("accetta una privata di 32 byte e rifiuta le altre", () => {
    expect(isValidVapidPrivateKey(toBase64Url(privateKeyBytes()))).toBe(true);
    expect(isValidVapidPrivateKey(toBase64Url(privateKeyBytes(31)))).toBe(false);
    expect(isValidVapidPrivateKey(toBase64Url(privateKeyBytes(33)))).toBe(false);
  });

  it("valida il subject mailto/https", () => {
    expect(isValidVapidSubject("mailto:admin@cagometro.app")).toBe(true);
    expect(isValidVapidSubject("https://cagometro.app")).toBe(true);
    expect(isValidVapidSubject("admin@cagometro.app")).toBe(false);
    expect(isValidVapidSubject("")).toBe(false);
  });
});

describe("loadVapidConfig", () => {
  it("considera mancanti le chiavi assenti senza confonderle con errori di formato", () => {
    const result = loadVapidConfig({});

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.missing).toEqual([
        "VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY",
      ]);
      expect(result.errors).toEqual([]);
    }
  });

  it("segnala come errore una chiave presente ma malformata", () => {
    const result = loadVapidConfig({
      VAPID_PUBLIC_KEY: "c2hvcnQ",
      VAPID_PRIVATE_KEY: toBase64Url(privateKeyBytes()),
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.missing).toEqual([]);
      expect(result.errors).toContain(
        "VAPID_PUBLIC_KEY non e' una chiave P-256 valida",
      );
    }
  });

  it("restituisce la configurazione valida con subject di default", () => {
    const result = loadVapidConfig({
      VAPID_PUBLIC_KEY: toBase64Url(publicKeyBytes()),
      VAPID_PRIVATE_KEY: toBase64Url(privateKeyBytes()),
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.config.subject).toBe(DEFAULT_VAPID_SUBJECT);
      expect(result.config.publicKey).toBe(toBase64Url(publicKeyBytes()));
    }
  });

  it("rifiuta una coppia con chiavi corrette ma subject invalido", () => {
    const result = loadVapidConfig({
      ...validEnv(),
      VAPID_SUBJECT: "non-un-subject",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain("VAPID_SUBJECT non e' un subject valido");
    }
  });
});

describe("verifyVapidPair", () => {
  it("accetta quando la pubblica derivata coincide con quella configurata", () => {
    const publicKey = toBase64Url(publicKeyBytes());
    const privateKey = toBase64Url(privateKeyBytes());

    expect(
      verifyVapidPair(publicKey, privateKey, () => publicKeyBytes()),
    ).toBe(true);
  });

  it("rifiuta quando la pubblica derivata non coincide", () => {
    const publicKey = toBase64Url(publicKeyBytes());
    const privateKey = toBase64Url(privateKeyBytes());

    expect(
      verifyVapidPair(publicKey, privateKey, () =>
        publicKeyBytes(65, 0x04).map((byte, index) =>
          index === 1 ? byte ^ 0xff : byte,
        ),
      ),
    ).toBe(false);
  });

  it("rifiuta input decodificabili ma di lunghezza diversa o nulli", () => {
    const publicKey = toBase64Url(publicKeyBytes());
    const privateKey = toBase64Url(privateKeyBytes());

    expect(
      verifyVapidPair(publicKey, privateKey, () => privateKeyBytes()),
    ).toBe(false);
    expect(verifyVapidPair(publicKey, privateKey, () => null)).toBe(false);
    expect(verifyVapidPair("", privateKey, () => publicKeyBytes())).toBe(false);
  });
});

describe("isVapidRejected", () => {
  it("riconosce i 403/401 con marker VAPID", () => {
    expect(
      isVapidRejected({
        statusCode: 403,
        reason: "InvalidAuthenticationToken: invalid JWT provided",
      }),
    ).toBe(true);
    expect(
      isVapidRejected({
        statusCode: 401,
        reason: "VAPID public key mismatch",
      }),
    ).toBe(true);
    expect(
      isVapidRejected({
        statusCode: 403,
        reason: "PushSubscription has no auth",
      }),
    ).toBe(true);
  });

  it("ignora i 403 generici e gli altri status", () => {
    expect(
      isVapidRejected({ statusCode: 403, reason: "Forbidden" }),
    ).toBe(false);
    expect(
      isVapidRejected({ statusCode: 403, reason: null }),
    ).toBe(false);
    expect(
      isVapidRejected({ statusCode: 500, reason: "VAPID failure" }),
    ).toBe(false);
    expect(
      isVapidRejected({ statusCode: null, reason: "VAPID failure" }),
    ).toBe(false);
  });
});
