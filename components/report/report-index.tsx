"use client";

import Link from "next/link";
import { sendMeasurement } from "@/lib/measurement/client";
import { REPORT_SECTIONS } from "@/lib/content/report";

/*
 * Report section index (MDS COMPOSITION-PROPOSAL "Audit report shell":
 * "Desktop uses a sticky section index beside the report. Below desktop, it
 * becomes an in-flow table of contents").
 *
 * One component serves both: the markup is a single ordered navigation list,
 * and only its positioning changes at the desktop threshold. Nothing is
 * hidden at any width, which the approved visibility rule requires.
 *
 * MEASUREMENT (MPS-MET-004 — proposal proof reuse; MTS-CAP-008, MTS-DEC-016).
 *
 * Following a section link is a deliberate act, which is why the event is
 * recorded here rather than by watching sections scroll past. It says which
 * parts of the published proof buyers go looking for, which is what MPS-MET-004
 * is for. It is not a reading count: someone who scrolls the report top to
 * bottom without using the index records nothing at all here, so these counts
 * are a floor on interest in a section and never a total.
 *
 * Adding the handler makes this a client component. Nothing else changes: the
 * markup, the anchors, and the print rule are the same, and the page around it
 * stays prerendered.
 *
 * It is omitted from print. Anchor links cannot be followed on paper, and the
 * approved rule is that the report stays readable without interactive
 * controls — the printed report keeps every section, in order, without a
 * navigation aid that cannot work there.
 */
export function ReportIndex() {
  return (
    <nav
      aria-label="Report sections"
      className="desktop:sticky desktop:top-6 print:hidden"
    >
      <p className="text-label text-subtle uppercase">Report</p>
      <ol className="border-line mt-3 flex flex-col border-l">
        {REPORT_SECTIONS.map((section) => (
          <li key={section.id}>
            <Link
              href={`#${section.id}`}
              onClick={() =>
                sendMeasurement({
                  event: "report_section_opened",
                  surface: "report",
                })
              }
              className="text-body-sm text-subtle hover:text-strong hover:border-primary -ml-px flex min-h-11 items-center border-l-2 border-transparent px-4 py-2 transition-colors duration-(--motion-default)"
            >
              {section.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
