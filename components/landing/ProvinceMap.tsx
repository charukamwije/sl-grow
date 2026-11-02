"use client";

import { useState, type KeyboardEvent } from "react";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { useLanguage } from "@/contexts/language-context";
import { PROVINCES } from "@/lib/data/provinces";
import { MAP_VIEWBOX, PROVINCE_SHAPES } from "@/lib/data/sri-lanka-map";

/**
 * An interactive map of the nine provinces. Hover (or focus) previews a
 * province, a tap or Enter selects it, and the panel beside the map shows
 * the vegetables it is known for. The chips under the map do the same, as a
 * larger target on phones and a plain list for anyone not using the map.
 */
export default function ProvinceMap() {
  const { t, l } = useLanguage();
  const [selected, setSelected] = useState("central");
  const [hovered, setHovered] = useState<string | null>(null);

  const shownId = hovered ?? selected;
  const shown = PROVINCES.find((p) => p.id === shownId)!;
  const pin = PROVINCE_SHAPES[selected].label;

  const onKey = (id: string) => (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelected(id);
    }
  };

  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="relative mx-auto w-full max-w-[22rem]">
        {/* Soft sea glow behind the island */}
        <div
          aria-hidden="true"
          className="absolute inset-6 rounded-full bg-sky-200/40 blur-3xl"
        />
        <svg
          viewBox={MAP_VIEWBOX}
          role="group"
          aria-label={t("home.mapLabel")}
          className="relative h-auto w-full drop-shadow-xl"
          onMouseLeave={() => setHovered(null)}
        >
          {PROVINCES.map((province) => {
            const isSelected = province.id === selected;
            const isHovered = province.id === hovered;
            return (
              <path
                key={province.id}
                d={PROVINCE_SHAPES[province.id].d}
                role="button"
                tabIndex={0}
                aria-label={t("home.province", { name: l(province.name) })}
                aria-pressed={isSelected}
                onClick={() => setSelected(province.id)}
                onKeyDown={onKey(province.id)}
                onMouseEnter={() => setHovered(province.id)}
                onFocus={() => setHovered(province.id)}
                onBlur={() => setHovered(null)}
                className={`cursor-pointer stroke-white outline-none transition-[fill] duration-300 [stroke-linejoin:round] [stroke-width:2] ${
                  isSelected
                    ? "fill-emerald-600"
                    : isHovered
                      ? "fill-emerald-300"
                      : "fill-emerald-100 hover:fill-emerald-300"
                }`}
              />
            );
          })}
          {/* A pin on the selected province, dropping in each time it changes */}
          <g
            key={selected}
            transform={`translate(${pin[0]} ${pin[1]})`}
            className="pointer-events-none"
            aria-hidden="true"
          >
            <circle r="14" className="animate-ping fill-amber-400/60 motion-reduce:hidden" />
            <foreignObject x="-14" y="-30" width="28" height="30" className="overflow-visible">
              <MapPinIcon className="h-7 w-7 animate-pin-drop text-amber-500 drop-shadow" />
            </foreignObject>
          </g>
        </svg>
      </div>

      <div className="space-y-5">
        <article
          key={shown.id}
          aria-live="polite"
          className="animate-fade-up rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            {t("home.province", { name: l(shown.name) })}
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("home.mapDistricts")}
              </dt>
              <dd className="mt-1 text-gray-800">{l(shown.districts)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("home.mapClimate")}
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {shown.zones.map((zone) => (
                  <span
                    key={zone}
                    className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800"
                  >
                    {t(zone)}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("home.mapKnownFor")}
              </dt>
              <dd className="mt-2">
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {shown.crops.map((crop, i) => (
                    <li
                      key={crop.name.en}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="flex animate-fade-up items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 [animation-fill-mode:both]"
                    >
                      <span className="text-xl" aria-hidden="true">{crop.icon}</span>
                      {l(crop.name)}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </article>

        <div className="flex flex-wrap gap-2">
          {PROVINCES.map((province) => (
            <button
              key={province.id}
              type="button"
              onClick={() => setSelected(province.id)}
              aria-pressed={province.id === selected}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                province.id === selected
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {l(province.name)}
            </button>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-gray-500">
          {t("home.mapNote")} Map: geoBoundaries (CC BY 4.0).
        </p>
      </div>
    </div>
  );
}
