import { useId } from "react";
import type { CertTrack } from "@/lib/data/certifications";

// The app's leaf mark (see app/icon.svg), drawn here in white
const LEAF =
  "M47 14C29 14 17 23 17 37c0 4 1.4 7.6 3.6 10.4C24 39 31 31 40 26c-7.5 6.2-13.3 13.6-16 22.3 2.4 1.1 5 1.7 7.8 1.7C44 50 50 38 47 14Z";

// A scalloped rosette edge: points alternating between two radii
function rosette(cx: number, cy: number, outer: number, inner: number, points: number) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");
}

const EDGE = rosette(120, 116, 96, 88, 24);

type DigitalBadgeProps = {
  track: CertTrack;
  className?: string;
  /** A short sweep of light across the badge, now and then */
  shine?: boolean;
};

/**
 * An Aswedduma Certified digital badge. The words on the badge stay in
 * English, like a logo; the page around it carries the translations.
 */
export default function DigitalBadge({ track, className = "w-40", shine = true }: DigitalBadgeProps) {
  const id = useId();
  const [light, dark] = track.colors;

  return (
    <svg
      viewBox="0 0 240 290"
      className={`h-auto ${className}`}
      role="img"
      aria-label={`Aswedduma Certified ${track.badgeLabel.toLowerCase()} badge`}
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <path id={`${id}-arc`} d="M 62 116 A 58 58 0 0 1 178 116" />
        <clipPath id={`${id}-clip`}>
          <circle cx="120" cy="116" r="78" />
        </clipPath>
      </defs>

      {/* Ribbon tails */}
      <path d="M92 170 74 278l24-16 14 22 14-104Z" fill={dark} />
      <path d="M148 170l18 108-24-16-14 22-14-104Z" fill={dark} opacity="0.85" />

      {/* Rosette and face */}
      <polygon points={EDGE} fill={dark} stroke={dark} strokeWidth="6" strokeLinejoin="round" />
      <circle cx="120" cy="116" r="78" fill={`url(#${id}-face)`} />
      <circle cx="120" cy="116" r="70" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="2 4" />

      {/* Words round the top */}
      {/* Sized so the whole phrase fits on the arc (about 180 units long) */}
      <text fill="#fff" fontSize="11" fontWeight="800" letterSpacing="1.3" textAnchor="middle">
        <textPath href={`#${id}-arc`} startOffset="50%">
          ASWEDDUMA CERTIFIED
        </textPath>
      </text>

      {/* The leaf mark */}
      <g transform="translate(92 70) scale(0.88)">
        <path d={LEAF} fill="#fff" />
        <path d="M14 53h36" stroke="#fde68a" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Stars either side */}
      {[78, 162].map((x) => (
        <path
          key={x}
          d={`M${x} 108l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.8-4.9 2.8 1.1-5.3-4-3.7 5.4-.6Z`}
          fill="#fde68a"
        />
      ))}

      {/* The path's name on a banner */}
      <rect x="52" y="146" width="136" height="26" rx="6" fill="#fff" />
      <text
        x="120"
        y="164"
        fill={dark}
        fontSize="13"
        fontWeight="800"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        {track.badgeLabel}
      </text>

      {/* A sweep of light */}
      {shine && (
        <g clipPath={`url(#${id}-clip)`} className="motion-reduce:hidden">
          <rect x="-60" y="20" width="40" height="200" fill="#fff" opacity="0.35" className="badge-shine" />
        </g>
      )}
    </svg>
  );
}
