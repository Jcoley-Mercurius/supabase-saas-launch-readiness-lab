/*
 * The inquiry contract: fields, options, validation, and the deduplication
 * key. Shared by the client form and the server route so a field cannot be
 * validated one way in the browser and another way on the server.
 *
 * Trace: MPS-REQ-010 (role, stack, launch trigger, desired review, contact
 *        method, authorization status), MPS-REQ-013 (no credential, secret, or
 *        production data), MPS-ACC-013 (an unauthorized live-system request
 *        stops at the inquiry boundary);
 *        MTS SECURITY-ARCHITECTURE ("validate inquiry input server-side with
 *        an explicit schema", "deduplicate using a bounded key").
 *
 * Reference note. MDS-REF-008 shows name, work email, company, current stage,
 * areas of concern, and a free-text request. It shows no role field and no
 * authorization control. MPS-REQ-010 requires both, and an approved MPS
 * requirement is the first authority in the MDS visual order, ahead of a
 * canonical reference. The reference reconciliation for MDS-REF-008 also
 * records that field wording may be refined "without changing collected
 * information or safety boundary" — adding a required field the MPS mandates
 * is exactly that. The reference's six fields are all kept; role and
 * authorization status are added beside them.
 */

import { z } from "zod";

/** Launch trigger (MPS-REQ-010). MDS-REF-008 renders this as "Current stage". */
export const LAUNCH_TRIGGERS = [
  { value: "pre-launch", label: "Preparing to launch" },
  { value: "recently-launched", label: "Recently launched" },
  { value: "scaling", label: "Growing past the first customers" },
  {
    value: "investor-diligence",
    label: "Diligence or a customer security review",
  },
  {
    value: "incident-follow-up",
    label: "Following up on an incident or near miss",
  },
  { value: "other", label: "Something else" },
] as const;

/** Desired review (MPS-REQ-010), named for the four approved risk pillars. */
export const REVIEW_AREAS = [
  { value: "authorization-and-rls", label: "Authorization & RLS" },
  { value: "storage-and-configuration", label: "Storage & configuration" },
  { value: "webhook-integrity", label: "Webhook integrity" },
  { value: "reliability-and-recovery", label: "Reliability & recovery" },
  { value: "general-architecture", label: "General architecture" },
  { value: "other", label: "Other" },
] as const;

/*
 * Authorization status (MPS-REQ-010).
 *
 * `boundary: true` marks the answers that stop at the inquiry boundary. It is
 * not a rejection — the inquiry is accepted and acknowledged either way — but
 * the acknowledgement must then say plainly that documented authorization and
 * confirmed scope come first (MPS-REQ-014, MPS-ACC-013).
 */
export const AUTHORIZATION_STATUSES = [
  {
    value: "authorized-by-me",
    label: "I can authorize a review of this system",
    boundary: false,
  },
  {
    value: "client-authorization-required",
    label: "It belongs to a client, so they would authorize it",
    boundary: true,
  },
  {
    value: "not-yet-determined",
    label: "Not determined yet",
    boundary: true,
  },
] as const;

export type LaunchTrigger = (typeof LAUNCH_TRIGGERS)[number]["value"];
export type ReviewArea = (typeof REVIEW_AREAS)[number]["value"];
export type AuthorizationStatus =
  (typeof AUTHORIZATION_STATUSES)[number]["value"];

export const REVIEW_REQUEST_MAX = 2000;

export function stopsAtAuthorizationBoundary(status: AuthorizationStatus) {
  return (
    AUTHORIZATION_STATUSES.find((item) => item.value === status)?.boundary ??
    true
  );
}

/*
 * Credential guard.
 *
 * R1 has no credential path (MPS-RULE-004, MPS-REQ-013), and the approved
 * inquiry copy asks buyers to keep it high-level. A buyer can still paste a
 * key into a free-text box by accident, and the honest response is to refuse
 * the submission and say why — not to store it, not to email it, and not to
 * silently strip it and acknowledge as though nothing happened.
 *
 * The patterns are deliberately narrow and shape-based. They match things that
 * are unambiguously a credential or a connection string, never ordinary prose
 * about one: "our service role key is too widely shared" is a sentence this
 * service exists to hear, and it matches nothing here.
 */
