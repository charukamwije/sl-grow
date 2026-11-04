/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountView from "@/components/account/AccountView";
import CartView from "@/components/cart/CartView";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PlannerWizard from "@/components/planner/PlannerWizard";
import ShopView from "@/components/shop/ShopView";
import { GUIDES } from "@/lib/data/guides";
import { guideIdsByVeg } from "@/lib/guides";
import { CatalogProvider } from "@/contexts/catalog-context";
import { PRODUCTS } from "@/lib/data/products";
import { CART_STORAGE_KEY, CartProvider } from "@/contexts/cart-context";
import { LanguageProvider } from "@/contexts/language-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { SessionProvider } from "@/contexts/session-context";
import { DEVICE_ORDERS_KEY, DEVICE_PLANS_KEY } from "@/lib/device-history";
import "./setup";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
}));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    loadingProvider: null,
    isAuthLoading: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    deleteAccount: vi.fn(),
  }),
}));

// The real providers, as a guest with accounts switched off
function renderApp(ui: ReactNode) {
  return render(
    <SessionProvider user={null} accountsEnabled={false}>
      <NotificationProvider>
        <LanguageProvider>
          <CatalogProvider products={PRODUCTS}>
            <CartProvider uid={null}>{ui}</CartProvider>
          </CatalogProvider>
        </LanguageProvider>
      </NotificationProvider>
    </SessionProvider>
  );
}

function storedCart() {
  return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "{}");
}

// Node 26 defines its own experimental global `localStorage`, which shadows
// jsdom's and is undefined unless Node runs with --localstorage-file. A plain
// in-memory Storage stands in for the browser's.
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

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  window.scrollTo = vi.fn();
  vi.spyOn(window, "open").mockReturnValue(null);
  vi.stubGlobal("fetch", vi.fn());
});

