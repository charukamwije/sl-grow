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
import { SessionProvider, type SessionUser } from "@/contexts/session-context";
import type { OwnApplication } from "@/lib/certifications-server";
import { CERT_TRACKS } from "@/lib/data/certifications";
import { DEVICE_LEARNING_KEY } from "@/lib/device-history";
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

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const auth = vi.hoisted(() => ({
  loadingProvider: null,
  isAuthLoading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/join" }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => auth }));

const member: SessionUser = {
  uid: "user-1",
  displayName: "Kamala Silva",
  email: "kamala@example.com",
  role: "member",
};

const fetchMock = vi.fn();

function renderJoin(ui: ReactNode = <JoinPage />, user: SessionUser | null = null) {
  return render(
    <SessionProvider user={user} accountsEnabled>
      <NotificationProvider>
        <LanguageProvider>{ui}</LanguageProvider>
      </NotificationProvider>
    </SessionProvider>
  );
}

function application(patch: Partial<OwnApplication> = {}): OwnApplication {
  return {
    id: "app-1",
    ref: "APP-7K3P9Q",
    track: "home-grower",
    createdAt: "2026-11-03T08:00:00.000Z",
    status: "applied",
    adminNote: "",
    certificateCode: null,
    expiresAt: null,
    ...patch,
  };
}

const home = CERT_TRACKS[0];

// Mark course modules as passed on this device (all of them by default)
function completeModules(trackId = "home-grower", count?: number) {
  const track = CERT_TRACKS.find((t) => t.id === trackId)!;
  localStorage.setItem(
    DEVICE_LEARNING_KEY,
    JSON.stringify(
      track.modules.slice(0, count).map((mod) => ({
        track: track.id,
        module: mod.id,
        passedAt: "2026-11-03T08:00:00.000Z",
      }))
    )
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, id: "app-1", ref: "APP-7K3P9Q" }),
  });
});

describe("the Join page", () => {
  it("offers the three certification paths", () => {
    renderJoin();

    for (const track of CERT_TRACKS) {
      expect(screen.getAllByText(track.name.en).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("heading", { name: "Learn. Apply. Get certified." })).toBeInTheDocument();
  });

  it("shows the course with its modules and a start button", () => {
    renderJoin();

    expect(screen.getByText("3 modules · 9 lessons · free")).toBeInTheDocument();
    for (const mod of home.modules) {
      expect(screen.getByText(mod.title.en)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /start the course/i })).toHaveAttribute(
      "href",
      "/join/home-grower/learn"
    );
  });

  it("picks up the course where the learner stopped", () => {
    completeModules("home-grower", 2);
    renderJoin();

    expect(screen.getByRole("link", { name: /continue the course/i })).toHaveAttribute(
      "href",
      "/join/home-grower/learn?module=3"
    );
  });

  it("marks a finished course as ready to apply", () => {
    completeModules();
    renderJoin(<JoinPage />, member);

    expect(screen.getByText("Course completed. You are ready to apply.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review the course/i })).toBeInTheDocument();
  });

  it("opens the path given in the link", () => {
    renderJoin(<JoinPage initialPath="plantation" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Aswedduma Certified Plantation" })
    ).toBeInTheDocument();
  });

  it("asks a guest to sign in to apply", async () => {
    renderJoin();

    expect(screen.getByText("Sign in to apply")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send application" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    expect(auth.signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it("lets a member apply without finishing the course first", async () => {
    renderJoin(<JoinPage />, member);

    // Details are required
    await userEvent.clear(screen.getByLabelText(/your name/i));
    await userEvent.click(screen.getByRole("button", { name: "Send application" }));
    expect(
      await screen.findByText("Please enter your name, phone number and district or town.")
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/your name/i), "Kamala");
    await userEvent.type(screen.getByLabelText(/phone number/i), "0771234567");
    await userEvent.type(screen.getByLabelText(/district or town/i), "Kandy");
    await userEvent.click(screen.getByRole("button", { name: "Send application" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/certifications", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      track: "home-grower",
      name: "Kamala",
      phone: "0771234567",
      location: "Kandy",
      notes: "",
    });

    // The reference the server made, with the next steps
    expect(await screen.findByText("Application sent")).toBeInTheDocument();
    expect(screen.getByText("APP-7K3P9Q")).toBeInTheDocument();
    expect(router.refresh).toHaveBeenCalled();
    // The badge preview carries the applicant's name
    expect(screen.getByText("Kamala")).toBeInTheDocument();
  });

  it("pre-fills the member's name", () => {
    renderJoin(<JoinPage />, member);

    expect(screen.getByLabelText(/your name/i)).toHaveValue("Kamala Silva");
  });

  it("shows an open application instead of a second form", () => {
    renderJoin(<JoinPage applications={[application({ status: "on_hold", adminNote: "Please send a photo of your garden." })]} />, member);

    expect(screen.getByText(/You already have an open application/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send application" })).not.toBeInTheDocument();
    expect(screen.getAllByText("On hold").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Please send a photo of your garden.").length).toBeGreaterThan(0);
  });

  it("says so when the server finds an open application", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ success: false, error: "open" }),
    });
    renderJoin(<JoinPage />, member);

    await userEvent.type(screen.getByLabelText(/phone number/i), "0771234567");
    await userEvent.type(screen.getByLabelText(/district or town/i), "Kandy");
    await userEvent.click(screen.getByRole("button", { name: "Send application" }));

    expect(
      await screen.findByText("You already have an open application for this path. Follow it below.")
    ).toBeInTheDocument();
  });

  it("lists the member's applications, linking a certificate", () => {
    renderJoin(
      <JoinPage
        applications={[
          application({
            status: "certified",
            certificateCode: "ASW-C-7K3P9Q",
            expiresAt: "2099-01-01T00:00:00.000Z",
          }),
        ]}
      />,
      member
    );

    expect(screen.getByRole("heading", { name: "Your applications" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View certificate/ })).toHaveAttribute(
      "href",
      "/verify/ASW-C-7K3P9Q"
    );
    expect(screen.getByText("Valid until 2099-01-01")).toBeInTheDocument();
  });

  it("switches to another path with its own course", async () => {
    renderJoin();

    await userEvent.click(screen.getAllByRole("button", { name: "Start this path" })[0]);

    expect(
      screen.getByRole("heading", { level: 2, name: "Aswedduma Certified Seeds" })
    ).toBeInTheDocument();
    expect(screen.getByText("Choose good parent plants")).toBeInTheDocument();
    expect(screen.getByText("Clean, dry and store")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start the course/i })).toHaveAttribute(
      "href",
      "/join/seeds/learn"
    );
  });

  it("says plainly that this is not a government certificate", () => {
    renderJoin();

    expect(screen.getByText(/not a government certificate/i)).toBeInTheDocument();
  });
});
