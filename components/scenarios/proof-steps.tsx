import { Icon } from "@/components/ui/icon";
import { PROOF_STEPS } from "@/lib/content/site";

/*
 * The approved five-step scenario sequence, presented as a static description
 * of the method (DESIGN-SYSTEM.md §11; MDS-REF-003 "Stepper").
 *
 *   Context -> Vulnerable proof -> Remediation -> Repeated test -> Limitation
 *
 * This is the read-only narrative form. The interactive stepper, with current /
 * complete / available / blocked step states, belongs to the guided lab
 * framework in S2 and is not implemented here.
 */
export function ProofSteps() {
  return (
    <ol className="tablet:grid-cols-2 wide:grid-cols-5 grid grid-cols-1 gap-6">
      {PROOF_STEPS.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-ink text-inverse text-label rounded-pill flex size-8 shrink-0 items-center justify-center">
              {index + 1}
            </span>
            {index < PROOF_STEPS.length - 1 ? (
              <span
                className="text-untested wide:block hidden"
                aria-hidden="true"
              >
                <Icon name="arrow-right" size={16} />
              </span>
            ) : null}
          </div>
          <p className="text-body text-strong font-semibold">{step.title}</p>
          <p className="text-body-sm text-subtle">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
