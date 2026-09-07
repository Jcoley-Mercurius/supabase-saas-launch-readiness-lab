/*
 * Buyer-facing framing for the two S3 evidence scenarios.
 *
 * Trace: MPS-REQ-006/007, MPS-RULE-002/003/007, MPS-ACC-007/008;
 *        MDS DESIGN-SYSTEM.md §9-10 (evidence panel, finding summary,
 *        limitation callout), MDS-REF-006.
 *
 * What belongs here: the plain-language risk, severity, affected boundary,
 * remediation direction, and limitation — the parts a person authored.
 *
 * What does NOT belong here: any result. Every decision, count, ledger row,
 * and configuration value is read from the recorded transcript, so this file
 * cannot make a claim the database did not support.
 *
 * Prohibited vocabulary — secure, certified, compliant, guaranteed, or an
 * unqualified "passed" — must never appear in this file.
 */

import type { ReplayScenarioId } from "@/lib/evidence/replay-types";

export type ReplayScenario = {
  id: ReplayScenarioId;
  /** Finding heading shown in the summary band (MDS-REF-006). */
  finding: string;
  severity: "High" | "Medium" | "Low";
  /** Why this severity, in the buyer's terms. */
  severityBasis: string;
  impact: string;
  affectedArea: string;
  /** The integration surface under test, shown in the context panel. */
  targetResource: string;
  boundary: string;
  boundaryNote: string;
  remediation: readonly string[];
  limitation: string;
};

export const REPLAY_SCENARIOS: Record<ReplayScenarioId, ReplayScenario> = {
  "webhook-integrity": {
    id: "webhook-integrity",
    finding: "Duplicate and forged event processing",
    severity: "High",
    severityBasis:
      "The documented sequences committed the same logical payment twice, accepted an event whose signature did not verify, and let a superseded event overwrite newer state — none of which requires an attacker to hold any credential.",
    impact:
      "One payment is committed more than once, an unsigned caller can mark invoices paid, and a late duplicate can overwrite the current amount with a stale one.",
    affectedArea:
      "The inbound webhook handler: signature verification, the idempotency ledger, and the ordering guard.",
    targetResource: "synthetic.handle_delivery (inbound event handler)",
    boundary: "event_id (logical event) vs delivery_id (one HTTP attempt)",
    boundaryNote:
      "A retry reuses the delivery id; a replay reuses the event id under a new delivery id. Deduplicating on the wrong one suppresses the retry and admits the replay.",
    remediation: [
      "Recompute the provider's signature over the raw request body and refuse the delivery when it does not match. Verify before parsing, and never trust a body because it arrived at the right URL.",
      "Key the idempotency ledger on the provider's logical event id, not on the delivery or attempt id, and enforce it with a unique constraint rather than a read-then-write check.",
      "Claim the ledger row and perform the work in one transaction, so a failure rolls back both and the event stays eligible for the provider's retry.",
      "Compare the provider's per-object sequence or version before applying, and refuse an event that is older than the state already applied.",
      "Keep the legitimate first-delivery path under test as well, so a fix that stops duplicates cannot quietly stop payments.",
    ],
    limitation:
      "This scenario proves handler behaviour for the documented delivery sequences against a synthetic event fixture. The signature check stands in for a provider HMAC using md5 over a canonical payload string: it demonstrates that the receiver verifies, not that md5 is a sound MAC, and a real integration must use the provider's own signature scheme and library. It does not cover a real payment provider, network transport, TLS, endpoint authentication, provider-side retry policy, queue durability, rate limiting, or any system other than this fixture.",
  },
  "reliability-and-recovery": {
    id: "reliability-and-recovery",
    finding: "Silent event loss during a downstream failure",
    severity: "High",
    severityBasis:
      "The documented sequences recorded an event as processed and then lost the work when the dependency failed, so every subsequent retry was discarded as a duplicate — with no error surfaced and no route to recovery.",
    impact:
      "A payment that the provider delivered successfully is never applied, the provider's retries are refused as duplicates, and nothing in the system reports a failure. The gap is normally found by reconciliation, if at all.",
    affectedArea:
      "The handler's failure path: when the idempotency ledger is written relative to the work, and whether the two share a transaction.",
    targetResource: "synthetic.handle_delivery (failure and retry path)",
    boundary: "ledger claim and commitment as one unit of work",
    boundaryNote:
      "If the claim commits and the work does not, the event is permanently unprocessable. If they roll back together, the provider's retry recovers it.",
    remediation: [
      "Make the ledger claim and the work one transaction, so a failure leaves neither behind and the event remains eligible for retry.",
      "Never acknowledge a delivery you could not process. Return a failure status so the provider retries, rather than swallowing the error and reporting success.",
      "Assume the outage outlasts several attempts. Verify recovery across a multi-attempt window, not just one blip.",
      "Test the recovery path itself for duplication: a manual replay after an incident is the ordinary operator response and must not double-apply.",
      "Keep unrelated events flowing while one dependency is failing, so an isolated outage does not become a total processing outage.",
    ],
    limitation:
      "This scenario proves what the handler leaves behind when its downstream dependency fails, using deterministic injected faults on a synthetic fixture. The fault is a controlled failure of one dependency: it does not model network partitions, provider timeouts, partial writes, clock skew, queue loss, connection-pool exhaustion, or a real incident's ambiguity. It exercises no monitoring, alerting, backup, or restore procedure, and none of those should be read as covered.",
  },
};

/** Shown beside every replay result so a claim never travels without its scope. */
export const REPLAY_PROVENANCE_NOTE =
  "The lab replays a transcript recorded from an isolated local PostgreSQL fixture. No webhook endpoint is published, no event body is accepted from anyone, and the deployed application holds no database connection and contacts no payment provider. The transcript, the fixture migrations that produced it, and the documented sequences are all committed to the repository, and a digest ties the transcript to that exact fixture, so the evidence shown here is reproducible rather than illustrative and cannot be edited by hand without failing its own check.";
