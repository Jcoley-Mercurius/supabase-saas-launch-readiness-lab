import type { ReactNode } from "react";

/*
 * Card — border-first separation, 14px radius, restrained shadow
 * (MDS COMPONENTS-PROPOSAL "Cards and surfaces"). Interactive cards get a
 * visible hover and focus-within treatment; static report sections must not
 * mimic clickability, so `interactive` is opt-in.
 */
export function Card({
  as: Tag = "div",
  interactive = false,
  tone = "base",
  className = "",
  children,
}: {
  as?: "div" | "li" | "article" | "section";
  interactive?: boolean;
  tone?: "base" | "muted";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={`rounded-card border-line shadow-card border ${
        tone === "muted" ? "bg-muted" : "bg-base"
      } ${
        interactive
          ? "hover:border-primary/45 focus-within:border-primary/45 transition-colors duration-(--motion-default)"
          : ""
      } ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
