import Link from "next/link";
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
