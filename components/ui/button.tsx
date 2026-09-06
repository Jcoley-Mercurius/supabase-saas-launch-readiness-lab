import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { Icon } from "@/components/ui/icon";

/*
 * Button — MDS COMPONENTS-PROPOSAL "Core controls".
 *
 * Variants: primary, secondary, quiet, destructive, inverse.
 * Sizes: sm, md, lg.
 * States: default, hover, focus, active, disabled, loading.
 *
 * `destructive` is reserved for a truly destructive or unsafe action and is
 * never used for ordinary vulnerability evidence (DESIGN-SYSTEM.md §8).
 *
 * Touch target: md and lg are at least 44px tall, satisfying the approved
 * 44 x 44 CSS-pixel minimum for primary controls (WCAG 2.2 AA 2.5.8). `sm` is
 * reserved for secondary, non-primary controls inside dense evidence regions.
 */

export type ButtonVariant =
  "primary" | "secondary" | "quiet" | "destructive" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control text-body-sm font-semibold whitespace-nowrap transition-colors duration-(--motion-default) disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-inverse border border-primary hover:bg-primary-hover hover:border-primary-hover active:bg-primary-hover",
  secondary:
    "bg-base text-strong border border-line hover:bg-muted active:bg-muted",
  quiet:
    "bg-transparent text-strong border border-transparent hover:bg-muted active:bg-muted",
  destructive:
    "bg-vulnerable text-inverse border border-vulnerable hover:brightness-95 active:brightness-90",
  inverse:
    "bg-transparent text-inverse border border-inverse/45 hover:bg-inverse/10 active:bg-inverse/15",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5",
  md: "min-h-11 px-5 py-2.5",
  lg: "min-h-12 px-6 py-3 text-body",
};

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders the approved trailing arrow used on forward navigation actions. */
  trailingArrow?: boolean;
  children: ReactNode;
  className?: string;
};

function classes({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

export type ButtonLinkProps = SharedProps & {
  href: string;
} & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "children"
  >;

/** Navigation action rendered as a link so it keeps link semantics. */
export function ButtonLink({
  href,
  variant,
  size,
  trailingArrow,
  children,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={classes({ variant, size, className })}
      {...props}
    >
      {children}
      {trailingArrow ? <Icon name="arrow-right" size={16} /> : null}
    </Link>
  );
}

export type ButtonProps = SharedProps & {
  /** Loading keeps the label in place and announces the change politely. */
  loading?: boolean;
  loadingLabel?: string;
  /**
   * Whether `loading` also sets the native disabled attribute. It does by
   * default, which is right for a submit control.
   *
   * Set it to false where losing focus would be worse than the extra guard:
   * disabling the element the buyer just activated makes the browser move
   * focus to the body, and the approved MDS interaction rule is that focus
   * moves only after deliberate navigation, submission, or recovery — not on
   * a status update. When false the control stays focusable and is marked
   * aria-disabled and aria-busy, so assistive technology still reports it as
   * unavailable; the caller must guard against re-entry.
   */
  disableWhileLoading?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  variant,
  size,
  trailingArrow,
  loading = false,
  loadingLabel = "Working",
  disableWhileLoading = true,
  children,
  className,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const blocked = disabled || (loading && disableWhileLoading);
  return (
    <button
      type={type}
      disabled={blocked || undefined}
      aria-disabled={!blocked && loading ? true : undefined}
      aria-busy={loading || undefined}
      className={classes({ variant, size, className })}
      {...props}
    >
      {loading ? (
        <>
          <Icon name="loader" size={16} className="animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          {children}
          {trailingArrow ? <Icon name="arrow-right" size={16} /> : null}
        </>
      )}
    </button>
  );
}
