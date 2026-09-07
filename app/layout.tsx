import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PRODUCT } from "@/lib/content/site";

/*
 * Approved typography roles (MDS-DEC-008): Geist Sans for display and UI,
 * Geist Mono for evidence and code. next/font self-hosts both and reserves
 * metrics, so the approved scale loads without avoidable layout shift
 * (MDS implementation manifest, foundation step 2).
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: PRODUCT.name,
    template: `%s · ${PRODUCT.name}`,
  },
  description: PRODUCT.description,
  applicationName: PRODUCT.name,
  authors: [{ name: "Josh Coley" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-canvas text-strong flex min-h-full flex-col">
        {/*
         * Skip link — bypass block (WCAG 2.2 AA 2.4.1). It is visually hidden
         * until focused, then rendered as a normal control.
         */}
        <a
          href="#main-content"
          className="bg-base text-strong border-line rounded-control sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:inline-flex focus:min-h-11 focus:items-center focus:border focus:px-4 focus:py-2"
        >
          Skip to main content
        </a>

        <SiteHeader />
        {/*
         * min-w-0: a flex child defaults to min-width:auto, which lets a wide
         * descendant (an evidence code line, a matrix) widen the whole page
         * instead of scrolling inside its own container. The approved rule is
         * that those regions may scroll themselves; the page body may not.
         */}
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
