import type { ReactNode } from "react";

/*
 * Badge — compact label (MDS components.badge). Pill radius is approved for
 * compact labels only. A badge never carries evidence state on its own; that
 * is what StatusIndicator is for.
 */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "primary";
  children: ReactNode;
}) {
  return (
    <span
      className={`text-label rounded-pill inline-flex items-center px-2.5 py-1 ${
        tone === "primary"
          ? "bg-remediated/10 text-remediated"
          : "bg-muted text-subtle"
      }`}
    >
      {children}
    </span>
  );
}
