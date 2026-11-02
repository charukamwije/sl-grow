"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Reveal the direct children one after another instead of as one block */
  stagger?: boolean;
  as?: "div" | "section" | "ul" | "dl" | "ol";
};

/**
 * Fades its content up into place the first time it scrolls into view. The
 * hidden state lives in CSS (globals.css, gated on the `js` class) and this
 * only sets `data-visible`, so nothing re-renders and content without
 * JavaScript, or with reduced motion, is simply shown.
 */
export default function Reveal({
  children,
  className = "",
  stagger,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      el.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.visible = "true";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // The union of tag types cannot be expressed for a shared ref
      ref={ref as never}
      className={`${stagger ? "reveal-stagger" : "reveal"} ${className}`}
    >
      {children}
    </Tag>
  );
}
