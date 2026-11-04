/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "@/components/layout/Header";
import { CartProvider } from "@/contexts/cart-context";
import { CatalogProvider } from "@/contexts/catalog-context";
import { LanguageProvider } from "@/contexts/language-context";
import { SessionProvider, type SessionUser } from "@/contexts/session-context";
import { PRODUCTS } from "@/lib/data/products";
import "./setup";

const auth = vi.hoisted(() => ({
  loadingProvider: null,
  isAuthLoading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => auth }));

// jsdom has no layout, which Headless UI's anchored menus measure
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", NoopObserver);

const member: SessionUser = {
  uid: "user-1",
  displayName: "Charuka Wijethunga",
  email: "charuka@example.com",
  role: "member",
};

function renderHeader(user: SessionUser | null, accountsEnabled = true) {
  return render(
    <SessionProvider user={user} accountsEnabled={accountsEnabled}>
      <LanguageProvider>
        <CatalogProvider products={PRODUCTS}>
          <CartProvider uid={null}>
            <Header />
          </CartProvider>
        </CatalogProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}

const profileButton = (name: string | RegExp) => screen.getByRole("button", { name });

beforeEach(() => {
  vi.clearAllMocks();
  auth.signOut.mockResolvedValue({ success: true });
});

describe("the app bar", () => {
  it("lists the site's sections, with the account only in the profile menu", () => {
    renderHeader(member);

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Planner",
      "Shop",
      "Grow guide",
      "Plantation",
      "Join",
    ]);
  });

  it("shows the signed-in user's first name on the profile menu", () => {
    renderHeader(member);

    expect(profileButton(/Charuka/)).toBeInTheDocument();
  });

  it("offers the account and sign-out, but no admin panel, to a member", async () => {
    renderHeader(member);

    await userEvent.click(profileButton(/Charuka/));
    const menu = await screen.findByRole("menu");

    expect(within(menu).getByText("charuka@example.com")).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Account" })).toHaveAttribute("href", "/account");
    expect(within(menu).queryByRole("menuitem", { name: "Admin panel" })).toBeNull();
    expect(within(menu).getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
  });

  it.each(["admin", "super_admin"] as const)("offers the admin panel to a %s", async (role) => {
    renderHeader({ ...member, role });

    await userEvent.click(profileButton(/Charuka/));

    expect(await screen.findByRole("menuitem", { name: "Admin panel" })).toHaveAttribute(
      "href",
      "/admin"
    );
  });

  it("signs out from the menu", async () => {
    renderHeader(member);

    await userEvent.click(profileButton(/Charuka/));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("offers sign-in and the guest's Account page when signed out", async () => {
    renderHeader(null);

    await userEvent.click(profileButton("Sign in"));
    const menu = await screen.findByRole("menu");

    expect(within(menu).getByRole("menuitem", { name: "Sign in" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Account" })).toBeInTheDocument();
    expect(within(menu).queryByRole("menuitem", { name: "Sign out" })).toBeNull();
  });

  it("offers only the Account page when accounts are not set up", async () => {
    renderHeader(null, false);

    await userEvent.click(profileButton("Account"));
    const menu = await screen.findByRole("menu");

    expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Account",
    ]);
  });
});

describe("the app bar menu on phones", () => {
  it("ends with the account, the admin panel for admins, and sign-out", async () => {
    renderHeader({ ...member, role: "admin" });

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    const menu = document.getElementById("mobile-menu")!;

    expect(within(menu).getAllByRole("link", { name: "Account" })).toHaveLength(1);
    expect(within(menu).getByRole("link", { name: "Admin panel" })).toHaveAttribute("href", "/admin");

    await userEvent.click(within(menu).getByRole("button", { name: "Sign out" }));
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(document.getElementById("mobile-menu")).toBeNull();
  });

  it("hides the admin panel from members", async () => {
    renderHeader(member);

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));

    expect(
      within(document.getElementById("mobile-menu")!).queryByRole("link", { name: "Admin panel" })
    ).toBeNull();
  });
});
