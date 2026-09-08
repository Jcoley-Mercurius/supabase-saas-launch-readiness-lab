/*
 * Authored copy for the inquiry route. Framing only.
 *
 * Trace: MPS-REQ-011 (no promise of response time, price, or outcome),
 *        MPS-REQ-013/014, MPS-RULE-003/005/006, MPS-ACC-011/012/013;
 *        MDS COMPOSITION-PROPOSAL "Inquiry shell", MDS-REF-008.
 *
 * Prohibited vocabulary — secure, certified, compliant, guaranteed, or an
 * unqualified "passed" — must never appear in this file. Neither may a
 * timeline, a price, a turnaround, an availability, or an outcome: MPS-REQ-011
 * forbids all five, and this is the file where they would try to creep in.
 *
 * Read "We follow up with next steps" carefully: it says what happens, not
 * when. That is the deliberate wording, and it is why no step below carries a
 * duration.
 */

export const INQUIRY_PAGE = {
  eyebrow: "Launch-readiness lab",
  title: "Discuss an authorized review",
  description:
    "Share your project context and goals. We'll review the details and get back to you with next steps for a scoped, evidence-led analysis.",
  /*
   * MDS-REF-008 "Four review pillars". The heading names what a review covers
   * without promising an outcome, a timeline, or a scope beyond the four
   * documented pillars (MPS-RULE-005).
   */
  pillars: {
    title: "Four review pillars",
    description:
      "A review covers the areas that most often block a Supabase SaaS launch. Each one has a documented scenario you can explore first.",
  },
} as const;

/** MDS-REF-008 "What happens next". No step states or implies a timeline. */
export const WHAT_HAPPENS_NEXT = [
  {
    title: "We review your inquiry",
    body: "We look over your project details to understand the situation and confirm whether this is a fit.",
  },
  {
    title: "We follow up with next steps",
    body: "We reply with guidance and options for a review approach suited to your stack and your launch.",
  },
  {
    title: "You decide how to proceed",
    body: "You choose what makes sense for your team. Nothing is committed by sending an inquiry.",
  },
] as const;

/** MDS-REF-008 "Authorized scope and privacy". */
export const SCOPE_AND_PRIVACY = {
  title: "Authorized scope and privacy",
  body: "This service uses synthetic scenarios and does not require access to your systems. Please do not include credentials, secrets, production data, or sensitive customer information in your inquiry. Share high-level details only.",
} as const;

/**
 * The authorization boundary, stated before the fields rather than after them
 * (MPS-REQ-014; the approved inquiry shell puts expectations and the
 * authorization boundary before/beside the form).
 */
export const AUTHORIZATION_BOUNDARY = {
  title: "Authorization comes before any live work",
  body: "Everything on this site runs against a synthetic environment. Nothing here authorizes testing of your system or anyone else's. Work on a live system begins only after authorization and scope are documented and confirmed separately — and if the system belongs to a client, the authorization has to come from them.",
} as const;

export const FORM = {
  title: "Review inquiry",
  description: "Tell us about your project and what you'd like reviewed.",
  submit: "Submit review inquiry",
  submitting: "Submitting",
  privacyNotice: {
    title: "Please keep it high-level",
    body: "Do not include credentials, secrets, production data, or sensitive customer information. This form is for project context only.",
  },
} as const;

/*
 * Outcome copy. Each of these maps to one required MDS inquiry state, and each
 * says exactly what did and did not happen.
 *
 * The acknowledgement is the sentence MPS-REQ-011 and MPS-RULE-005 constrain
 * most tightly: it confirms arrival and nothing else. No timeline, no price,
 * no outcome, no acceptance.
 */
export const OUTCOMES = {
  acknowledged: {
    title: "Inquiry received",
    body: "Thanks for reaching out. Your inquiry is on record and we'll be in touch with next steps. Receiving an inquiry is not an accepted engagement, and it carries no timeline, price, or outcome.",
  },
  notDelivered: {
    title: "Your inquiry is on record; our alert did not go out",
    body: "The inquiry was stored, so nothing is lost and there is no need to send it again. The notification to us failed to send, so we may see it later than usual. If you would rather not wait, reply to this page's contact route directly.",
  },
  duplicate: {
    title: "This inquiry is already on record",
    body: "We already have an inquiry from this address, so we have not created a second one. Sending it again does not add a second request and does not put you further ahead — the original is still with us.",
  },
  boundary: {
    title: "Stopping at the authorization boundary",
    body: "You told us the authorization is not settled yet. That is a fine place to start a conversation, and it is where the process stops for now: we cannot look at a live system until authorization is documented and scope is confirmed separately, by whoever owns that system.",
  },
  invalid: {
    title: "Check the highlighted fields",
    body: "Your inquiry has not been sent. Correct the fields marked below and submit again — nothing you entered has been lost.",
  },
  rateLimited: {
    title: "Too many submissions from here",
    body: "Your inquiry has not been recorded. Wait a little and submit once more. If this keeps happening, use the contact route on the About page instead.",
  },
  unconfirmed: {
    title: "We couldn't submit the inquiry",
    body: "Nothing was recorded, so this is not on our end yet. Your answers are still in the form. Try again, and if it keeps failing use the contact route on the About page.",
    retry: "Try again",
  },
} as const;
