/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LandingPage from "@/components/landing/LandingPage";
import { BEAT_MS } from "@/components/landing/StoryRotator";
import { VEGETABLES } from "@/lib/data/vegetables";
import { STRINGS } from "@/lib/i18n/strings";
import { computePlan, defaultInputs } from "@/lib/planner/calc";
import { formatLKR } from "@/lib/products";
import { renderWithLanguage as render } from "./render";
import "./setup";

const STORY_TEXT = [
  STRINGS["home.story1"].en,
  STRINGS["home.story2"].en,
  STRINGS["home.story3"].en,
];

// The beat currently on show: all three are in the page, the rest hidden
function shownBeat() {
  return STORY_TEXT.find(
    (text) =>
      screen.getByText(text).closest("[aria-hidden]")?.getAttribute("aria-hidden") === "false"
  );
}

describe("the landing page", () => {
  it("links to the planner and the shop", () => {
    render(<LandingPage />);

    const planLinks = screen.getAllByRole("link", { name: /plan my garden/i });
    const shopLinks = screen.getAllByRole("link", { name: /shop seedlings/i });

    expect(planLinks.length).toBeGreaterThan(0);
    planLinks.forEach((link) => expect(link).toHaveAttribute("href", "/planner"));
    shopLinks.forEach((link) => expect(link).toHaveAttribute("href", "/shop"));
  });

  it("shows the Sri Lankan seasons and the headline numbers from the planner data", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Maha season" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Yala season" })).toBeInTheDocument();
    expect(screen.getByText(String(VEGETABLES.length))).toBeInTheDocument();
    // Kankun is the quickest crop in the data, at 30 days
    expect(screen.getByText(/first Kankun harvest/)).toBeInTheDocument();
  });

  it("tells the story one beat at a time, round and round", () => {
    vi.useFakeTimers();
    try {
      render(<LandingPage />);

      expect(shownBeat()).toBe(STORY_TEXT[0]);
      act(() => vi.advanceTimersByTime(BEAT_MS));
      expect(shownBeat()).toBe(STORY_TEXT[1]);
      act(() => vi.advanceTimersByTime(BEAT_MS));
      expect(shownBeat()).toBe(STORY_TEXT[2]);
      // And back to the start, forever
      act(() => vi.advanceTimersByTime(BEAT_MS));
      expect(shownBeat()).toBe(STORY_TEXT[0]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("has no story controls, and holds still while the hero is hovered", () => {
    vi.useFakeTimers();
    try {
      render(<LandingPage />);

      expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument();

      const hero = screen.getByRole("heading", { level: 1 }).closest("section")!;
      fireEvent.mouseEnter(hero);
      act(() => vi.advanceTimersByTime(BEAT_MS * 3));
      expect(shownBeat()).toBe(STORY_TEXT[0]);

      // Moving away lets the story carry on
      fireEvent.mouseLeave(hero);
      act(() => vi.advanceTimersByTime(BEAT_MS));
      expect(shownBeat()).toBe(STORY_TEXT[1]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("turns the scene cube to the picture for each beat", () => {
    vi.useFakeTimers();
    try {
      render(<LandingPage />);

      // Only the face for the current beat is exposed; the others are turned away
      const island = /Sri Lanka under the sun/i;
      const road = /truck carrying vegetables/i;
      const plant = /tomato plant growing in a grow bag/i;

      expect(screen.getByRole("img", { name: island })).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: road })).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(BEAT_MS));
      expect(screen.getByRole("img", { name: road })).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: island })).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(BEAT_MS));
      expect(screen.getByRole("img", { name: plant })).toBeInTheDocument();
      // The harvest label uses the tomato's days to harvest from the planner data
      expect(screen.getByText("Day 75")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("tells the grow-your-own story with the planner's own savings figure", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Our island advantage" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "From the shop" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "From your garden" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A break from the rat race" })).toBeInTheDocument();

    // The page text is whitespace-normalised before matching, but the expected
    // string is not, so its non-breaking space has to be normalised here too
    const monthly = formatLKR(computePlan(defaultInputs()).savings.monthly).replace(/\s/g, " ");
    expect(screen.getByText(monthly)).toBeInTheDocument();
  });

  it("shows a province's vegetables when it is chosen on the map", async () => {
    render(<LandingPage />);

    // Central is chosen to begin with
    expect(screen.getByRole("heading", { name: "Central Province" })).toBeInTheDocument();
    expect(screen.getByText("Carrot")).toBeInTheDocument();

    // Every province is a button on the map itself
    const northern = screen.getByRole("button", { name: "Northern Province" });
    await userEvent.click(northern);
    await userEvent.unhover(northern);

    expect(screen.getByRole("heading", { name: "Northern Province" })).toBeInTheDocument();
    expect(screen.getByText("Red onion")).toBeInTheDocument();
    expect(screen.getByText(/Jaffna/)).toBeInTheDocument();
  });

  it("lets the province chips and the keyboard choose a province too", async () => {
    render(<LandingPage />);

    await userEvent.click(screen.getByRole("button", { name: "Uva" }));
    expect(screen.getByRole("heading", { name: "Uva Province" })).toBeInTheDocument();

    const western = screen.getByRole("button", { name: "Western Province" });
    western.focus();
    await userEvent.keyboard("{Enter}");
    western.blur();
    expect(screen.getByRole("heading", { name: "Western Province" })).toBeInTheDocument();
    // Not one of the planner's vegetables, so it appears only in the panel
    expect(screen.getByText("Mukunuwenna")).toBeInTheDocument();
  });

  it("offers each chart as a table", async () => {
    render(<LandingPage />);

    const toggles = screen.getAllByText("Show as a table");
    expect(toggles).toHaveLength(2);

    await userEvent.click(toggles[0]);
    expect(
      screen.getAllByRole("table", { name: "Days from planting to first harvest" })
    ).toHaveLength(1);
  });
});
