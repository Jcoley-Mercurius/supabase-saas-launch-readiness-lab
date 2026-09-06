import { Icon } from "@/components/ui/icon";
import { SYNTHETIC_CONTEXT, SYNTHETIC_CONTEXT_NOTE } from "@/lib/content/site";

/*
 * Synthetic SaaS context (MPS-REQ-002, MPS-ACC-002; MDS-REF-005).
 *
 * Identifies the tenants, roles, protected resources, and representative
 * payment events the documented tests operate on, and keeps the synthetic
 * boundary adjacent to that description. Nothing here is buyer data, and no
 * fixture is executed in S1.
 *
 * Rendered on the deep-ink hero, so it opts into the `.on-ink` focus treatment
 * through its parent section.
 */
export function SyntheticContextPanel() {
  return (
    <div className="border-inverse/15 bg-inverse/5 rounded-card border p-6">
      <h2 className="text-h4 text-inverse">Synthetic SaaS context</h2>
      <ul className="mt-5 flex flex-col gap-5">
        {SYNTHETIC_CONTEXT.map((item) => (
          <li key={item.title} className="flex items-start gap-4">
            <span className="text-accent mt-0.5 shrink-0">
              <Icon name={item.icon} size={20} />
            </span>
            <span className="flex flex-col">
              <span className="text-body-sm text-inverse font-semibold">
                {item.title}
              </span>
              <span className="text-body-sm text-inverse/70">{item.body}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="border-inverse/15 text-body-sm text-inverse/70 mt-6 border-t pt-5">
        {SYNTHETIC_CONTEXT_NOTE}
      </p>
    </div>
  );
}
