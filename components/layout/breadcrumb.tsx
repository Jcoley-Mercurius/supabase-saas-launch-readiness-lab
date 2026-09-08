import { Fragment } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

/*
 * Breadcrumb — the back path DESIGN-SYSTEM.md §11 requires on a deep view
 * ("Deep views require a breadcrumb/back path"), shown in MDS-REF-006 above
 * the lab header and in MDS-REF-008 above the inquiry header.
 *
 * Extracted from the scenario route, which held the only copy, so the inquiry
 * route reuses it rather than growing a second one (REUSE -> COMPOSE ->
 * EXTEND -> CREATE). No visual decision changes in the move: the type roles,
 * separator icon, underline treatment, and the 44px touch target on each link
 * are the ones the scenario route already carried.
 *
 * The trail states the routes that exist. MDS-REF-008 draws a three-level
 * trail through an intermediate "Launch-Readiness Lab" level, but no such
 * route exists in R1 and the home route is the lab itself, so reproducing it
 * literally would name a destination the buyer cannot reach. References are
 * authoritative for what they clearly show - here, that a deep view carries a
 * trail back to its parent.
 */

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="text-body-sm text-subtle flex flex-wrap items-center gap-2">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;

          return (
            <Fragment key={crumb.label}>
              {index > 0 ? (
                <li
                  aria-hidden="true"
                  className="text-untested flex items-center"
                >
                  <Icon name="chevron-right" size={16} />
                </li>
              ) : null}

              <li
                className={last ? "text-strong" : undefined}
                {...(last ? { "aria-current": "page" as const } : {})}
              >
                {crumb.href && !last ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-strong inline-flex min-h-11 items-center underline underline-offset-4"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  crumb.label
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
