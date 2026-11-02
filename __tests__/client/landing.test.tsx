/**
 * @vitest-environment jsdom
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import LandingPage from "@/components/landing/LandingPage";
import { VEGETABLES } from "@/lib/data/vegetables";
import { computePlan, defaultInputs } from "@/lib/planner/calc";
import { formatLKR } from "@/lib/products";
import { renderWithLanguage as render } from "./render";
import "./setup";

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
