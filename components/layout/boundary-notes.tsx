import { Icon } from "@/components/ui/icon";
import { BOUNDARY_NOTES } from "@/lib/content/site";

/**
 * Service-boundary statements shown beside the headline claim
 * (MPS-REQ-001, MPS-REQ-014; MDS-REF-002/005/009).
 */
export function BoundaryNotes({ tone = "ink" }: { tone?: "ink" | "inverse" }) {
  return (
    <ul className="tablet:flex-row tablet:gap-8 flex flex-col gap-3">
      {BOUNDARY_NOTES.map((note) => (
        <li
          key={note.label}
          className={`text-body-sm flex items-start gap-2 ${
            tone === "inverse" ? "text-inverse/80" : "text-subtle"
          }`}
        >
          <span className="mt-0.5 shrink-0">
            <Icon name={note.icon} size={16} />
          </span>
          {note.label}
        </li>
      ))}
    </ul>
  );
}
