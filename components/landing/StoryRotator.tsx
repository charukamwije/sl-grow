"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/contexts/language-context";
import type { StringKey } from "@/lib/i18n/strings";

export type StoryBeat = {
  label: StringKey;
  text: StringKey;
  icon: string;
  tint: string;
  labelColor: string;
};

export const BEAT_MS = 5000;

// Reduced motion as a store, so the first render matches the server (false)
const reducedMotion = {
  subscribe(listener: () => void) {
    if (typeof window.matchMedia !== "function") return () => {};
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  },
  get() {
    return typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  },
};

export type StoryCycle = ReturnType<typeof useStoryCycle>;

/**
 * The hero's shared clock: which beat is showing, advancing every BEAT_MS
 * round and round. The text, the 3D scene and the background all read it,
 * so they always tell the same part of the story. It holds still while the
 * hero is hovered or focused (so a visitor can always stop it to read), and
 * entirely with reduced motion.
 */
export function useStoryCycle(count: number) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const reduce = useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => false);

  const running = !held && !reduce;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setActive((current) => (current + 1) % count), BEAT_MS);
    return () => clearInterval(timer);
  }, [running, count]);

  return { active, setActive, setHeld, running, reduce };
}

/**
 * The story text, one beat at a time. All beats share one grid cell, so the
 * box is as tall as the longest and nothing below it jumps. With reduced
 * motion every beat is shown together instead.
 */
export default function StoryRotator({
  beats,
  cycle,
}: {
  beats: StoryBeat[];
  cycle: StoryCycle;
}) {
  const { t } = useLanguage();
  const { active, reduce } = cycle;

  const beatBody = (beat: StoryBeat, emphasise: boolean) => (
    <div className="flex gap-4">
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm ${beat.tint}`}
      >
        {beat.icon}
      </span>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${beat.labelColor}`}>
          {t(beat.label)}
        </p>
        <p
          className={`mt-1 text-lg leading-relaxed sm:text-xl ${
            emphasise ? "font-semibold text-gray-900" : "text-gray-700"
          }`}
        >
          {t(beat.text)}
        </p>
      </div>
    </div>
  );

  if (reduce) {
    return (
      <ol className="max-w-xl space-y-5">
        {beats.map((beat, i) => (
          <li key={beat.text}>{beatBody(beat, i === beats.length - 1)}</li>
        ))}
      </ol>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="grid">
        {beats.map((beat, i) => (
          <div
            key={beat.text}
            aria-hidden={i !== active}
            className={`[grid-area:1/1] transition-all duration-700 ease-out ${
              i === active
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            }`}
          >
            {beatBody(beat, i === beats.length - 1)}
          </div>
        ))}
      </div>
    </div>
  );
}
