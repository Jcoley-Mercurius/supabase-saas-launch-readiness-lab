import { Container } from "@/components/layout/container";
import { Icon } from "@/components/ui/icon";
import { REPORT_HEADER } from "@/lib/content/report";
import { BOUNDARY_NOTES, PRODUCT } from "@/lib/content/site";

/*
 * Report header band (MDS-REF-007 header; DESIGN-SYSTEM.md §13 — "Dark ink may
 * frame the hero; reading sections remain light-first").
 *
 * The ink surface frames the report's identity only. Everything below it is
 * light, which is the approved rule and also what keeps the report printable.
 *
 * The date is the transcript's recording time, not the time the page was
 * opened. A report dated "today" that replays a recording made earlier would
 * misdate its own evidence.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatRecordedDate(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : DATE_FORMAT.format(parsed);
}

export function ReportHeader({ recordedAt }: { recordedAt: string }) {
  return (
    <section className="bg-ink text-inverse on-ink print:bg-base print:text-strong py-10">
      <Container width="evidence">
        <div className="desktop:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] desktop:gap-12 grid grid-cols-1 items-start gap-8">
          <div>
            <p className="text-label text-inverse/70 print:text-subtle uppercase">
              {REPORT_HEADER.eyebrow}
            </p>
            <h1 className="text-h1 text-inverse print:text-strong mt-4">
              <span className="text-accent">{REPORT_HEADER.titleLead}</span>{" "}
              {REPORT_HEADER.titleEmphasis}
            </h1>
            <p className="text-body-lg text-inverse/85 print:text-subtle mt-4 max-w-[60ch]">
              {REPORT_HEADER.standfirst}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <ul className="flex flex-col gap-3">
              {BOUNDARY_NOTES.map((note) => (
                <li
                  key={note.label}
                  className="text-body-sm text-inverse print:text-subtle flex items-start gap-2"
                >
                  <span className="mt-0.5 shrink-0">
                    <Icon name={note.icon} size={16} />
                  </span>
                  {note.label}
                </li>
              ))}
            </ul>

            <dl className="border-inverse/20 print:border-line text-body-sm border-t pt-4">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-inverse/70 print:text-subtle">
                  {REPORT_HEADER.kicker}
                </dt>
                <dd className="text-inverse print:text-strong">
                  · evidence recorded {formatRecordedDate(recordedAt)}
                </dd>
              </div>
              <div className="mt-1">
                <dt className="sr-only">Product</dt>
                <dd className="text-inverse print:text-strong">
                  {PRODUCT.name}
                </dd>
              </div>
              <div className="mt-1">
                <dt className="sr-only">Prepared by</dt>
                <dd className="text-inverse/70 print:text-subtle">
                  {PRODUCT.endorsement}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}
