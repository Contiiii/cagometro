// Validatore URL notifiche push: solo percorsi interni dell'app.
// Deve restare allineato a public.push_url_is_internal in
// supabase/migrations/20260917000008_push_notify_hardening.sql.

const INTERNAL_TOP_LEVEL = [
  "team",
  "teams",
  "report",
  "achievements",
  "settings",
  "login",
  "privacy",
  "changelog",
  "join",
];

const MAX_URL_LENGTH = 2048;

function hasControlCharacters(value) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);

    if (code < 32 || code === 127) {
      return true;
    }
  }

  return false;
}

export function isInternalPushUrl(value) {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  if (value.length > MAX_URL_LENGTH) {
    return false;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  if (value.includes(":") || value.includes("\\")) {
    return false;
  }

  if (hasControlCharacters(value)) {
    return false;
  }

  if (value === "/") {
    return true;
  }

  const segment = value.slice(1).split(/[/?#]/)[0];

  return INTERNAL_TOP_LEVEL.includes(segment.toLowerCase());
}

// B2: target del click di una notifica.
//   - url mancante -> fallback "/" (same-origin);
//   - url esterna o maleformata -> null (nessun open, il click viene ignorato);
//   - url interna -> URL assoluto, sempre same-origin rispetto a `origin`.
export function resolvePushClickTarget(rawUrl, origin) {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    return new URL("/", origin);
  }

  if (!isInternalPushUrl(rawUrl)) {
    return null;
  }

  return new URL(rawUrl, origin);
}