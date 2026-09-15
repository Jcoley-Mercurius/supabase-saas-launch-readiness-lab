import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { deploymentEnvironment } from "@/lib/deployment";

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
 *
 * PREVIEW NEVER WRITES (MTS-EXC-003).
 *
 * R1 persists to one hosted project, and that project is production's. A
 * Preview deployment is therefore treated as unconfigured here, whatever its
 * variables say: no client, no inquiry row, no measurement row. The guard sits
 * in this one factory rather than in each caller so that a Supabase variable
 * accidentally left in Vercel's Preview scope still cannot make a test
 * submission a real record. Production is unaffected, and local remains
 * configuration-dependent. Reconsider when the read-only scanner or sustained
 * post-R1 development needs a hosted Preview store of its own.
 */

/**
 * Names the calling subsystem in an outbound request header, so a request can
 * be attributed in Supabase's own logs without carrying anything about the
 * person who caused it.
 */
export type ClientPurpose = "inquiry" | "measurement";

export function serverClient(purpose: ClientPurpose): SupabaseClient | null {
  if (!supabaseConfigured()) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": purpose } },
    },
  );
}

/**
 * True when the environment may reach the database at all: both values are
 * present and the deployment is not Preview (MTS-EXC-003).
 */
export function supabaseConfigured() {
  if (deploymentEnvironment() === "preview") return false;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
