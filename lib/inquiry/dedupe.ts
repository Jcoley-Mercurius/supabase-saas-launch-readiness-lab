/*
 * The bounded deduplication key.
 *
 * Trace: MPS-RULE-006 (a duplicate must not create a duplicate engagement),
 *        MPS-RULE-008 / MPS-ACC-016 ("only minimal operational deduplication
 *        metadata may remain" after retention);
 *        MTS SECURITY-ARCHITECTURE ("deduplicate using a bounded key").
 *
 * The key is a SHA-256 digest of the normalized contact address, truncated to
 * 32 hex characters. Three properties matter, and all three come from the
 * retention rule rather than from convenience:
 *
 *   bounded    — fixed length, so the one column allowed to outlive redaction
 *                cannot grow into a place inquiry content hides;
 *   opaque     — a digest, never the address, so a redacted row holds nothing
 *                readable about the person who sent it;
 *   stable     — the same sender produces the same key across submissions,
 *                which is the whole point of deduplicating on it.
 *
 * It is deliberately NOT reversible and deliberately NOT salted per request:
 * an unstable key would defeat deduplication. It is not offered as an
 * anonymisation control — a digest of a known address can be confirmed by
 * anyone who already has that address — only as the minimum needed to
 * recognise a repeat sender.
 */

import { createHash } from "node:crypto";

/** Case and surrounding whitespace only. No address-provider normalisation. */
export function normalizeContactEmail(email: string) {
  return email.trim().toLowerCase();
}

export function dedupeKey(email: string) {
  return createHash("sha256")
    .update(normalizeContactEmail(email))
    .digest("hex")
    .slice(0, 32);
}
