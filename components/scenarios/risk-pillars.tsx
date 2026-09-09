import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SCENARIOS } from "@/lib/content/scenarios";
import { RISK_PILLARS } from "@/lib/content/site";

/*
 * Risk pillar cards — the four-up pillar row MDS-REF-002 shows under "Four
 * risk pillars" and MDS-REF-008 shows again in the inquiry page's left column.
 *
 * Extracted from the landing route, which held the only copy, so the inquiry
 * route composes it rather than re-authoring the same four cards (REUSE ->
 * COMPOSE -> EXTEND -> CREATE).
 *
 * Two things the landing copy was missing against MDS-REF-002: each card
 * carries a trailing entry affordance, and each is an entry point rather than
 * a static tile. The destination is not invented - a pillar title and a
 * scenario's `pillar` are the same approved string, so the link resolves
 * through the scenario catalogue and cannot drift from it. A pillar with no
 * matching scenario renders as the static card it is today rather than a dead
 * link.
 *
 * The arrow is decorative; the link's accessible name is the visually hidden
 * text, so the four links are distinguishable out of context (WCAG 2.2 AA
 * 2.4.4) and status/action meaning never rests on the glyph alone.
 *
 * `columns` selects between the two approved arrangements of the same card:
 * "quad" is the full-width landing row of MDS-REF-002 (1-up mobile, 2-up
 * intermediate, 4-up wide, matching the scenario-card transformation), and
 * "pair" is the narrower column of MDS-REF-008, where the row sits beside the
 * form and pairs from tablet up. Neither introduces a new card treatment.
 */

const SCENARIO_BY_PILLAR = new Map(SCENARIOS.map((s) => [s.pillar, s.slug]));

export function RiskPillarCards({
  columns = "quad",
  className = "",
}: {
  columns?: "quad" | "pair";
  className?: string;
}) {
  const grid =
    columns === "quad"
      ? "tablet:grid-cols-2 wide:grid-cols-4"
      : "tablet:grid-cols-2";

  return (
    <ul className={`${grid} grid grid-cols-1 gap-6 ${className}`.trim()}>
      {RISK_PILLARS.map((pillar) => {
        const slug = SCENARIO_BY_PILLAR.get(pillar.title);

        return (
          <Card as="li" key={pillar.title} className="flex flex-col p-6">
            <span className="text-primary">
              <Icon name={pillar.icon} size={24} />
            </span>
            <h3 className="text-h4 text-strong mt-4">{pillar.title}</h3>
            <p className="text-body-sm text-subtle mt-2">{pillar.body}</p>

            {slug ? (
              <Link
                href={`/scenarios/${slug}`}
                className="text-primary hover:text-primary-hover mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-4"
              >
                <span className="sr-only">
                  Explore the {pillar.title} scenario
                </span>
                <Icon name="arrow-right" size={20} />
              </Link>
            ) : null}
          </Card>
        );
      })}
    </ul>
  );
}
