"use client";

import { useLanguage } from "@/contexts/language-context";
import { VEGETABLES } from "@/lib/data/vegetables";

// One leaf, base at the origin, pointing right
const LEAF = "M0 0C16-20 52-22 74 0C52 20 16 20 0 0Z";

// [x, y, angle, scale, delay in seconds]: alternating sides, smaller near the top
const LEAVES: [number, number, number, number, number][] = [
  [200, 292, -18, 1, 0.9],
  [199, 280, 198, 0.95, 1.1],
  [201, 246, -28, 0.9, 1.4],
  [200, 232, 208, 0.85, 1.6],
  [202, 196, -34, 0.75, 1.9],
  [201, 184, 214, 0.7, 2.1],
  [203, 152, -40, 0.55, 2.4],
  [202, 144, 220, 0.5, 2.5],
];

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` });

/**
 * A tomato plant growing in a grow bag: the stem draws up, leaves unfold in
 * pairs, a flower opens, a tomato forms and ripens, then the plant sways in
 * the sun. The day labels use the tomato's own days to harvest from the
 * planner data. Pure SVG and CSS (globals.css, "Growing plant").
 */
export default function GrowingPlant() {
  const { t } = useLanguage();
  const tomatoDays = VEGETABLES.find((veg) => veg.id === "tomato")?.daysToHarvest ?? 75;

  const stages = [
    { day: 1, label: t("home.stageSeedling"), at: 0.3, place: "left-0 top-[62%]" },
    { day: 30, label: t("home.stageGrowing"), at: 1.8, place: "right-0 top-[38%]" },
    { day: tomatoDays, label: t("home.stageHarvest"), at: 4.1, place: "left-2 top-[18%]" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md">
      <svg viewBox="0 0 400 440" role="img" aria-label={t("home.plantAlt")} className="h-auto w-full">
        <defs>
          <radialGradient id="plant-sky" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#ecfdf5" />
            <stop offset="1" stopColor="#ecfdf5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="plant-leaf" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#15803d" />
            <stop offset="1" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="plant-bag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#374151" />
            <stop offset="1" stopColor="#111827" />
          </linearGradient>
        </defs>

        {/* Soft glow and the sun */}
        <circle cx="200" cy="200" r="190" fill="url(#plant-sky)" />
        <g className="plant-pop-center" style={delay(0)}>
          <g className="plant-spin">
            {Array.from({ length: 12 }, (_, i) => (
              <line
                key={i}
                x1="322"
                y1="40"
                x2="322"
                y2="28"
                stroke="#fbbf24"
                strokeWidth="4"
                strokeLinecap="round"
                transform={`rotate(${i * 30} 322 80)`}
              />
            ))}
          </g>
          <circle cx="322" cy="80" r="26" fill="#fcd34d" />
        </g>

        {/* Ground shadow, grow bag and soil */}
        <ellipse cx="200" cy="426" rx="104" ry="9" fill="#000" opacity="0.08" />
        <path d="M116 330h168l-16 92H132Z" fill="url(#plant-bag)" />
        <path d="M128 352h144" stroke="#4b5563" strokeWidth="2" opacity="0.6" />
        <ellipse cx="200" cy="331" rx="84" ry="12" fill="#78350f" />
        <ellipse cx="200" cy="329" rx="76" ry="8" fill="#92400e" />

        {/* Everything that grows sways together once grown */}
        <g className="plant-sway">
          <path
            d="M200 328C196 290 206 250 200 210S198 150 203 112"
            pathLength={1}
            fill="none"
            stroke="#16a34a"
            strokeWidth="7"
            strokeLinecap="round"
            className="plant-draw"
            style={delay(0.4)}
          />

          {LEAVES.map(([x, y, angle, scale, at], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
              <g className="plant-pop" style={delay(at)}>
                <path d={LEAF} fill="url(#plant-leaf)" />
                <path d="M4 0H62" stroke="#14532d" strokeWidth="1.5" opacity="0.35" />
              </g>
            </g>
          ))}

          {/* A side branch carrying the tomato */}
          <path
            d="M201 214C214 218 228 222 236 232"
            pathLength={1}
            fill="none"
            stroke="#16a34a"
            strokeWidth="4"
            strokeLinecap="round"
            className="plant-draw"
            style={delay(2.6)}
          />
          <g className="plant-pop-top" style={delay(3.2)}>
            <circle cx="240" cy="252" r="20" fill="#ef4444" className="plant-ripen" style={delay(3.6)} />
            <circle cx="233" cy="245" r="5" fill="#fff" opacity="0.35" />
            <path d="M232 233l8 5 8-5-4 7h-8Z" fill="#15803d" />
          </g>

          {/* The flower at the tip */}
          <g className="plant-pop-center" style={delay(2.8)}>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse
                key={angle}
                cx="203"
                cy="100"
                rx="6"
                ry="11"
                fill="#facc15"
                transform={`rotate(${angle} 203 110)`}
              />
            ))}
            <circle cx="203" cy="110" r="5" fill="#f97316" />
          </g>
        </g>

        {/* Water drops falling onto the soil */}
        {[150, 250].map((x, i) => (
          <path
            key={x}
            d={`M${x} 250c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12Z`}
            fill="#38bdf8"
            className="plant-drip motion-reduce:hidden"
            style={{ animationDelay: `${0.6 + i * 0.8}s` }}
          />
        ))}
      </svg>

      {/* Day labels, appearing as the plant reaches each stage */}
      {stages.map((stage) => (
        <span
          key={stage.day}
          aria-hidden="true"
          className={`absolute ${stage.place} animate-fade-up rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-md ring-1 ring-black/5 backdrop-blur`}
          style={delay(stage.at)}
        >
          <span className="text-emerald-700">{t("home.dayN", { n: stage.day })}</span> · {stage.label}
        </span>
      ))}
    </div>
  );
}
