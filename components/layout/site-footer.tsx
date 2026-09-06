import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Endorsement } from "@/components/brand/endorsement";
import { ProductLockup } from "@/components/brand/product-lockup";

/*
 * Global footer — MDS layout.footer: "limitations, privacy/contact, and
 * Josh/Mercurius endorsement".
 *
 * The limitation link points at the service-boundary section rather than
 * restating a qualifying claim in low-contrast fine print, which the approved
 * Do/Don't table prohibits.
 */
export function SiteFooter() {
  return (
    <footer className="border-line bg-base border-t py-8">
      <Container>
        <div className="tablet:flex-row tablet:items-center tablet:justify-between flex flex-col gap-6">
          <ProductLockup as="plain" />
          <div className="tablet:flex-row tablet:items-center tablet:gap-8 flex flex-col gap-4">
            <nav aria-label="Footer" className="flex items-center gap-6">
              <Link
                href="/about#limitations"
                className="text-body-sm text-subtle hover:text-strong inline-flex min-h-11 items-center underline underline-offset-4"
              >
                Limitations
              </Link>
              <Link
                href="/inquiry"
                className="text-body-sm text-subtle hover:text-strong inline-flex min-h-11 items-center underline underline-offset-4"
              >
                Contact
              </Link>
            </nav>
            <Endorsement />
          </div>
        </div>
      </Container>
    </footer>
  );
}
