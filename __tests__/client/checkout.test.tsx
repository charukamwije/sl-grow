/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartView from "@/components/cart/CartView";
import { CART_STORAGE_KEY, CartProvider } from "@/contexts/cart-context";
import { CatalogProvider } from "@/contexts/catalog-context";
import { LanguageProvider } from "@/contexts/language-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { SessionProvider, type SessionUser } from "@/contexts/session-context";
import { PRODUCTS } from "@/lib/data/products";
import "./setup";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const auth = vi.hoisted(() => ({
  loadingProvider: null,
  isAuthLoading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/cart" }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => auth }));

// Node's own experimental localStorage shadows jsdom's; use a plain one
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

const member: SessionUser = {
  uid: "user-1",
  displayName: "Nimal Perera",
  email: "nimal@example.com",
  role: "member",
};

const fetchMock = vi.fn();

function renderCart(user: SessionUser | null, accountsEnabled = true) {
  return render(
    <SessionProvider user={user} accountsEnabled={accountsEnabled}>
      <NotificationProvider>
        <LanguageProvider>
          <CatalogProvider products={PRODUCTS}>
            {/* No uid: these tests are about checkout, not the cloud cart sync */}
            <CartProvider uid={null}>
              <CartView />
            </CartProvider>
          </CatalogProvider>
        </LanguageProvider>
      </NotificationProvider>
    </SessionProvider>
  );
}

function orderBody() {
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ s_tomato: 2 }));
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, id: "order-1", ref: "ASW-7K3P9Q" }),
  });
});

describe("checkout for guests", () => {
  it("asks a guest to sign in instead of showing the form, keeping the cart", async () => {
    renderCart(null);

    expect(
      await screen.findByRole("heading", { name: "Sign in to place your order" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Place order" })).not.toBeInTheDocument();
    expect(screen.getByText("Tomato seedling (Thakkali)")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    expect(auth.signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it("explains that ordering is not set up when accounts are off", async () => {
    renderCart(null, false);

    expect(await screen.findByText(/Online ordering is not set up/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });
});

describe("checkout for members", () => {
  it("fills in the member's name and asks for a phone (AC-05)", async () => {
    renderCart(member);

    expect(await screen.findByLabelText(/your name/i)).toHaveValue("Nimal Perera");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Please enter your name and phone number.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks for an address for delivery (AC-06)", async () => {
    renderCart(member);

    await userEvent.type(await screen.findByLabelText(/phone number/i), "0771234567");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Please enter a delivery address.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("places a cash on delivery order, empties the cart and opens the order", async () => {
    renderCart(member);

    await userEvent.type(await screen.findByLabelText(/phone number/i), "0771234567");
    await userEvent.type(screen.getByLabelText(/delivery address/i), "12 Galle Road");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/orders", expect.objectContaining({ method: "POST" }));
    expect(orderBody()).toEqual({
      details: {
        name: "Nimal Perera",
        phone: "0771234567",
        method: "delivery",
        payment: "cod",
        address: "12 Galle Road",
        notes: "",
      },
      cart: { s_tomato: 2 },
    });
    expect(router.push).toHaveBeenCalledWith("/account/orders/order-1?placed=1");
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!)).toEqual({});
  });

  it("offers pay at pickup for a pickup order, and bank transfer", async () => {
    renderCart(member);

    await userEvent.click(await screen.findByRole("radio", { name: /Pickup/ }));
    expect(screen.getByRole("radio", { name: /Pay at pickup/ })).toBeChecked();

    await userEvent.click(screen.getByRole("radio", { name: /Bank transfer/ }));
    expect(screen.getByText(/see the shop's bank details/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/phone number/i), "0771234567");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(orderBody().details).toMatchObject({ method: "pickup", payment: "bank_transfer" });
  });

  it("keeps the form and the cart when the order fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ success: false }) });
    renderCart(member);

    await userEvent.click(await screen.findByRole("radio", { name: /Pickup/ }));
    await userEvent.type(screen.getByLabelText(/phone number/i), "0771234567");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(
      await screen.findByText("The order could not be placed. Please try again.")
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!)).toEqual({ s_tomato: 2 });
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
  });
});
