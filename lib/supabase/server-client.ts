import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
 * The single database client construction site.
 *
 * Trace: MTS-RISK-001 (residual control), MTS INTEGRATION-MANIFEST,
 *        MTS SECURITY-ARCHITECTURE ("keep service keys server-only");
 *        MTS-DEC-016 and MTS-OBS-050 (first-party measurement, separated from
 *        inquiries but sharing the project).
 *
 * WHY THIS FILE EXISTS.
 *
 * The recorded control for MTS-RISK-001 is that exactly one module in this
 * repository constructs a database client, so there is one place to inspect
 * when asking what the deployed application can reach. Until S6 that module
 * was lib/inquiry/store.ts, because the inquiry store was the only thing that
 * needed a connection.
 *
 * S6 adds first-party measurement, which needs one too. The choice was between
 * widening the control to a list of approved modules, coupling measurement to
 * the inquiry module, or moving the construction site out of both so it is
 * still exactly one. The owner chose the third on 2026-09-09: the control's
 * SHAPE is amended, its intent is not weakened. `inquiry-boundary.spec.ts`
 * still asserts that `createClient` appears in exactly one file — this one.
 *
 * WHAT A CALLER MAY AND MAY NOT DO.
 *
 * The key here is the PUBLISHABLE key, never a service-role key.
 * INTEGRATION-MANIFEST admits a service-role key "only if a later approved
 * server operation requires it"; none does, and `inquiry-boundary.spec.ts`
 * fails the build if one is ever read anywhere.
 *
 * That key reaches no table in either schema. Every privilege on the inquiry
 * tables and on measurement.events is revoked, and both have RLS enabled with
 * no policy. Its entire reach is the SECURITY DEFINER functions each store
 * calls. So this factory hands out a client that can do nothing except call
 * those functions — which is the property that makes one shared construction
 * site safe rather than convenient.
 *
 * The client is also allowed to be ABSENT. An unconfigured environment returns
 * null and each caller decides what that means for its own contract: for the
 * inquiry store, `unconfigured` and therefore UNCONFIRMED rather than received
 * (MPS-REQ-011); for measurement, a silently dropped event, because a missing
 * count must never affect what a visitor sees.
 */

/**
 * Names the calling subsystem in an outbound request header, so a request can
 * be attributed in Supabase's own logs without carrying anything about the
 * person who caused it.
 */
export type ClientPurpose = "inquiry" | "measurement";

export function serverClient(purpose: ClientPurpose): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": purpose } },
  });
}

/** True when the environment can actually reach the database at all. */
export function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
