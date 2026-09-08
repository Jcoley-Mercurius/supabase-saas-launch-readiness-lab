"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ProductLockup } from "@/components/brand/product-lockup";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PAGE_GUTTERS } from "@/components/layout/container";
import { PRIMARY_CTA, PRIMARY_NAV } from "@/lib/content/site";

/*
 * Global header — MDS COMPOSITION-PROPOSAL "Global navigation".
 *
 *   Left:  product mark and name
 *   Right: Scenarios, Sample report, Method, About the service
 *   Action: "Discuss an authorized review"
 *
 * Desktop (>= 960px) keeps the full navigation visible. Below desktop the
 * links collapse into an accessible disclosure menu. The report route and the
 * primary CTA are not hidden by viewport: they are the first two items in the
 * open menu, they appear in the page flow of every public route, and the
 * approved authorized-review band sits above the footer at every width
 * (MDS responsive.rules.visibility).
 *
 * The endorsement is not rendered here — it stays secondary, in the footer.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the menu on route change so a navigation never leaves it hanging
  // open. Adjusted during render rather than in an effect, which avoids a
  // cascading re-render (React "adjusting state when a prop changes").
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  // Escape closes the disclosure and returns focus to its trigger.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function isCurrent(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="border-line bg-base sticky top-0 z-50 border-b">
      <div
        className={`mx-auto flex w-full max-w-[1360px] items-center justify-between gap-6 py-3 ${PAGE_GUTTERS}`}
      >
        <ProductLockup />

        <nav
          data-print-hide="true"
          aria-label="Primary"
          className="desktop:flex hidden items-center gap-1"
        >
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={`rounded-control text-body-sm hover:bg-muted inline-flex min-h-11 items-center px-3 transition-colors duration-(--motion-default) ${
                isCurrent(item.href)
                  ? "text-strong decoration-primary font-semibold underline decoration-2 underline-offset-8"
                  : "text-subtle"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/*
           * Hidden on a wrapper rather than on the control itself: the button's
           * own `inline-flex` would otherwise win over a `hidden` utility in
           * the same cascade layer and leave the CTA visible below desktop.
           */}
          <div className="desktop:flex hidden" data-print-hide="true">
            <ButtonLink href={PRIMARY_CTA.href} trailingArrow>
              {PRIMARY_CTA.label}
            </ButtonLink>
          </div>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
            data-print-hide="true"
            className="border-line text-strong hover:bg-muted rounded-control desktop:hidden inline-flex min-h-11 min-w-11 items-center justify-center border"
          >
            <Icon name={open ? "close" : "menu"} size={20} />
            <span className="sr-only">
              {open ? "Close main menu" : "Open main menu"}
            </span>
          </button>
        </div>
      </div>

      {/*
       * The panel is removed from the tree when closed so its links never enter
       * the tab order while hidden.
       */}
      {open ? (
        <div
          id={menuId}
          className="border-line bg-base desktop:hidden border-t"
        >
          <nav
            aria-label="Primary"
            className={`flex flex-col gap-1 py-4 ${PAGE_GUTTERS}`}
          >
            <ButtonLink
              href={PRIMARY_CTA.href}
              className="mb-2 w-full"
              trailingArrow
            >
              {PRIMARY_CTA.label}
            </ButtonLink>
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={`rounded-control text-body flex min-h-11 items-center px-3 ${
                  isCurrent(item.href)
                    ? "bg-muted text-strong font-semibold"
                    : "text-subtle hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
