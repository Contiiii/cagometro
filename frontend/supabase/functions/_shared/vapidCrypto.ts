// Derivazione della chiave pubblica VAPID (runtime-only).
//
// Separato da vapid.ts per due motivi:
//   - vapid.ts resta puro e testabile con vitest (che non risolve gli
//     specifier "npm:..." della Edge Runtime);
//   - la derivazione crittografica (point multiplication P-256) usa
//     @noble/curves, gia' collaudata, invece di crypto custom.

import { p256 } from "npm:@noble/curves@1.4.2/p256";

import { verifyVapidPair } from "./vapid.ts";

export function deriveVapidPublicKey(
  privateKeyBytes: Uint8Array,
): Uint8Array | null {
  try {
    return p256.getPublicKey(privateKeyBytes, false);
  } catch {
    return null;
  }
}

export function verifyVapidKeyPair(
  publicKey: unknown,
  privateKey: unknown,
): boolean {
  return verifyVapidPair(publicKey, privateKey, deriveVapidPublicKey);
}
