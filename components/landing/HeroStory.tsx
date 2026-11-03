"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useLanguage } from "@/contexts/language-context";
import { eyebrow } from "../ui/styles";
import { GardenScene, IslandScene, RoadScene } from "./HeroScenes";
import StoryRotator, { useStoryCycle, type StoryBeat } from "./StoryRotator";

// The story: the gift, the problem, the answer
const STORY: StoryBeat[] = [
  { label: "home.story1Label", text: "home.story1", icon: "☀️", tint: "bg-amber-100", labelColor: "text-amber-700" },
  { label: "home.story2Label", text: "home.story2", icon: "🚚", tint: "bg-slate-200", labelColor: "text-slate-600" },
  { label: "home.story3Label", text: "home.story3", icon: "🌱", tint: "bg-emerald-100", labelColor: "text-emerald-700" },
];

// The hero's light for each beat: island morning, dusty road, green garden
const BACKDROPS = [
  "from-amber-100 via-sky-50",
  "from-slate-200 via-slate-50",
  "from-emerald-100 via-lime-50",
];

const MAX_TILT = 10; // degrees

/**
 * The landing hero. The story's three beats drive everything at once: the
 * words on the left, the 3D scene cube on the right (which turns to the
 * matching picture) and the colour of the light behind both. The cube also
 * leans towards the pointer.
 */
export default function HeroStory({ actions }: { actions: ReactNode }) {
  const { t } = useLanguage();
  const cycle = useStoryCycle(STORY.length);
  const tiltRef = useRef<HTMLDivElement>(null);
  // How many times the garden has come round, so its plant grows each time
  const [gardenVisits, setGardenVisits] = useState(0);
  const [lastActive, setLastActive] = useState(cycle.active);

  // With reduced motion the cube rests on the answer: the grown plant
  const shown = cycle.reduce ? STORY.length - 1 : cycle.active;

  // Count arrivals at the garden during render (React's documented way to
  // adjust state when a value changes, without an effect)
  if (shown !== lastActive) {
    setLastActive(shown);
    if (shown === STORY.length - 1) setGardenVisits((n) => n + 1);
  }

  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    if (cycle.reduce || !tiltRef.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    tiltRef.current.style.transform = `rotateX(${-y * MAX_TILT}deg) rotateY(${x * MAX_TILT}deg)`;
  };

  const untilt = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  };

  const scenes = [
    <IslandScene key="island" />,
    <RoadScene key="road" />,
    <GardenScene key="garden" replay={gardenVisits} />,
  ];

  return (
    <section
      className="relative isolate -mt-6 pb-12 pt-10 md:-mt-8 sm:pt-16"
      onMouseEnter={() => cycle.setHeld(true)}
      onMouseLeave={() => cycle.setHeld(false)}
      onFocus={() => cycle.setHeld(true)}
      onBlur={() => cycle.setHeld(false)}
    >
      {/* The light behind the hero, fading from one beat's mood to the next */}
      {BACKDROPS.map((backdrop, i) => (
        <div
          key={backdrop}
          aria-hidden="true"
          // Full-bleed: as wide as the screen, not just the content column
          className={`absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 bg-gradient-to-b ${backdrop} to-[var(--background)] transition-opacity duration-1000 ${
            i === shown ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="space-y-7">
          <p
            className={`${eyebrow} inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-black/5 backdrop-blur`}
          >
            🌴 {t("home.badge")}
          </p>
          <h1 className="animate-fade-up text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 [animation-delay:100ms] sm:text-5xl lg:text-6xl">
            {t("home.title")}
          </h1>
          <div className="animate-fade-up [animation-delay:200ms]">
            <StoryRotator beats={STORY} cycle={cycle} />
          </div>
          <div className="animate-fade-up [animation-delay:300ms]">{actions}</div>
        </div>

        {/* The scene cube */}
        <div className="animate-fade-up [animation-delay:200ms]">
          <div
            className="scene-cube relative mx-auto aspect-square w-full max-w-[26rem]"
            onPointerMove={tilt}
            onPointerLeave={untilt}
          >
            <div
              ref={tiltRef}
              className="relative h-full w-full transition-transform duration-300 ease-out [transform-style:preserve-3d]"
            >
              {scenes.map((scene, i) => {
                // 0: facing us; 1: next, waiting on the right; 2: just turned away left
                const offset = (i - shown + STORY.length) % STORY.length;
                const angle = offset === 0 ? 0 : offset === 1 ? 90 : -90;
                return (
                  <div
                    key={i}
                    aria-hidden={offset !== 0}
                    className="scene-face absolute inset-0 overflow-hidden rounded-[2rem] shadow-2xl shadow-emerald-900/20 ring-1 ring-black/5"
                    style={{
                      transform: `rotateY(${angle}deg)`,
                      // The face moving from "behind left" to "waiting right"
                      // jumps there unseen instead of swinging across the front
                      transition:
                        offset === 1 || cycle.reduce
                          ? "none"
                          : "transform 1s cubic-bezier(0.65, 0, 0.35, 1)",
                    }}
                  >
                    {scene}
                  </div>
                );
              })}
            </div>
          </div>
          {/* The cube's shadow on the ground */}
          <div
            aria-hidden="true"
            className="mx-auto mt-6 h-4 w-2/3 max-w-xs rounded-full bg-black/10 blur-md"
          />
        </div>
      </div>
    </section>
  );
}
