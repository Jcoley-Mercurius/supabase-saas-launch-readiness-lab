import { Icon } from "@/components/ui/icon";

/*
 * Scenario stepper (DESIGN-SYSTEM.md §11 — the sequence is exact and is not
 * paraphrased; COMPONENTS-PROPOSAL "Scenario stepper"; MDS-REF-006,
 * MDS-REF-009 panel 3).
 *
 *   Context -> Vulnerable proof -> Remediation -> Repeated test -> Limitation
 *
 * Current, complete, available, and blocked steps are each explicit, and each
 * is carried by text as well as by treatment (aria-current plus a visible
 * status word), so nothing depends on colour.
 */

export type StepStatus = "complete" | "current" | "available" | "blocked";

export const LAB_STEPS = [
  { title: "Context", body: "Understand scope and risk." },
  { title: "Vulnerable proof", body: "Reproduce the issue with evidence." },
  { title: "Remediation", body: "Apply and verify the fix." },
  { title: "Repeated test", body: "Confirm the issue is blocked." },
  {
    title: "Limitation",
    body: "Understand what this scenario does not cover.",
  },
] as const;

const STATUS_WORD: Record<StepStatus, string> = {
  complete: "Complete",
  current: "Current step",
  available: "Available",
  blocked: "Not started",
};

export function LabStepper({ statuses }: { statuses: StepStatus[] }) {
  return (
    <nav aria-label="Scenario steps">
      <ol className="tablet:grid-cols-3 wide:grid-cols-5 grid grid-cols-1 gap-x-4 gap-y-5">
        {LAB_STEPS.map((step, index) => {
          const status = statuses[index] ?? "blocked";
          const done = status === "complete";
          const current = status === "current";

          return (
            <li
              key={step.title}
              aria-current={current ? "step" : undefined}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-label rounded-pill flex size-8 shrink-0 items-center justify-center border ${
                    done
                      ? "bg-remediated border-remediated text-inverse"
                      : current
                        ? "bg-ink border-ink text-inverse"
                        : "border-line bg-base text-subtle"
                  }`}
                >
                  {done ? <Icon name="check" size={16} /> : index + 1}
                </span>
                <span
                  aria-hidden="true"
                  className={`wide:block hidden ${
                    index < LAB_STEPS.length - 1 ? "text-untested" : "invisible"
                  }`}
                >
                  <Icon name="arrow-right" size={16} />
                </span>
              </div>
              <p className="text-body-sm text-strong font-semibold">
                {step.title}
              </p>
              <p className="text-body-sm text-subtle">{step.body}</p>
              <p className="text-label text-subtle">{STATUS_WORD[status]}</p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
