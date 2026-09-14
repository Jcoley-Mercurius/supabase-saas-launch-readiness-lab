import "server-only";
import { Resend } from "resend";
import { deploymentEnvironment } from "@/lib/deployment";
import type { DeliveryResult } from "@/lib/inquiry/types";
import {
  AUTHORIZATION_STATUSES,
  LAUNCH_TRIGGERS,
  REVIEW_AREAS,
  stopsAtAuthorizationBoundary,
  type InquiryInput,
} from "@/lib/inquiry/schema";

/*
 * The operator notification boundary.
 *
 * Trace: MTS INTEGRATION-MANIFEST (Resend, server-only, RESEND_API_KEY /
 *        RESEND_FROM_EMAIL / INQUIRY_NOTIFICATION_TO); MTS
 *        SECURITY-ARCHITECTURE ("exclude secrets from logs, analytics, URLs,
 *        screenshots, and evidence", "use preview-safe notification
 *        destinations and separate environment variables");
 *        MPS-REQ-011 (this notification is not an acknowledgement).
 *
 * Direction of travel: this sends an inquiry TO the operator. It never sends
 * anything to the buyer, so nothing here can constitute an acceptance, a
 * timeline, a price, or an outcome. The buyer's acknowledgement is rendered on
 * the page from the store result, not from an email.
 *
 * Failure is a first-class result, not an exception. A `sent: false` outcome
 * carries a coarse class and nothing else — no provider response, no status
 * code, no address, no message body — because that class is written to the
 * database and could otherwise become the place inquiry content leaks into
 * operational metadata.
 *
 * The transport is injectable so the failure, rejection, and unconfigured
 * paths can be tested without a network and without a key.
 *
 * PREVIEW AND PRODUCTION ARE NEVER CONFUSED IN THE INBOX.
 *
 * The SECURITY-ARCHITECTURE rule is separate variables and a preview-safe
 * destination, and the values themselves are per-environment configuration the
 * owner sets. Configuration alone is not enough to make the rule visible: a
 * misconfigured preview would deliver a message indistinguishable from a real
 * one, and the operator would answer a test submission as though a buyer had
 * sent it. So every non-production notification is LABELLED in its subject and
 * in its first line, by the deployment the server is actually running in
 * rather than by anything a caller passes. Production is labelled with nothing,
 * because the unmarked message is the real one.
 *
 * What labelling does NOT do, stated plainly: the preview deployment writes to
 * the same isolated inquiry project as production (there is only one), so a
 * preview submission is a real row under the same retention policy. That is
 * recorded as MTS-OBS-051, not solved here.
 */

export interface NotificationTransport {
  send(message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    replyTo: string;
  }): Promise<DeliveryResult>;
}

function label<T extends { value: string; label: string }>(
  options: ReadonlyArray<T>,
  value: string,
) {
  return options.find((item) => item.value === value)?.label ?? value;
}

/*
 * The notification body. Plain text on purpose: it is an internal operator
 * message, it must be readable in any client, and a text body cannot smuggle
 * remote content or tracking into the operator's inbox.
 */
export function buildNotification(input: InquiryInput, reference: string) {
  const boundary = stopsAtAuthorizationBoundary(input.authorizationStatus);

  const lines = [
    "A new authorized-review inquiry arrived through the Launch-Readiness Lab.",
    "",
    `Reference:      ${reference}`,
    `Name:           ${input.contactName}`,
    `Work email:     ${input.contactEmail}`,
    `Company:        ${input.organization || "(not given)"}`,
    `Role:           ${input.buyerRole}`,
    `Stack:          ${input.stackSummary}`,
    `Launch trigger: ${label(LAUNCH_TRIGGERS, input.launchTrigger)}`,
    `Areas:          ${input.reviewAreas.map((area) => label(REVIEW_AREAS, area)).join(", ")}`,
    `Authorization:  ${label(AUTHORIZATION_STATUSES, input.authorizationStatus)}`,
    "",
    "What they would like reviewed:",
    input.reviewRequest,
    "",
    boundary
      ? "AUTHORIZATION BOUNDARY: this request has not established who can authorize the work. Documented authorization and separately confirmed scope come first."
      : "The sender states they can authorize a review. Scope and authorization still need to be documented and confirmed separately.",
    "",
    "This is a received inquiry, not an accepted engagement. No timeline, price, or outcome has been communicated to the sender.",
  ];

  return {
    subject: `Launch-Readiness Lab inquiry — ${input.contactName}${input.organization ? ` (${input.organization})` : ""}`,
    text: lines.join("\n"),
  };
}

