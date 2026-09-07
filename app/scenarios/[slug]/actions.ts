"use server";

import { runDocumentedTests } from "@/lib/evidence/executor";
import type { EvidenceResult } from "@/lib/evidence/executor";
import { runDocumentedSequences } from "@/lib/evidence/replay";
import type { ReplayResult } from "@/lib/evidence/replay";

/*
 * The only two server entry points the labs expose.
 *
 * Trace: MPS-REQ-003/004/012, MPS-RULE-001/004; MTS SECURITY-ARCHITECTURE
 *        "Vulnerable demonstration rule"; MTS INTEGRATION-MANIFEST (evidence
 *        engine requires no secrets, server-side execution).
 *
 * The Next.js documentation is explicit that a Server Function is reachable by
 * a direct POST, independently of the UI, so the boundary cannot live in the
 * component that calls it. It lives in the executor: the argument is validated
 * against a closed allowlist of scenario identifiers and documented modes
 * before anything is read, and the executor holds no database connection, no
 * credential, and no query parameter of any kind.
 *
 * The worst a crafted POST can achieve is to read published evidence that the
 * page already renders, or to be rejected.
 */
export async function replayDocumentedTest(
  input: unknown,
): Promise<EvidenceResult> {
  return runDocumentedTests(input);
}

/*
 * The S3 equivalent, over the replay transcript. It is a second narrow entry
 * point rather than one widened function: each validates against its own
 * closed allowlist, so neither can be used to reach the other's evidence, and
 * neither holds a database connection, a credential, an endpoint, or a query
 * parameter of any kind.
 *
 * Worth stating plainly for this slice in particular: this is NOT a webhook
 * endpoint. It accepts no event body, no signature, and no delivery from
 * anyone. It names a published scenario and reads recorded evidence about one.
 */
export async function replayDocumentedSequence(
  input: unknown,
): Promise<ReplayResult> {
  return runDocumentedSequences(input);
}
