// Validazione della configurazione VAPID e classificazione degli errori di
// configurazione. Modulo puro (nessuna API Deno) cosi' e' testabile con vitest
// esattamente come _shared/pushRetry.ts.

export type VapidEnv = Record<string, string | undefined>;

export type VapidConfig = {
  subject: string;
  publicKey: string;
  privateKey: string;
};

export type VapidConfigResult =
  | { ok: true; config: VapidConfig }
  | { ok: false; missing: string[]; errors: string[] };

export type VapidRejectionLike = {
  statusCode?: number | null;
  reason?: string | null;
};

export const DEFAULT_VAPID_SUBJECT = "mailto:admin@cagometro.app";

// Marker tipici di un 401/403 dovuto a VAPID errata (chiave non valida, JWT non
// verificabile, coppia pubblico/privato non coerente con la subscription).
export const VAPID_REJECTION_PATTERN =
  /vapid|json ?web ?token|jwt|invalidauthenticationtoken|badjwttoken|unauthorizedregistration|invalidtoken|pushsubscription has no auth/i;

const BASE64URL_PATTERN = /^[A-Za-z0-9+/=_-]+$/;

// Una chiave pubblica VAPID e' un punto P-256 non compresso: 65 byte con
// prefisso 0x04. La privata e' uno scalare da 32 byte.
const PUBLIC_KEY_LENGTH = 65;
const PRIVATE_KEY_LENGTH = 32;
const UNCOMPRESSED_POINT_PREFIX = 0x04;

export function decodeBase64Url(value: unknown): Uint8Array | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "" || !BASE64URL_PATTERN.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);

  let raw: string;

  try {
    raw = atob(normalized + padding);
  } catch {
    return null;
  }

  const bytes = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }

  return bytes;
}

export function isValidVapidPublicKey(value: unknown): boolean {
  const bytes = decodeBase64Url(value);

  return (
    bytes !== null &&
    bytes.length === PUBLIC_KEY_LENGTH &&
    bytes[0] === UNCOMPRESSED_POINT_PREFIX
  );
}

export function isValidVapidPrivateKey(value: unknown): boolean {
  const bytes = decodeBase64Url(value);

  return bytes !== null && bytes.length === PRIVATE_KEY_LENGTH;
}

export function isValidVapidSubject(value: unknown): boolean {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  return /^(mailto:[^@\s]+@[^@\s]+|https?:\/\/\S+)$/i.test(value.trim());
}

export function loadVapidConfig(env: VapidEnv): VapidConfigResult {
  const publicKey = (env?.VAPID_PUBLIC_KEY ?? "").trim();
  const privateKey = (env?.VAPID_PRIVATE_KEY ?? "").trim();
  const subject =
    (env?.VAPID_SUBJECT ?? "").trim() || DEFAULT_VAPID_SUBJECT;

  const missing: string[] = [];
  const errors: string[] = [];

  if (publicKey === "") {
    missing.push("VAPID_PUBLIC_KEY");
  } else if (!isValidVapidPublicKey(publicKey)) {
    errors.push("VAPID_PUBLIC_KEY non e' una chiave P-256 valida");
  }

  if (privateKey === "") {
    missing.push("VAPID_PRIVATE_KEY");
  } else if (!isValidVapidPrivateKey(privateKey)) {
    errors.push("VAPID_PRIVATE_KEY non e' una chiave valida");
  }

  if (!isValidVapidSubject(subject)) {
    errors.push("VAPID_SUBJECT non e' un subject valido");
  }

  if (missing.length > 0 || errors.length > 0) {
    return { ok: false, missing, errors };
  }

  return { ok: true, config: { subject, publicKey, privateKey } };
}

// Verifica che pubblico e privato formino una coppia: la derivazione e'
// iniettata per restare pura/testabile (in produzione arriva da vapidCrypto.ts).
export function verifyVapidPair(
  publicKey: unknown,
  privateKey: unknown,
  derivePublicKey: (privateKeyBytes: Uint8Array) => Uint8Array | null,
): boolean {
  const expected = decodeBase64Url(publicKey);
  const privateBytes = decodeBase64Url(privateKey);

  if (!expected || !privateBytes) {
    return false;
  }

  const derived = derivePublicKey(privateBytes);

  if (!derived || derived.length !== expected.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected[index] ^ derived[index];
  }

  return diff === 0;
}

export function isVapidRejected(outcome: VapidRejectionLike): boolean {
  const statusCode = outcome?.statusCode ?? null;

  if (statusCode !== 401 && statusCode !== 403) {
    return false;
  }

  const reason = typeof outcome?.reason === "string" ? outcome.reason : "";

  return VAPID_REJECTION_PATTERN.test(reason);
}
