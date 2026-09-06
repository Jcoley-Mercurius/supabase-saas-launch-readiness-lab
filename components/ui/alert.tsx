import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

/*
 * Alert — contextual message or callout (MDS COMPONENTS-PROPOSAL "Feedback and
 * recovery components"; MDS-REF-003 "Alerts").
 *
 * Tones map to the approved semantic roles. An alert never converts a failure
 * or an unavailable result into an implied pass, and it always pairs its icon
 * and colour with a heading and explanatory text.
 */

export type AlertTone = "info" | "warning" | "vulnerable" | "remediated";

const TONES: Record<
  AlertTone,
  { icon: IconName; fg: string; surface: string }
> = {
  info: {
    icon: "info",
    fg: "text-info",
    surface: "border-info/35 bg-info/6",
  },
  warning: {
    icon: "alert-triangle",
    fg: "text-warning",
    surface: "border-warning/35 bg-warning/8",
  },
  vulnerable: {
    icon: "alert-circle",
    fg: "text-vulnerable",
    surface: "border-vulnerable/35 bg-vulnerable/6",
  },
  remediated: {
    icon: "check-circle",
    fg: "text-remediated",
    surface: "border-remediated/35 bg-remediated/6",
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  role,
  className = "",
}: {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  /** Use "alert"/"status" only for a genuinely dynamic message. */
  role?: "alert" | "status";
  className?: string;
}) {
  const spec = TONES[tone];

  return (
    <div
      role={role}
      className={`rounded-card flex items-start gap-3 border p-4 ${spec.surface} ${className}`.trim()}
    >
      <span className={`mt-0.5 shrink-0 ${spec.fg}`}>
        <Icon name={spec.icon} size={20} />
      </span>
      <div className="flex flex-col gap-1">
        <p className={`text-body-sm font-semibold ${spec.fg}`}>{title}</p>
        {children ? (
          <div className="text-body-sm text-subtle">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
