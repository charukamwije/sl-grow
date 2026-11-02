"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { PauseIcon, PlayIcon } from "@heroicons/react/20/solid";
import { useLanguage } from "@/contexts/language-context";
import type { StringKey } from "@/lib/i18n/strings";

export type StoryBeat = {
  label: StringKey;
  text: StringKey;
  icon: string;
  tint: string;
  labelColor: string;
};

export const BEAT_MS = 4500;

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

/**
 * The hero's story, one beat at a time, round and round. All beats share one
 * grid cell, so the box is as tall as the longest and nothing below it jumps.
 * It pauses while hovered or focused and has its own pause button (moving
 * content needs a way to stop it); with reduced motion every beat is shown
 * together instead.
 */
export default function StoryRotator({ beats }: { beats: StoryBeat[] }) {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false); // hovered or focused
  const reduce = useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => false);

  const running = !paused && !held && !reduce;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setActive((current) => (current + 1) % beats.length),
      BEAT_MS
    );
    return () => clearInterval(timer);
  }, [running, beats.length]);

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
    <div
      className="max-w-xl"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      {/* Progress: one bar per beat, the current one filling over its turn */}
      <div className="mb-4 flex items-center gap-2">
        {beats.map((beat, i) => (
          <button
            key={beat.text}
            type="button"
            onClick={() => setActive(i)}
            aria-label={t("home.storyShow", { label: t(beat.label) })}
            aria-current={i === active ? "step" : undefined}
            className="group relative h-6 flex-1"
          >
            <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-gray-200 transition group-hover:bg-gray-300">
              <span
                // Re-keyed on every turn so the fill restarts from empty
                key={i === active ? `on-${active}` : "off"}
                className={`block h-full rounded-full bg-emerald-600 ${
                  i < active ? "w-full" : i === active ? "story-fill" : "w-0"
                }`}
                style={
                  i === active
                    ? {
                        animationDuration: `${BEAT_MS}ms`,
                        animationPlayState: running ? "running" : "paused",
                      }
                    : undefined
                }
              />
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? t("home.storyPlay") : t("home.storyPause")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
        >
          {paused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
        </button>
      </div>

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
