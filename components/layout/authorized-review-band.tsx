import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BOUNDARY_NOTES, PRIMARY_CTA } from "@/lib/content/site";

/*
 * Authorized-review band — the approved engagement CTA that closes every
 * public route (MDS-REF-002, MDS-REF-005 "READY TO REVIEW").
 *
 * Text here is full-strength inverse rather than a softened white: on the
 * brand-primary surface, 85% white measures 4.31:1 and 80% measures 4.00:1,
 * both below the AA 4.5:1 body-text threshold. Full inverse measures 5.32:1.
 *
 * The copy asks for a conversation and confirms scope. It promises no timeline,
 * price, finding, certification, or outcome (MPS-RULE-005, MPS-REQ-011), and
 * the service boundary travels with it so the limitation stays adjacent to the
 * claim (MPS-REQ-014).
 */
export function AuthorizedReviewBand() {
  return (
    <section className="bg-primary text-inverse on-ink print:bg-base print:border-line py-10 print:border-t">
      <Container>
        <div className="desktop:flex-row desktop:items-center desktop:justify-between flex flex-col gap-6">
          <div className="max-w-[52ch]">
            <p className="text-label text-inverse uppercase">Ready to review</p>
            <h2 className="text-h3 mt-2">Discuss an authorized review</h2>
            <p className="text-body-sm text-inverse mt-2">
              Share your goals and we&rsquo;ll confirm scope, answer questions,
              and outline next steps. Any work on a live system starts only
              after authorization and scope are documented and confirmed
              separately.
            </p>
          </div>

          <div className="desktop:items-end flex flex-col gap-4">
            <ButtonLink
              href={PRIMARY_CTA.href}
              variant="secondary"
              size="lg"
              trailingArrow
            >
              {PRIMARY_CTA.label}
            </ButtonLink>
            <ul className="tablet:flex-row tablet:gap-6 flex flex-col gap-2">
              {BOUNDARY_NOTES.map((note) => (
                <li
                  key={note.label}
                  className="text-body-sm text-inverse flex items-center gap-2"
                >
                  <Icon name={note.icon} size={16} />
                  {note.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
