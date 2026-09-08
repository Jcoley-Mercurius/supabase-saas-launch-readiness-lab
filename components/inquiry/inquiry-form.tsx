"use client";

import { useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Checkbox,
  CheckboxGroup,
  FIELD_ROW,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/field";
import { LimitationCallout } from "@/components/ui/limitation-callout";
import { FORM, OUTCOMES } from "@/lib/content/inquiry";
import {
  AUTHORIZATION_STATUSES,
  LAUNCH_TRIGGERS,
  REVIEW_AREAS,
  REVIEW_REQUEST_MAX,
  type InquiryFieldErrors,
  type InquiryInput,
} from "@/lib/inquiry/schema";
import type { InquiryOutcome } from "@/lib/inquiry/types";

/*
 * The inquiry form and every state it can be in.
 *
 * Trace: MPS-REQ-010 (the six things an inquiry contains), MPS-REQ-011
 *        (acknowledge only after a successful submission, promise nothing),
 *        MPS-REQ-012 (recoverable failure and duplicate), MPS-REQ-013/014,
 *        MPS-RULE-005/006, MPS-ACC-011/012/013;
 *        MDS COMPOSITION-PROPOSAL "Inquiry shell" required visual states:
 *        initial, partially completed, inline validation, submitting,
 *        submission failed and retryable, acknowledged without implied
 *        engagement acceptance, duplicate linked to the original
 *        acknowledgement, and live-system request stopped at the
 *        authorization boundary.
 *
 * The server decides every one of those states. This component renders what it
 * is told and cannot promote a failure into an acknowledgement: the
 * acknowledgement panel is reachable only from `state === "acknowledged"`,
 * which lib/inquiry/submit.ts returns only after a row exists.
 *
 * Recovery rule (MPS workflow "If contact submission fails... explain that no
 * request was confirmed, and offer a retry"): a failed or rate-limited
 * submission leaves every entered value in place, so a retry costs the buyer
 * nothing. An acknowledged or duplicate submission replaces the form, because
 * leaving a submit button under an acknowledgement invites the double
 * submission MPS-RULE-006 is about.
 */

const EMPTY = {
  contactName: "",
  contactEmail: "",
  organization: "",
  buyerRole: "",
  stackSummary: "",
  launchTrigger: "",
  reviewRequest: "",
  authorizationStatus: "",
};

type Values = typeof EMPTY;

export function InquiryForm() {
  const prefix = useId();
  const field = (name: string) => `${prefix}-${name}`;

  const [values, setValues] = useState<Values>(EMPTY);
  const [areas, setAreas] = useState<string[]>([]);
  const [acknowledgedBoundary, setAcknowledgedBoundary] = useState(false);
  const [errors, setErrors] = useState<InquiryFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<InquiryOutcome | null>(null);

  const outcomeRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (name: keyof Values) => (value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    // Clearing the message as the buyer types is the approved inline
    // validation behaviour: the correction is confirmed by the error going
    // away, not by a second failed submit.
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  function toggleArea(value: string, checked: boolean) {
    setAreas((current) =>
      checked ? [...current, value] : current.filter((item) => item !== value),
    );
    setErrors((current) => ({ ...current, reviewAreas: undefined }));
  }

  /*
   * Focus after a deliberate submission only (MDS interaction: "Focus moves
   * only after deliberate navigation, submission, or recovery — not after
   * ordinary status updates").
   *
   * A validation failure sends focus to the first field that needs fixing; any
   * other outcome sends it to the panel that explains what happened. Both are
   * the result of the buyer pressing submit, so neither is a surprise.
   */
  function focusOutcome(next: InquiryOutcome) {
    requestAnimationFrame(() => {
      if (next.state === "invalid") {
        const first = Object.keys(next.errors)[0];
        const control = first
          ? formRef.current?.querySelector<HTMLElement>(
              `#${CSS.escape(field(first))}`,
            )
          : null;
        (control ?? outcomeRef.current)?.focus();
        return;
      }
      outcomeRef.current?.focus();
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setOutcome(null);

    const payload: Record<string, unknown> = {
      ...values,
      reviewAreas: areas,
      authorizationAcknowledged: acknowledgedBoundary,
    } satisfies Record<keyof InquiryInput | string, unknown>;

    let next: InquiryOutcome;
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      next = (await response.json()) as InquiryOutcome;
    } catch {
      // A network failure is truthfully the same state as an unreachable
      // store: nothing was confirmed. It is never an acknowledgement.
      next = { state: "unconfirmed", reason: "store" };
    }

    setSubmitting(false);
    setErrors(next.state === "invalid" ? next.errors : {});
    setOutcome(next);
    focusOutcome(next);
  }

  const settled =
    outcome?.state === "acknowledged" || outcome?.state === "duplicate";

  return (
    <Card className="desktop:p-8 flex flex-col gap-6 p-6">
      {/*
       * One live region for the whole form. It announces the result politely
       * and keeps the full explanation visible on the page, which is the
       * approved behaviour for a status change.
       */}
      <div
        ref={outcomeRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="focus-visible:outline-focus empty:hidden"
      >
        {outcome ? (
          <Outcome outcome={outcome} onRetry={() => setOutcome(null)} />
        ) : null}
      </div>

      {settled ? null : (
        <>
          <div>
            <h2 className="text-h3 text-strong">{FORM.title}</h2>
            <p className="text-body-sm text-subtle mt-1">{FORM.description}</p>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            <div className={FIELD_ROW}>
              <TextField
                id={field("contactName")}
                rowAligned
                label="Name"
                required
                autoComplete="name"
                value={values.contactName}
                error={errors.contactName}
                onChange={(event) => set("contactName")(event.target.value)}
              />
              <TextField
                id={field("contactEmail")}
                rowAligned
                label="Work email"
                type="email"
                required
                autoComplete="email"
                value={values.contactEmail}
                error={errors.contactEmail}
                onChange={(event) => set("contactEmail")(event.target.value)}
              />
            </div>

            <TextField
              id={field("organization")}
              label="Company or project"
              autoComplete="organization"
              value={values.organization}
              error={errors.organization}
              onChange={(event) => set("organization")(event.target.value)}
            />

            <div className={FIELD_ROW}>
              <TextField
                id={field("buyerRole")}
                rowAligned
                label="Your role"
                required
                hint="For example: founder, engineering lead, contract developer."
                value={values.buyerRole}
                error={errors.buyerRole}
                onChange={(event) => set("buyerRole")(event.target.value)}
              />
              <SelectField
                id={field("launchTrigger")}
                rowAligned
                label="What's prompting this review"
                required
                options={LAUNCH_TRIGGERS}
                placeholderOption="Select one"
                value={values.launchTrigger}
                error={errors.launchTrigger}
                onChange={(event) => set("launchTrigger")(event.target.value)}
              />
            </div>

            <TextField
              id={field("stackSummary")}
              label="Your stack"
              required
              hint="For example: Next.js on Vercel, Supabase Postgres and Storage, Stripe webhooks."
              value={values.stackSummary}
              error={errors.stackSummary}
              onChange={(event) => set("stackSummary")(event.target.value)}
            />

            <CheckboxGroup
              id={field("reviewAreas")}
              legend="Areas of concern"
              required
              error={errors.reviewAreas}
            >
              {REVIEW_AREAS.map((area) => (
                <Checkbox
                  key={area.value}
                  id={field(`area-${area.value}`)}
                  label={area.label}
                  name="reviewAreas"
                  value={area.value}
                  checked={areas.includes(area.value)}
                  error={errors.reviewAreas}
                  describedById={
                    errors.reviewAreas
                      ? `${field("reviewAreas")}-error`
                      : undefined
                  }
                  onChange={(event) =>
                    toggleArea(area.value, event.target.checked)
                  }
                />
              ))}
            </CheckboxGroup>

            <TextAreaField
              id={field("reviewRequest")}
              label="What would you like reviewed?"
              required
              maxLength={REVIEW_REQUEST_MAX}
              value={values.reviewRequest}
              error={errors.reviewRequest}
              counter={`${values.reviewRequest.length} / ${REVIEW_REQUEST_MAX}`}
              onChange={(event) => set("reviewRequest")(event.target.value)}
            />

            <SelectField
              id={field("authorizationStatus")}
              label="Who can authorize a review of this system?"
              required
              options={AUTHORIZATION_STATUSES.map(({ value, label }) => ({
                value,
                label,
              }))}
              placeholderOption="Select one"
              value={values.authorizationStatus}
              error={errors.authorizationStatus}
              onChange={(event) =>
                set("authorizationStatus")(event.target.value)
              }
            />

            <div className="flex flex-col gap-1.5">
              <Checkbox
                id={field("authorizationAcknowledged")}
                label="I understand that work on a live system begins only after authorization and scope are documented and confirmed separately."
                checked={acknowledgedBoundary}
                error={errors.authorizationAcknowledged}
                describedById={
                  errors.authorizationAcknowledged
                    ? `${field("authorizationAcknowledged")}-error`
                    : undefined
                }
                onChange={(event) => {
                  setAcknowledgedBoundary(event.target.checked);
                  setErrors((current) => ({
                    ...current,
                    authorizationAcknowledged: undefined,
                  }));
                }}
              />
              {errors.authorizationAcknowledged ? (
                <p
                  id={`${field("authorizationAcknowledged")}-error`}
                  className="text-body-sm text-vulnerable"
                >
                  {errors.authorizationAcknowledged}
                </p>
              ) : null}
            </div>

            <LimitationCallout title={FORM.privacyNotice.title}>
              <p>{FORM.privacyNotice.body}</p>
            </LimitationCallout>

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              loadingLabel={FORM.submitting}
              className="w-full"
            >
              {FORM.submit}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

/*
 * The outcome panel. Every branch names what happened to the record, because
 * "did my inquiry arrive?" is the only question the buyer actually has, and
 * the four failure branches all answer it with "no, and nothing was lost".
 */
function Outcome({
  outcome,
  onRetry,
}: {
  outcome: InquiryOutcome;
  onRetry: () => void;
}) {
  switch (outcome.state) {
    case "acknowledged":
      return (
        <div className="flex flex-col gap-4">
          <Alert
            tone={outcome.delivered ? "remediated" : "warning"}
            title={
              outcome.delivered
                ? OUTCOMES.acknowledged.title
                : OUTCOMES.notDelivered.title
            }
          >
            <p>
              {outcome.delivered
                ? OUTCOMES.acknowledged.body
                : OUTCOMES.notDelivered.body}
            </p>
          </Alert>
          {outcome.authorizationBoundary ? <BoundaryNotice /> : null}
          <NextRoutes />
        </div>
      );

    case "duplicate":
      return (
        <div className="flex flex-col gap-4">
          <Alert tone="info" title={OUTCOMES.duplicate.title}>
            <p>{OUTCOMES.duplicate.body}</p>
            <p className="mt-2">
              The inquiry we already hold was received on{" "}
              <strong className="text-strong">
                {formatDate(outcome.submittedAt)}
              </strong>
              {outcome.submissionCount > 1
                ? `, and you have now sent it ${outcome.submissionCount} times.`
                : "."}{" "}
              We have not created a second request and this does not imply a
              second engagement.
            </p>
          </Alert>
          {outcome.authorizationBoundary ? <BoundaryNotice /> : null}
          <NextRoutes />
        </div>
      );

    case "rate_limited":
      return (
        <Alert tone="warning" title={OUTCOMES.rateLimited.title} role="alert">
          <p>{OUTCOMES.rateLimited.body}</p>
        </Alert>
      );

    case "unconfirmed":
      return (
        <Alert
          tone="vulnerable"
          title={OUTCOMES.unconfirmed.title}
          role="alert"
        >
          <p>{OUTCOMES.unconfirmed.body}</p>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {OUTCOMES.unconfirmed.retry}
            </Button>
          </div>
        </Alert>
      );

    case "invalid":
      return (
        <Alert tone="vulnerable" title={OUTCOMES.invalid.title} role="alert">
          <p>{OUTCOMES.invalid.body}</p>
        </Alert>
      );
  }
}

/** MPS-ACC-013 — the workflow stops here and says why. */
function BoundaryNotice() {
  return (
    <LimitationCallout title={OUTCOMES.boundary.title}>
      <p>{OUTCOMES.boundary.body}</p>
    </LimitationCallout>
  );
}

function NextRoutes() {
  return (
    <div className="flex flex-wrap gap-3">
      <ButtonLink href="/report" variant="secondary" trailingArrow>
        Read the sample report
      </ButtonLink>
      <ButtonLink href="/scenarios" variant="quiet">
        Browse the scenarios
      </ButtonLink>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "an earlier date"
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}
