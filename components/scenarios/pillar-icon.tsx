import { Icon, type IconName } from "@/components/ui/icon";

/*
 * Pillar icon — a risk pillar's outline icon in its approved identity hue
 * (tokens `color.pillar.*`, DESIGN-SYSTEM §4, closing MDS-QA-R1-F004).
 *
 * Every surface that draws a pillar icon - the landing and inquiry pillar
 * rows, the scenario cards, the lab header, the about page - composes this,
 * so a pillar cannot render one hue in one place and another elsewhere.
 * The hue is keyed by the pillar title, the same approved string the
 * scenario catalogue and RISK_PILLARS share. An unknown title falls back to
 * brand primary rather than inventing a colour.
 *
 * Decorative only: the adjacent pillar title carries the meaning.
 */

const PILLAR_HUE: Record<string, string> = {
  "Webhook integrity": "text-pillar-webhook",
  "Reliability & recovery": "text-pillar-reliability",
};

export function PillarIcon({
  pillar,
  name,
  size,
  className = "",
}: {
  pillar: string;
  name: IconName;
  size: 16 | 20 | 24;
  className?: string;
}) {
  const hue = PILLAR_HUE[pillar] ?? "text-primary";

  return (
    <span className={`${hue} ${className}`.trim()}>
      <Icon name={name} size={size} />
    </span>
  );
}