/*
 * The follow-up notification.
 *
 * Trace: MPS-RULE-006 ("a duplicate inquiry must not create a duplicate
 *        engagement or misrepresent demand"); owner decision 2026-09-08
 *        (MTS-OBS-038).
 *
 * A repeat submission still creates no second record. This exists so the
 * operator can SEE that someone followed up, and every line of it is written
 * so that it cannot be mistaken for a new inquiry: the subject says "repeat
 * submission", the body says which record it belongs to and when that record
 * was created, and it states outright that no second inquiry and no second
 * engagement exist.
 *
 * It deliberately does NOT repeat the buyer's original message. The operator
 * already has that in the first notification, and re-sending it is how one
 * inquiry starts to look like two in an inbox.
 */
export function buildFollowUpNotification(
  input: InquiryInput,
  submissionCount: number,
  originalSubmittedAt: string,
) {
  const lines = [
    `${input.contactName} has submitted the same inquiry again. This is a REPEAT, not a new inquiry.`,
    "",
    `Repeat number:  ${submissionCount}`,
    `From:           ${input.contactName} <${input.contactEmail}>`,
    `Original sent:  ${originalSubmittedAt}`,
    "",
    "No second record was created and no second engagement exists. The original inquiry is unchanged and still holds what they first wrote; only its activity timestamp and repeat count have moved.",
    "",
    "Nothing has been promised to them. They were shown the original acknowledgement and told plainly that sending it again does not put them further ahead.",
  ];

  return {
    subject: `Repeat submission #${submissionCount} — ${input.contactName} (not a new inquiry)`,
    text: lines.join("\n"),
  };
}

export const resendTransport: NotificationTransport = {
  async send(message) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { sent: false, failureClass: "unconfigured" };

    try {
      const { error } = await new Resend(apiKey).emails.send({
        from: message.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        replyTo: message.replyTo,
      });
      // `error` is not read beyond its presence. A provider error object can
      // echo the submitted message back, and that message is the inquiry.
      return error ? { sent: false, failureClass: "rejected" } : { sent: true };
    } catch {
      return { sent: false, failureClass: "transport" };
    }
  },
};

/** True when a notification could actually be sent from this environment. */
export function notificationConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
    process.env.RESEND_FROM_EMAIL &&
    process.env.INQUIRY_NOTIFICATION_TO,
  );
}

export async function notifyOperator(
  input: InquiryInput,
  reference: string,
  transport: NotificationTransport = resendTransport,
): Promise<DeliveryResult> {
  return send(
    buildNotification(input, reference),
    input.contactEmail,
    transport,
  );
}

export async function notifyOperatorOfFollowUp(
  input: InquiryInput,
  submissionCount: number,
  originalSubmittedAt: string,
  transport: NotificationTransport = resendTransport,
): Promise<DeliveryResult> {
  return send(
    buildFollowUpNotification(input, submissionCount, originalSubmittedAt),
    input.contactEmail,
    transport,
  );
}

/**
 * Marks a message that did not come from production.
 *
 * Exported so the labelling can be asserted directly rather than inferred from
 * a built subject line.
 */
export function labelForEnvironment(
  message: { subject: string; text: string },
  environment = deploymentEnvironment(),
): { subject: string; text: string } {
  if (environment === "production") return message;

  const banner = `[${environment}]`;
  return {
    subject: `${banner} ${message.subject}`,
    text: [
      `${banner} This notification came from the ${environment} deployment, not from the live site.`,
      "Treat it as a test submission unless you know otherwise. It was written to the same isolated inquiry store as a live inquiry and is subject to the same retention policy.",
      "",
      message.text,
    ].join("\n"),
  };
}

function send(
  message: { subject: string; text: string },
  replyTo: string,
  transport: NotificationTransport,
): Promise<DeliveryResult> {
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.INQUIRY_NOTIFICATION_TO;
  if (!from || !to) {
    return Promise.resolve({ sent: false, failureClass: "unconfigured" });
  }

  return transport.send({
    from,
    to,
    replyTo,
    ...labelForEnvironment(message),
  });
}
