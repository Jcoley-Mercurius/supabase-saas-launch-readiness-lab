import { Icon } from "@/components/ui/icon";
import { StateGlyph, type StateGlyphShape } from "@/components/ui/state-glyph";

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
 * The glyph is the filled semantic badge the approved references render (see
 * state-glyph.tsx), except for `running`, which DESIGN-SYSTEM section 7 defines
 * as a loader plus text.
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
  /** Filled evidence badge, or `null` for the running spinner. */
  glyph: StateGlyphShape | null;
  /** Text/icon colour utility. */
  fg: string;
  /** Tinted surface used by the block variant. */
  surface: string;
};

const STATES: Record<EvidenceState, StateSpec> = {
  vulnerable: {
    label: "Vulnerable — test succeeded unexpectedly",
    glyph: "exclamation-circle",
    fg: "text-vulnerable",
    surface: "bg-vulnerable/6 border-vulnerable/35",
  },
  remediated: {
    label: "Remediated — documented test blocked",
    glyph: "check-circle",
    fg: "text-remediated",
    surface: "bg-remediated/6 border-remediated/35",
  },
  untested: {
    label: "Untested",
    glyph: "ring-circle",
    fg: "text-untested",
    // `canvas`, not `muted`: the untested token measures 4.42:1 on muted,
    // just under the AA 4.5:1 body threshold, and 4.63:1 on canvas.
    surface: "bg-canvas border-line",
  },
  "not-applicable": {
    label: "Not applicable",
    glyph: "minus-circle",
    fg: "text-untested",
    surface: "bg-canvas border-line",
  },
  running: {
    label: "Running documented test",
    glyph: null,
    fg: "text-info",
    surface: "bg-info/6 border-info/35",
  },
  unavailable: {
    label: "Evidence unavailable",
    glyph: "exclamation-triangle",
    fg: "text-warning",
    surface: "bg-warning/8 border-warning/35",
  },
  warning: {
    label: "Review required",
    glyph: "exclamation-triangle",
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
        {spec.glyph ? (
          <StateGlyph shape={spec.glyph} size={20} />
        ) : (
          <Icon name="loader" size={20} className="animate-spin" />
        )}
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