describe("the planner wizard", () => {
  it("blocks Next while the space is 0 (AC-20)", async () => {
    renderApp(<PlannerWizard />);

    const space = screen.getByLabelText("Growing space (sq ft)");
    await userEvent.clear(space);
    await userEvent.type(space, "0");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(
      await screen.findByText("Please enter your growing space.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
  });

  it("blocks Next while no vegetable is ticked, and Back returns (AC-20, AC-21)", async () => {
    renderApp(<PlannerWizard />);

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(
      await screen.findByText("Please choose at least one vegetable.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
  });

  it("shows every result section and adds the plan to the cart (AC-01, AC-03)", async () => {
    renderApp(<PlannerWizard />);

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /calculate my plan/i }));

    for (const heading of [
      "What your household eats",
      "Your grow plan",
      "Shopping list",
      "Your savings",
      "Health benefits",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    await userEvent.click(
      screen.getByRole("button", { name: /add this plan to cart/i })
    );

    expect(storedCart()).toMatchObject({ s_tomato: 6, p_trellis: 1, f_compost: 1 });
    expect(router.push).toHaveBeenCalledWith("/cart");
  });

  it("saves a guest's plan on the device (AC-18)", async () => {
    renderApp(<PlannerWizard />);

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /calculate my plan/i }));
    await userEvent.click(screen.getByRole("button", { name: /save this plan/i }));

    expect(
      await screen.findByText("Plan saved on this device. Find it under Account.")
    ).toBeInTheDocument();
    const plans = JSON.parse(localStorage.getItem(DEVICE_PLANS_KEY)!);
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ people: 4, space: 60 });
    expect(plans[0].id).toMatch(/^PLAN-/);
    expect(fetch).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("the shop", () => {
  it("finds green chili products and hides the rest (AC-11)", async () => {
    renderApp(<ShopView guideIds={guideIdsByVeg(GUIDES)} />);

    await userEvent.type(screen.getByRole("searchbox"), "chili");

    expect(screen.getByText("Green chili seedling")).toBeInTheDocument();
    expect(screen.getByText("Green chili seeds")).toBeInTheDocument();
    expect(screen.queryByText("Tomato seedling (Thakkali)")).not.toBeInTheDocument();
  });

  it("says so when nothing matches (FR-S-05)", async () => {
    renderApp(<ShopView guideIds={guideIdsByVeg(GUIDES)} />);

    await userEvent.type(screen.getByRole("searchbox"), "zzzz");

    expect(screen.getByText("No products match your search.")).toBeInTheDocument();
  });

  it("adds to the cart and updates the count by the Cart tab (AC-10, FR-C-06)", async () => {
    renderApp(
      <>
        <Header />
        <ShopView guideIds={guideIdsByVeg(GUIDES)} />
      </>
    );

    const tomato = screen.getByText("Tomato seedling (Thakkali)").closest("li")!;
    await userEvent.click(within(tomato).getByRole("button", { name: "Add" }));

    expect(storedCart()).toEqual({ s_tomato: 1 });
    expect(screen.getByRole("link", { name: /cart/i })).toHaveTextContent("1");
  });
});

describe("the Account page for guests", () => {
  it("shows the guest panel and the orders and plans kept on this device", () => {
    localStorage.setItem(
      DEVICE_ORDERS_KEY,
      JSON.stringify([
        {
          ref: "ASW-7K3P9Q",
          createdAt: "2026-11-02T10:15:00.000Z",
          method: "delivery",
          items: [{ code: "S-TOMATO", name: "Tomato seedling (Thakkali)", qty: 2, lineTotal: 160 }],
          total: 160,
        },
      ])
    );
    localStorage.setItem(
      DEVICE_PLANS_KEY,
      JSON.stringify([
        { id: "PLAN-222222", createdAt: "2026-11-02T09:00:00.000Z", people: 4, space: 60, total: 15990 },
      ])
    );

    renderApp(<AccountView state={{ kind: "disabled" }} />);

    expect(
      screen.getByRole("heading", { name: "You're using Aswedduma as a guest" })
    ).toBeInTheDocument();
    expect(screen.getByText("ASW-7K3P9Q")).toBeInTheDocument();
    expect(screen.getByText(/2026-11-02 10:15 UTC/)).toBeInTheDocument();
    expect(screen.getByText(/4 people · 60 sq ft/)).toBeInTheDocument();
    // No sign-in offered while accounts are not set up
    expect(screen.queryByRole("button", { name: /sign in with google/i })).not.toBeInTheDocument();
  });

  it("invites a guest to start when there is nothing on the device yet", () => {
    renderApp(<AccountView state={{ kind: "disabled" }} />);

    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
    expect(screen.getByText("No saved plans yet.")).toBeInTheDocument();
  });
});

describe("the footer", () => {
  it("links to the shop's WhatsApp and shows the number to call", () => {
    renderApp(<Footer />);

    expect(screen.getByRole("link", { name: /chat on whatsapp/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/wa\.me\/94768683639\?text=/)
    );
    expect(screen.getByRole("link", { name: /\+94 76 868 3639/ })).toHaveAttribute(
      "href",
      "tel:+94768683639"
    );
  });
});

describe("the app bar menu on phones", () => {
  it("opens with every main tab and closes once one is chosen (NFR-02)", async () => {
    renderApp(<Header />);

    expect(document.getElementById("mobile-menu")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));

    const menu = document.getElementById("mobile-menu")!;
    for (const name of ["Planner", "Shop", "Grow guide", "Plantation", "Account"]) {
      expect(within(menu).getByRole("link", { name })).toBeInTheDocument();
    }

    await userEvent.click(within(menu).getByRole("link", { name: "Shop" }));
    expect(document.getElementById("mobile-menu")).toBeNull();
  });
});

describe("switching language (AC-08)", () => {
  it("translates the interface and product names", async () => {
    renderApp(
      <>
        <Header />
        <ShopView guideIds={guideIdsByVeg(GUIDES)} />
      </>
    );

    await userEvent.click(screen.getByRole("button", { name: "සිංහල" }));

    expect(screen.getByRole("heading", { name: "සාප්පුව" })).toBeInTheDocument();
    expect(screen.getByText("තක්කාලි පැළය")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("si");
  });
});

describe("the cart", () => {
  beforeEach(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ s_tomato: 2 }));
  });

  it("shows the empty-cart message and no checkout form (FR-C-04)", () => {
    localStorage.clear();
    renderApp(<CartView />);

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /place your order|sign in to place/i })
    ).not.toBeInTheDocument();
  });
});
