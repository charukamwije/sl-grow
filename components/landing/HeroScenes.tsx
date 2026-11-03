"use client";

import { useLanguage } from "@/contexts/language-context";
import { MAP_VIEWBOX, PROVINCE_SHAPES } from "@/lib/data/sri-lanka-map";
import GrowingPlant from "./GrowingPlant";

/**
 * The three pictures of the hero story, one per beat. Each fills a square
 * face of the scene cube and carries its own sky, so the cube turning is
 * also the light changing: warm island morning, dusty road, green garden.
 */

function Cloud({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <g className="cloud-drift" style={{ animationDelay: `${delay}s` }}>
      <g transform={`translate(${x} ${y})`}>
        <ellipse cx="0" cy="10" rx="34" ry="16" fill="#fff" />
        <circle cx="-14" cy="0" r="16" fill="#fff" />
        <circle cx="10" cy="-6" r="20" fill="#fff" />
        <circle cx="28" cy="6" r="12" fill="#fff" />
        {[-18, 0, 18].map((dx, i) => (
          <path
            key={dx}
            d={`M${dx} 34c-3 5-5 7-5 10a5 5 0 0 0 10 0c0-3-2-5-5-10Z`}
            fill="#38bdf8"
            className="plant-drip motion-reduce:hidden"
            style={{ animationDelay: `${delay + i * 0.5}s` }}
          />
        ))}
      </g>
    </g>
  );
}

export function IslandScene() {
  const { t } = useLanguage();

  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={t("home.scene1Alt")} className="h-full w-full">
      <defs>
        <linearGradient id="island-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.55" stopColor="#e0f2fe" />
          <stop offset="1" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#island-sky)" />

      {/* Sun */}
      <g className="plant-spin">
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1="330"
            y1="34"
            x2="330"
            y2="22"
            stroke="#f59e0b"
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${i * 30} 330 70)`}
          />
        ))}
      </g>
      <circle cx="330" cy="70" r="24" fill="#fbbf24" />

      {/* Gentle waves */}
      {[330, 352, 374].map((y, i) => (
        <path
          key={y}
          d={`M0 ${y}q25 -8 50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0`}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.5 - i * 0.12}
          strokeWidth="3"
        />
      ))}

      {/* The island itself, from the same province outlines as the map */}
      <svg x="128" y="60" width="150" height="266" viewBox={MAP_VIEWBOX}>
        {Object.entries(PROVINCE_SHAPES).map(([id, shape]) => (
          <path key={id} d={shape.d} fill="#22c55e" stroke="#16a34a" strokeWidth="3" />
        ))}
      </svg>

      {/* The two monsoons, from the south-west and the north-east */}
      <Cloud x={70} y={250} delay={0} />
      <Cloud x={300} y={150} delay={1.2} />
    </svg>
  );
}

export function RoadScene() {
  const { t } = useLanguage();

  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={t("home.scene2Alt")} className="h-full w-full">
      <defs>
        <linearGradient id="road-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#f8fafc" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#road-sky)" />

      {/* Soft clouds drifting over the fields */}
      {[
        [90, 80, 0],
        [270, 56, 2],
      ].map(([x, y, delay]) => (
        <g key={x} className="cloud-drift" style={{ animationDelay: `${delay}s` }}>
          <g transform={`translate(${x} ${y})`} fill="#fff">
            <ellipse cx="0" cy="8" rx="30" ry="13" />
            <circle cx="-12" cy="0" r="13" />
            <circle cx="9" cy="-5" r="16" />
          </g>
        </g>
      ))}

      {/* Seen side-on: far-off fields on the left, the road across, the shop
          on the right. The truck drives left to right, the way it faces. */}
      <path d="M0 210Q70 150 150 190T300 200Q350 195 400 215V300H0Z" fill="#bbf7d0" />
      <path d="M0 240Q90 205 180 228T400 238V300H0Z" fill="#86efac" />
      {/* Crop rows in the fields */}
      {[40, 70, 100, 130].map((x) => (
        <path key={x} d={`M${x} 262q8-14 16 0`} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
      ))}
      <text x="18" y="232" fontSize="26" aria-hidden="true">🌾</text>
      <text x="120" y="216" fontSize="22" aria-hidden="true">🌾</text>

      {/* The shop at the end of the road */}
      <g>
        <rect x="300" y="186" width="84" height="84" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M294 186h96l-8-22h-80Z" fill="#ef4444" />
        <path d="M302 186v8m12-8v8m12-8v8m12-8v8m12-8v8m12-8v8m12-8v8" stroke="#fff" strokeWidth="4" />
        <rect x="314" y="216" width="26" height="54" rx="2" fill="#7dd3fc" />
        <rect x="350" y="214" width="24" height="22" rx="2" fill="#7dd3fc" />
        <text x="342" y="180" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">SHOP</text>
      </g>

      {/* The road, with its centre line */}
      <rect x="0" y="270" width="400" height="56" fill="#475569" />
      <rect x="0" y="270" width="400" height="4" fill="#334155" />
      <path d="M0 298H400" stroke="#f8fafc" strokeWidth="3" strokeDasharray="18 16" />
      <rect x="0" y="326" width="400" height="74" fill="#86efac" />

      {/* Distance sign */}
      <g>
        <rect x="186" y="222" width="5" height="48" fill="#64748b" />
        <rect x="150" y="200" width="78" height="30" rx="6" fill="#15803d" />
        <text x="189" y="220" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">
          100+ km
        </text>
      </g>

      {/* The truck, loaded with vegetables, driving from the fields to the shop */}
      <g className="truck-drive" aria-hidden="true">
        <g transform="translate(96 226) scale(1.25)">
          <g className="truck-bounce">
            {/* Load */}
            <circle cx="18" cy="16" r="9" fill="#ef4444" />
            <circle cx="34" cy="12" r="11" fill="#22c55e" />
            <circle cx="52" cy="16" r="9" fill="#f97316" />
            <circle cx="68" cy="14" r="10" fill="#16a34a" />
            {/* Truck bed and cab, facing right */}
            <rect x="2" y="20" width="84" height="24" rx="3" fill="#15803d" />
            <path d="M88 20h22l14 14v10H88Z" fill="#f59e0b" />
            <path d="M93 24h14l9 9H93Z" fill="#e0f2fe" />
            <rect x="118" y="36" width="6" height="4" rx="1" fill="#fde68a" />
          </g>
          {/* Wheels */}
          {[22, 70, 108].map((x) => (
            <g key={x} transform={`translate(${x} 46)`}>
              <circle r="10" fill="#1f2937" />
              <g className="wheel-spin">
                <circle r="4" fill="#9ca3af" />
                <path d="M-6 0H6M0 -6V6" stroke="#9ca3af" strokeWidth="2" />
              </g>
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

export function GardenScene({ replay }: { replay: number }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-emerald-50 via-lime-50 to-emerald-100 p-6">
      {/* Re-keyed each time the story reaches it, so the plant grows again */}
      <GrowingPlant key={replay} />
    </div>
  );
}
