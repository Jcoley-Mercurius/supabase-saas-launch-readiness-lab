import Link from "next/link";
import { ProductMark } from "@/components/brand/product-mark";
import { PRODUCT } from "@/lib/content/site";

/**
 * Product identity lockup: mark plus the two-line product name.
 *
 * MDS composition: "Left: compact product mark and Launch-Readiness Lab name."
 * The Josh/Mercurius endorsement is a separate, always-secondary element and is
 * never part of this lockup.
 */
export function ProductLockup({
  as = "link",
  tone = "ink",
}: {
  as?: "link" | "plain";
  tone?: "ink" | "inverse";
}) {
  const content = (
    <>
      <ProductMark
        size={32}
        className={tone === "inverse" ? "text-inverse" : "text-ink"}
      />
      <span className="flex flex-col leading-tight">
        <span
          className={`text-body-sm font-semibold ${
            tone === "inverse" ? "text-inverse" : "text-strong"
          }`}
        >
          {PRODUCT.shortName}
        </span>
        <span
          className={`text-body-sm ${
            tone === "inverse" ? "text-inverse/75" : "text-subtle"
          }`}
        >
          {PRODUCT.subName}
        </span>
      </span>
    </>
  );

  if (as === "plain") {
    return <span className="flex items-center gap-3">{content}</span>;
  }

  return (
    <Link href="/" className="rounded-control flex items-center gap-3 py-1">
      {content}
    </Link>
  );
}
