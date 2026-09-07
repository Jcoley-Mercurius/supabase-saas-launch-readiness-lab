import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { SCENARIOS } from "@/lib/content/scenarios";

/*
 * Scenario navigation (MDS COMPOSITION-PROPOSAL "Guided lab shell";
 * DESIGN-SYSTEM.md §12; MDS-REF-006 left rail, MDS-REF-009 panel 3 selector).
 *
 * Wide and desktop render the 240-264px rail. Below 960px the rail becomes an
 * in-flow selector, as the approved responsive contract requires.
 *
 * The selector is a native <details> disclosure rather than a scripted menu:
 * it is keyboard-operable, works with no JavaScript, and cannot trap focus.
 * Only one of the two forms is in the accessibility tree at a time, because
 * the other is display:none.
 */

function ScenarioLink({
  slug,
  pillar,
  summary,
  current,
}: {
  slug: string;
  pillar: string;
  summary: string;
  current: boolean;
}) {
  return (
    <Link
      href={`/scenarios/${slug}`}
      aria-current={current ? "page" : undefined}
      className={`rounded-card flex min-h-11 items-start gap-3 border p-3 transition-colors duration-(--motion-default) ${
        current
          ? "border-primary/45 bg-remediated/6"
          : "border-line bg-base hover:border-primary/45"
      }`}
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-body-sm text-strong font-semibold">{pillar}</span>
        <span className="text-body-sm text-subtle">{summary}</span>
      </span>
      <span className="text-untested mt-0.5 shrink-0" aria-hidden="true">
        <Icon name="chevron-right" size={16} />
      </span>
    </Link>
  );
}

export function ScenarioRail({ currentSlug }: { currentSlug: string }) {
  return (
    <>
      {/* Desktop and wide: the persistent rail. */}
      <nav
        aria-label="Scenarios"
        className="desktop:flex sticky top-6 hidden flex-col gap-3 self-start"
      >
        <p className="text-label text-subtle uppercase">Scenarios</p>
        <p className="text-body-sm text-subtle">
          Synthetic scenarios. Reproducible evidence.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {SCENARIOS.map((scenario) => (
            <ScenarioLink
              key={scenario.slug}
              slug={scenario.slug}
              pillar={scenario.pillar}
              summary={scenario.summary}
              current={scenario.slug === currentSlug}
            />
          ))}
        </div>
      </nav>

      {/* Below desktop: the in-flow selector. */}
      <details className="desktop:hidden rounded-card border-line bg-base group border">
        <summary className="text-body-sm text-strong flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 font-semibold">
          <span className="flex flex-col">
            <span className="text-label text-subtle uppercase">Scenario</span>
            <span>
              {SCENARIOS.find((item) => item.slug === currentSlug)?.pillar ??
                "Select a scenario"}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="text-untested transition-transform duration-(--motion-default) group-open:rotate-90"
          >
            <Icon name="chevron-right" size={20} />
          </span>
        </summary>
        <nav aria-label="Scenarios" className="flex flex-col gap-2 p-3 pt-0">
          {SCENARIOS.map((scenario) => (
            <ScenarioLink
              key={scenario.slug}
              slug={scenario.slug}
              pillar={scenario.pillar}
              summary={scenario.summary}
              current={scenario.slug === currentSlug}
            />
          ))}
        </nav>
      </details>
    </>
  );
}
