import { Icon, type IconName } from "@/components/ui/icon";

/*
 * Evidence-state indicator — the single source of the approved evidence
 * vocabulary (DESIGN-SYSTEM.md §9, COMPONENTS-PROPOSAL "Evidence-state
 * system"). Every evidence state in the product renders through this
 * component so the labels can never drift.
 *
 * Each state always combines four carriers: icon/shape, exact text label,
 * explanation, and semantic colour (MDS-PRI-003, MDS-DONT-002). Meaning
 * survives with colour and animation removed.
 *
 * The labels below are canonical and must not be paraphrased. "Secure",
 * "certified", "compliant", "guaranteed", and an unqualified "passed" are
 * prohibited.
 */

export type EvidenceState =
  | "vulnerable"
  | "remediated"
  | "untested"
  | "not-applicable"
  | "running"
  | "unavailable"
  | "warning";

type StateSpec = {
  label: string;
  icon: IconName;
  /** Text/icon colour utility. */
  fg: string;
  /** Tinted surface used by the block variant. */
  surface: string;
};

const STATES: Record<EvidenceState, StateSpec> = {
  vulnerable: {
    label: "Vulnerable — test succeeded unexpectedly",
    icon: "alert-triangle",
    fg: "text-vulnerable",
    surface: "bg-vulnerable/6 border-vulnerable/35",
  },
  remediated: {
    label: "Remediated — documented test blocked",
    icon: "check-circle",
    fg: "text-remediated",
    surface: "bg-remediated/6 border-remediated/35",
  },
  untested: {
    label: "Untested",
    icon: "minus-circle",
    fg: "text-untested",
    surface: "bg-muted border-line",
  },
  "not-applicable": {
    label: "Not applicable",
    icon: "slash-circle",
    fg: "text-untested",
    surface: "bg-muted border-line",
  },
  running: {
    label: "Running documented test",
    icon: "loader",
    fg: "text-info",
    surface: "bg-info/6 border-info/35",
  },
  unavailable: {
    label: "Evidence unavailable",
    icon: "cloud-off",
    fg: "text-warning",
    surface: "bg-warning/8 border-warning/35",
  },
  warning: {
    label: "Review required",
    icon: "alert-circle",
    fg: "text-warning",
    surface: "bg-warning/8 border-warning/35",
  },
};

/** The canonical label for a state, for use in prose and announcements. */
export function evidenceStateLabel(state: EvidenceState): string {
  return STATES[state].label;
}

export function StatusIndicator({
  state,
  explanation,
  variant = "inline",
  className = "",
}: {
  state: EvidenceState;
  /**
   * Plain-language explanation. Required for every material state: a label
   * alone is not enough to make risk legible (MDS-PRI-002).
   */
  explanation: string;
  /** `block` renders the tinted, bordered treatment used inside evidence regions. */
  variant?: "inline" | "block";
  className?: string;
}) {
  const spec = STATES[state];
  const isBlock = variant === "block";

  return (
    <div
      className={`flex items-start gap-3 ${
        isBlock ? `rounded-small border p-4 ${spec.surface}` : ""
      } ${className}`.trim()}
    >
      <span className={`mt-0.5 shrink-0 ${spec.fg}`}>
        <Icon
          name={spec.icon}
          size={20}
          className={state === "running" ? "animate-spin" : undefined}
        />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className={`text-body-sm font-semibold ${spec.fg}`}>
          {spec.label}
        </span>
        <span className="text-body-sm text-subtle">{explanation}</span>
      </span>
    </div>
  );
}
