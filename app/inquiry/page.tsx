import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Container, Section } from "@/components/layout/container";
import { InquiryExpectations } from "@/components/inquiry/inquiry-expectations";
import { InquiryForm } from "@/components/inquiry/inquiry-form";
import { RiskPillarCards } from "@/components/scenarios/risk-pillars";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BOUNDARY_NOTES } from "@/lib/content/site";
import { INQUIRY_PAGE } from "@/lib/content/inquiry";

/*
 * Authorized-review inquiry route.
 *
 * Trace: MPS-REQ-010 (role, stack, launch trigger, desired review, contact
 *        method, authorization status), MPS-REQ-011 (acknowledgement only
 *        after a successful submission, with no promise of response time,
 *        price, or outcome), MPS-REQ-012 (recoverable failure and duplicate
 *        states), MPS-REQ-013 (no upload or credential path exists at all),
 *        MPS-REQ-014, MPS-RULE-003/004/005/006, MPS-ACC-011/012/013;
 *        MDS COMPOSITION-PROPOSAL "Inquiry shell", MDS-REF-008.
 *
 * Composition, per the approved inquiry shell: two columns on desktop, with
 * expectations and the authorization boundary on the left and the concise form
 * on the right; one column below desktop with expectations BEFORE the fields.
 * The source order is the reading order, so the responsive change is a grid
 * change only and no assistive-technology order differs from the visual one.
 *
 * This route replaces the S1 build-state notice, which is the remaining half
 * of MTS-DEV-002.
 */

export const metadata: Metadata = {
  title: "Discuss an authorized review",
  description:
    "Start a conversation about an authorized Supabase launch-readiness review. No credentials, production data, or uploads are ever requested.",
};

export default function InquiryPage() {
  return (
    <Section tone="canvas">
      <Container>
        <Breadcrumb
          trail={[{ label: "Home", href: "/" }, { label: INQUIRY_PAGE.title }]}
        />

        <div className="mt-6 max-w-[62ch]">
          <p className="text-label text-subtle uppercase">
            {INQUIRY_PAGE.eyebrow}
          </p>
          <h1 className="text-h1 text-strong mt-3">{INQUIRY_PAGE.title}</h1>
          <p className="text-body-lg text-subtle mt-4">
            {INQUIRY_PAGE.description}
          </p>

          {/*
           * The service boundary travels with the claim rather than sitting in
           * a footer (MPS-REQ-001; MDS DO-DONT "limitations adjacent to the
           * qualifying claim").
           */}
          <ul className="tablet:flex-row tablet:gap-6 mt-6 flex flex-col gap-3">
            {BOUNDARY_NOTES.map((note) => (
              <li
                key={note.label}
                className="text-body-sm text-subtle flex items-center gap-2"
              >
                <Icon name={note.icon} size={20} />
                {note.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="desktop:grid-cols-2 desktop:gap-10 mt-10 grid grid-cols-1 items-start gap-8">
          {/*
           * Expectations, boundary, and the four review pillars occupy the
           * left column of MDS-REF-008; the concise form occupies the right.
           * Below desktop this collapses to one column with the expectations
           * still ahead of the fields, which is the approved order.
           */}
          <div className="flex flex-col gap-8">
            <InquiryExpectations />
            <div>
              <h2 className="text-h3 text-strong">
                {INQUIRY_PAGE.pillars.title}
              </h2>
              <p className="text-body text-subtle mt-2">
                {INQUIRY_PAGE.pillars.description}
              </p>
              <RiskPillarCards columns="pair" className="mt-6" />
            </div>
          </div>

          <InquiryForm />
        </div>

        {/*
         * The back path MDS-REF-008 carries at the foot of the page. The
         * report route stays reachable from here without completing the form
         * (MPS-ACC-010).
         */}
        <div className="tablet:flex-row mt-12 flex flex-col gap-4">
          <ButtonLink href="/" variant="secondary">
            Back to the Launch-Readiness Lab
          </ButtonLink>
          <ButtonLink href="/report" variant="quiet">
            View sample report
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
