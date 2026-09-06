"use server";

import { runDocumentedTests } from "@/lib/evidence/executor";
import type { EvidenceResult } from "@/lib/evidence/executor";

/*
 * The only server entry point the guided lab exposes.
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
