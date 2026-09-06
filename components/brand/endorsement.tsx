import { PRODUCT } from "@/lib/content/site";

/**
 * Secondary endorsement (MDS-DEC-006). It is always subordinate to the product
 * identity and never rendered at equal hierarchy.
 */
export function Endorsement({ tone = "ink" }: { tone?: "ink" | "inverse" }) {
  return (
    <span
      className={`text-body-sm ${tone === "inverse" ? "text-inverse/75" : "text-subtle"}`}
    >
      {PRODUCT.endorsement}
    </span>
  );
}