const CREDENTIAL_PATTERNS: ReadonlyArray<{ pattern: RegExp; what: string }> = [
  { pattern: /\bsk_(live|test)_[A-Za-z0-9]{8,}/, what: "an API secret key" },
  {
    pattern: /\bey[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
    what: "a JSON Web Token",
  },
  {
    pattern: /\bpostgres(ql)?:\/\/[^\s]*:[^\s]*@/i,
    what: "a database connection string",
  },
  {
    pattern: /\b(?:authorization:\s*)?bearer\s+[A-Za-z0-9._-]{20,}/i,
    what: "a bearer token",
  },
  { pattern: /-{5}BEGIN[ A-Z]*PRIVATE KEY-{5}/, what: "a private key" },
  {
    pattern: /\b(sbp|sb)_[a-z]*_?[A-Za-z0-9]{20,}/,
    what: "a Supabase access token",
  },
  { pattern: /\bAKIA[0-9A-Z]{16}\b/, what: "an AWS access key id" },
  { pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}/, what: "a GitHub token" },
];

/** Returns a description of the first credential-shaped value found, if any. */
export function detectCredential(value: string): string | null {
  for (const { pattern, what } of CREDENTIAL_PATTERNS) {
    if (pattern.test(value)) return what;
  }
  return null;
}

/*
 * Attaches the credential guard to any string schema. It runs after the base
 * checks, so a value is only inspected once it is otherwise well formed.
 */
function guardCredentials<T extends z.ZodType<string>>(schema: T) {
  return schema.superRefine((value, ctx) => {
    const found = detectCredential(value);
    if (found) {
      ctx.addIssue({
        code: "custom",
        message: `This looks like ${found}. Remove it and describe the situation instead \u2014 this service never needs a credential, secret, or production data.`,
      });
    }
  });
}

const trimmed = (min: number, max: number, label: string) =>
  guardCredentials(
    z
      .string()
      .trim()
      .min(min, `${label} is required.`)
      .max(max, `${label} must be ${max} characters or fewer.`),
  );

/*
 * The server-side schema. Every field is required except the organization,
 * because MPS-REQ-010 names six things an inquiry contains and the operator
 * cannot qualify a request that is missing one of them.
 */
export const inquirySchema = z.object({
  contactName: trimmed(1, 120, "Name"),
  contactEmail: guardCredentials(
    z
      .string()
      .trim()
      .min(1, "Work email is required.")
      .max(254, "Work email must be 254 characters or fewer.")
      .pipe(z.email("Enter an email address we can reply to.")),
  ),
  organization: guardCredentials(
    z
      .string()
      .trim()
      .max(160, "Company or project must be 160 characters or fewer."),
  ).default(""),
  buyerRole: trimmed(1, 120, "Your role"),
  stackSummary: trimmed(1, 300, "Your stack"),
  launchTrigger: z.enum(
    LAUNCH_TRIGGERS.map((item) => item.value) as [
      LaunchTrigger,
      ...LaunchTrigger[],
    ],
    { error: "Select what is prompting this review." },
  ),
  reviewAreas: z
    .array(
      z.enum(
        REVIEW_AREAS.map((item) => item.value) as [ReviewArea, ...ReviewArea[]],
      ),
    )
    .min(1, "Select at least one area you would like reviewed.")
    .max(REVIEW_AREAS.length),
  reviewRequest: trimmed(
    20,
    REVIEW_REQUEST_MAX,
    "What you would like reviewed",
  ),
  authorizationStatus: z.enum(
    AUTHORIZATION_STATUSES.map((item) => item.value) as [
      AuthorizationStatus,
      ...AuthorizationStatus[],
    ],
    { error: "Tell us who can authorize a review of this system." },
  ),
  /*
   * MPS-REQ-014 and MPS-ACC-013: the buyer confirms they understand that live
   * work starts only after documented authorization and separately confirmed
   * scope. The approved component table lists exactly this control — "Checkbox
   * — default, authorization confirmation".
   */
  authorizationAcknowledged: z.literal(true, {
    error:
      "Confirm that live work begins only after authorization and scope are documented.",
  }),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

/** Field-keyed validation messages, in the form's own field order. */
export type InquiryFieldErrors = Partial<Record<keyof InquiryInput, string>>;

export function validateInquiry(
  input: unknown,
):
  | { ok: true; value: InquiryInput }
  | { ok: false; errors: InquiryFieldErrors } {
  const parsed = inquirySchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };

  const errors: InquiryFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as keyof InquiryInput] = issue.message;
    }
  }
  return { ok: false, errors };
}
