/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GuideView from "@/components/guides/GuideView";
import GuidesIndex from "@/components/guides/GuidesIndex";
import { CartProvider } from "@/contexts/cart-context";
import { LanguageProvider, useLanguage } from "@/contexts/language-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { getGuide } from "@/lib/data/guides";
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

function SwitchTo({ lang }: { lang: "si" }) {
  const { setLang } = useLanguage();
  return (
    <button type="button" onClick={() => setLang(lang)}>
      switch
    </button>
  );
}

function renderGuide(id = "tomato", extra?: React.ReactNode) {
  return render(
    <NotificationProvider>
      <LanguageProvider>
        <CartProvider uid={null}>
          {extra}
          <GuideView id={id} />
        </CartProvider>
      </LanguageProvider>
    </NotificationProvider>
  );
}

const tomato = getGuide("tomato")!;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal("localStorage", new MemoryStorage());
});

describe("a grow guide, step by step", () => {
  it("shows one big step at a time and moves on with Next and Back", async () => {
    renderGuide();

    expect(screen.getByText("Step 1 of 9")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Prepare the container/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Step 2 of 9")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Harden off/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Step 1 of 9")).toBeInTheDocument();
  });

  it("splits a step into one idea per line, with product pictures", () => {
    renderGuide();

    // "Fill a [[k_gb15]] ... at the top. Place it where it gets ... sun."
    const lines = screen.getAllByRole("listitem").filter((li) => li.closest("[aria-live]"));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveTextContent("🛍️");
    expect(lines[0]).toHaveTextContent("Grow bag 15 L");
    expect(lines[1]).toHaveTextContent(/5 to 6 hours of sun/);
  });

  it("jumps to a step from its dot, and ends with a well done", async () => {
    renderGuide();

    await userEvent.click(screen.getByRole("button", { name: "Go to step 9" }));
    expect(screen.getByRole("heading", { name: /Harvest/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Well done! You know every step.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /start again/i }));
    expect(screen.getByText("Step 1 of 9")).toBeInTheDocument();
  });

  it("moves with the arrow keys", () => {
    renderGuide();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Step 2 of 9")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("Step 1 of 9")).toBeInTheDocument();
  });

  it("can show every step at once, each with its picture", async () => {
    renderGuide();

    await userEvent.click(screen.getByRole("radio", { name: "All steps" }));

    for (const step of tomato.steps) {
      expect(screen.getAllByRole("heading", { name: step.title.en }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText("Step 1 of 9")).not.toBeInTheDocument();
  });

  it("shows the key facts as picture tiles", () => {
    renderGuide();

    expect(screen.getByText("75 days")).toBeInTheDocument();
    expect(screen.getByText("6 kg")).toBeInTheDocument();
  });
});

describe("listening to a step", () => {
  it("offers no Listen button where the device cannot speak", () => {
    renderGuide();

    expect(screen.queryByRole("button", { name: /listen/i })).not.toBeInTheDocument();
  });

  function stubSpeech(voices: { lang: string }[]) {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { getVoices: () => voices, speak, cancel: vi.fn() });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        lang = "";
        rate = 1;
        voice: unknown = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(public text: string) {}
      }
    );
    return speak;
  }

  it("reads the step aloud in plain words", async () => {
    const speak = stubSpeech([{ lang: "en-GB" }]);
    renderGuide();

    await userEvent.click(screen.getByRole("button", { name: /listen/i }));

    const spoken = speak.mock.calls[0][0].text as string;
    expect(spoken).toMatch(/^Prepare the container\./);
    expect(spoken).toContain("Grow bag 15 L");
    expect(spoken).not.toContain("[[");
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  it("says so when the phone has no voice for the language", async () => {
    const speak = stubSpeech([{ lang: "en-GB" }]);
    renderGuide("tomato", <SwitchTo lang="si" />);

    await userEvent.click(screen.getByRole("button", { name: "switch" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "අහන්න" }));
    });

    expect(speak).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/මෙම දුරකථනයේ මෙම භාෂාවට හඬක් නැත/)
    ).toBeInTheDocument();
  });
});

describe("the list of guides", () => {
  it("shows big picture cards with the days to harvest", () => {
    render(
      <LanguageProvider>
        <GuidesIndex />
      </LanguageProvider>
    );

    const tomatoCard = screen.getByRole("link", { name: /Tomato/ });
    expect(tomatoCard).toHaveTextContent("75 days to harvest");
    expect(screen.getByRole("link", { name: /Package arrival/ })).toHaveTextContent("7 steps");
  });
});
