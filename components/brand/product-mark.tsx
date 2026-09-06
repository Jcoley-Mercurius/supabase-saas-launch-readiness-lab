/*
 * Product mark — MDS-DEC-012: "boundary frame intersected by a verified check
 * path". The frame is the tested boundary; the check path crosses it to show a
 * verified result. Approved in MDS-REF-001/002/005/009.
 *
 * Deliberately not a shield, lock, bug, keyhole, or any other security cliche
 * (mds/specification/DO-DONT.md).
 */
export function ProductMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Boundary frame */}
      <rect
        x="2.6"
        y="2.6"
        width="26.8"
        height="26.8"
        rx="6"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      {/* Verified check path, crossing the boundary at the top right */}
      <path
        d="M9 16.4 14.2 21.6 27.4 6.6"
        stroke="var(--color-primary)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
