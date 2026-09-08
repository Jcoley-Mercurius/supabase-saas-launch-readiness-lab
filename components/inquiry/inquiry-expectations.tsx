import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LimitationCallout } from "@/components/ui/limitation-callout";
import {
  AUTHORIZATION_BOUNDARY,
  SCOPE_AND_PRIVACY,
  WHAT_HAPPENS_NEXT,
} from "@/lib/content/inquiry";

/*
 * The expectations column of the approved inquiry shell.
 *
 * Trace: MDS COMPOSITION-PROPOSAL "Inquiry shell" — "expectations and
 *        authorization boundary on the left; concise form on the right.
 *        Mobile becomes one column with expectations BEFORE fields";
 *        MDS-REF-008 ("What happens next", "Authorized scope and privacy");
 *        MPS-REQ-011 (no timeline, price, or outcome), MPS-REQ-013/014,
 *        MPS-RULE-003/005.
 *
 * The ordering is a product rule, not a layout preference. The buyer reads
 * what the service will and will not do, and who has to authorize it, before
 * reaching a single field — which is what MPS-REQ-014 means by communicating
 * the authorization requirement, and why the mobile stack keeps this first
 * rather than collapsing it below the form.
 */
export function InquiryExpectations() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-6 p-6">
        <h2 className="text-h3 text-strong">What happens next</h2>

        <ol className="flex flex-col gap-5">
          {WHAT_HAPPENS_NEXT.map((step, index) => (
            <li key={step.title} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="bg-ink text-inverse text-body-sm flex size-8 shrink-0 items-center justify-center rounded-full font-semibold"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-body text-strong font-semibold">
                  {step.title}
                </h3>
                <p className="text-body-sm text-subtle mt-1">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="border-line flex items-start gap-4 border-t pt-6">
          <span className="text-subtle mt-0.5 shrink-0">
            <Icon name="file-text" size={24} />
          </span>
          <div>
            <h3 className="text-h4 text-strong">{SCOPE_AND_PRIVACY.title}</h3>
            <p className="text-body-sm text-subtle mt-2">
              {SCOPE_AND_PRIVACY.body}
            </p>
          </div>
        </div>
      </Card>

      <LimitationCallout title={AUTHORIZATION_BOUNDARY.title}>
        <p>{AUTHORIZATION_BOUNDARY.body}</p>
      </LimitationCallout>
    </div>
  );
}
