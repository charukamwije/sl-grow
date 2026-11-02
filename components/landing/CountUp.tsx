"use client";

import { useEffect, useRef } from "react";

type CountUpProps = {
  value: number;
  format: (value: number) => string;
  durationMs?: number;
};

/**
 * Renders the final number, then counts up to it from zero the first time it
 * scrolls into view. It writes the text directly rather than through state,
 * so the server render, tests and reduced-motion users all get the real
 * value straight away.
 */
export default function CountUp({ value, format, durationMs = 1400 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / durationMs, 1);
          // Ease out, so the count slows as it lands
          const eased = 1 - (1 - progress) ** 3;
          el.textContent = format(value * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, format, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  );
}
