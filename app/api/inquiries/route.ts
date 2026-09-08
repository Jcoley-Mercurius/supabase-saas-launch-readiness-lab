import { NextResponse } from "next/server";
import { submitInquiry } from "@/lib/inquiry/submit";

/*
 * The inquiry route handler — the single server entry point for S5.
 *
 * Trace: MTS INTEGRATION-MANIFEST, which places the inquiry route at
 *        `app/api/inquiries/route.ts` and scopes it to schema validation,
 *        rate limiting, duplicate handling, and delivery-failure behaviour;
 *        MPS-REQ-010/011/012.
 *
 * Path note: the manifest writes this as `src/app/api/inquiries/route.ts`.
 * This repository was initialised without a `src` directory — every route
 * since P0 lives at `app/` — so the segment path is the manifest's and the
 * root is the repository's. No boundary changes.
 *
 * POST only. The Next.js Route Handler documentation is explicit that GET is
 * the only cacheable method and that an unsupported method answers 405 on its
 * own, so there is deliberately no GET, no PUT, and no DELETE here: an inquiry
 * store with a read route would be a read path into buyer contact data, and
 * the approved model has none.
 *
 * The response is a state, never a record. It carries no reference id, no
 * stored field, and no provider detail — only what the page must render. The
 * status codes describe the outcome to a machine; the body describes it to the
 * page. Neither ever says "received" unless a row exists.
 */

export const dynamic = "force-dynamic";

const STATUS = {
  acknowledged: 201,
  duplicate: 200,
  invalid: 422,
  rate_limited: 429,
  unconfirmed: 503,
} as const;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    // A body that is not JSON never reaches the schema.
    return NextResponse.json(
      { state: "invalid", errors: {} },
      { status: STATUS.invalid },
    );
  }

  const outcome = await submitInquiry(payload);
  return NextResponse.json(outcome, { status: STATUS[outcome.state] });
}
