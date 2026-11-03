/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JoinPage from "@/components/join/JoinPage";
import { LanguageProvider } from "@/contexts/language-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { CERT_TRACKS } from "@/lib/data/certifications";
import { DEVICE_APPLICATIONS_KEY, DEVICE_LEARNING_KEY } from "@/lib/device-history";
import "./setup";

// Node 26's own experimental localStorage shadows jsdom's; use a plain one
class MemoryStorage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  clear() {
    this.items.clear();
  }
}

vi.stubGlobal("localStorage", new MemoryStorage());

function renderJoin(ui: ReactNode = <JoinPage />) {
  return render(
    <NotificationProvider>
      <LanguageProvider>{ui}</LanguageProvider>
    </NotificationProvider>
  );
}

const home = CERT_TRACKS[0];

async function answer(indexes: number[]) {
  for (const [qi, oi] of indexes.entries()) {
    await userEvent.click(screen.getByRole("radio", { name: home.quiz[qi].options[oi].en }));
  }
  await userEvent.click(screen.getByRole("button", { name: "Check my answers" }));
}

beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(window, "open").mockReturnValue(null);
});

describe("the Join page", () => {
  it("offers the three certification paths", () => {
    renderJoin();

    for (const track of CERT_TRACKS) {
      expect(screen.getAllByText(track.name.en).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("heading", { name: "Learn. Apply. Get certified." })).toBeInTheDocument();
  });

  it("keeps the application locked until the knowledge check is passed", async () => {
    renderJoin();

    expect(screen.getByText("Pass the knowledge check to unlock your application.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send application/i })).not.toBeInTheDocument();

    // One wrong answer: told the score, still locked
    const wrong = home.quiz.map((q, i) => (i === 0 ? (q.answer + 1) % 3 : q.answer));
    await answer(wrong);
    expect(screen.getByRole("alert")).toHaveTextContent("2 of 3 correct");
    expect(screen.queryByRole("button", { name: /send application/i })).not.toBeInTheDocument();

    // All right: passed, unlocked, and remembered on the device
    await userEvent.click(screen.getByRole("radio", { name: home.quiz[0].options[home.quiz[0].answer].en }));
    await userEvent.click(screen.getByRole("button", { name: "Check my answers" }));

    expect(screen.getByText("Well done! You passed the knowledge check.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send application/i })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(DEVICE_LEARNING_KEY)!)[0]).toMatchObject({
      track: "home-grower",
    });
  });

  it("remembers a passed check on the next visit", () => {
    localStorage.setItem(
      DEVICE_LEARNING_KEY,
      JSON.stringify([{ track: "home-grower", passedAt: "2026-11-03T08:00:00.000Z" }])
    );
    renderJoin();

    expect(screen.getByRole("button", { name: /send application/i })).toBeInTheDocument();
  });

  it("sends the application on WhatsApp with an APP- reference", async () => {
    localStorage.setItem(
      DEVICE_LEARNING_KEY,
      JSON.stringify([{ track: "home-grower", passedAt: "2026-11-03T08:00:00.000Z" }])
    );
    renderJoin();

    // Details are required
    await userEvent.click(screen.getByRole("button", { name: /send application/i }));
    expect(
      await screen.findByText("Please enter your name, phone number and district or town.")
    ).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/your name/i), "Kamala");
    await userEvent.type(screen.getByLabelText(/phone number/i), "0771234567");
    await userEvent.type(screen.getByLabelText(/district or town/i), "Kandy");
    await userEvent.click(screen.getByRole("button", { name: /send application/i }));

    const url = decodeURIComponent(vi.mocked(window.open).mock.calls[0][0] as string);
    expect(url).toContain("Certification application - Aswedduma");
    expect(url).toContain(`Path: ${home.name.en}`);
    expect(url).toContain("District or town: Kandy");
    const ref = url.match(/Reference: (APP-[A-Z0-9]{6})/)![1];

    // On screen in the confirmation, and again in the list of applications
    expect(screen.getAllByText(ref)).toHaveLength(2);
    // The badge preview carries the applicant's name
    expect(screen.getByText("Kamala")).toBeInTheDocument();
    // And the application is listed on this device
    expect(JSON.parse(localStorage.getItem(DEVICE_APPLICATIONS_KEY)!)[0]).toMatchObject({
      ref,
      track: "home-grower",
    });
    expect(screen.getByRole("heading", { name: "Your applications" })).toBeInTheDocument();
  });

  it("switches to another path with its own lessons and check", async () => {
    renderJoin();

    await userEvent.click(screen.getAllByRole("button", { name: "Start this path" })[0]);

    expect(
      screen.getByRole("heading", { level: 2, name: "Aswedduma Certified Seeds" })
    ).toBeInTheDocument();
    expect(screen.getByText("1. Choose the right parent plants")).toBeInTheDocument();
    expect(screen.getByText(/Where should seeds be stored/)).toBeInTheDocument();
  });

  it("says plainly that this is not a government certificate", () => {
    renderJoin();

    expect(screen.getByText(/not a government certificate/i)).toBeInTheDocument();
  });
});
