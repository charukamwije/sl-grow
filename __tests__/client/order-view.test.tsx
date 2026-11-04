/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrderView from "@/components/account/OrderView";
import { LanguageProvider } from "@/contexts/language-context";
import type { OwnOrder } from "@/lib/supabase/account";
import type { BankDetails } from "@/lib/shop-settings";
import "./setup";

vi.mock("@/app/account/orders/actions", () => ({ uploadReceipt: vi.fn() }));

const bank: BankDetails = {
  bankName: "Commercial Bank",
  branch: "Kandy",
  accountName: "Aswedduma",
  accountNumber: "1234567890",
  note: "Upload your slip within 2 days.",
};

const order: OwnOrder = {
  id: "order-1",
  ref: "ASW-7K3P9Q",
  createdAt: "2026-11-04T08:15:00.000Z",
  method: "delivery",
  payment: "cod",
  status: "received",
  paid: false,
  items: [{ code: "S-TOMATO", name: "Tomato seedling", qty: 2, price: 80, lineTotal: 160 }],
  total: 160,
  name: "Nimal",
  phone: "0771234567",
  address: "12 Galle Road",
  notes: "",
  receiptUploadedAt: null,
  statusUpdatedAt: null,
};

function renderOrder(patch: Partial<OwnOrder> = {}, bankDetails: BankDetails | null = bank, placed = false) {
  return render(
    <LanguageProvider>
      <OrderView order={{ ...order, ...patch }} bank={bankDetails} placed={placed} />
    </LanguageProvider>
  );
}

describe("the customer's order page", () => {
  it("thanks the customer right after placing it", () => {
    renderOrder({}, bank, true);

    expect(screen.getByText(/Thank you! Your order is placed/)).toBeInTheDocument();
  });

  it("shows the reference, the status steps reached and the payment", () => {
    renderOrder();

    expect(screen.getByRole("heading", { name: "ASW-7K3P9Q" })).toBeInTheDocument();
    const steps = screen.getAllByRole("listitem").filter((item) => /✓/.test(item.textContent ?? ""));
    expect(steps.map((step) => step.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining("Order placed"), expect.stringContaining("Received by the shop")])
    );
    expect(screen.getByText(/Cash on delivery · Delivery/)).toBeInTheDocument();
    expect(screen.queryByText("Pay by bank transfer")).not.toBeInTheDocument();
  });

  it("calls a pickup order ready for pickup rather than out for delivery", () => {
    renderOrder({ method: "pickup", status: "out_for_delivery" });

    expect(screen.getAllByText("Ready for pickup").length).toBeGreaterThan(0);
    expect(screen.queryByText("Out for delivery")).not.toBeInTheDocument();
  });

  it("shows the bank details and the slip upload for an open bank transfer", () => {
    renderOrder({ payment: "bank_transfer" });

    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("Use your order reference ASW-7K3P9Q as the payment note.")).toBeInTheDocument();
    expect(screen.getByText("Upload your slip within 2 days.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload slip" })).toBeInTheDocument();
  });

  it("says the shop will call when it has not set its bank details", () => {
    renderOrder({ payment: "bank_transfer" }, null);

    expect(screen.getByText(/give you its bank details when it calls/)).toBeInTheDocument();
  });

  it("confirms a slip already sent and offers to replace it", () => {
    renderOrder({ payment: "bank_transfer", receiptUploadedAt: "2026-11-04T09:00:00Z" });

    expect(screen.getByText(/Slip received/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload a different slip" })).toBeInTheDocument();
  });

  it("takes no slip and shows no bank details once paid", () => {
    renderOrder({ payment: "bank_transfer", paid: true });

    expect(screen.queryByText("1234567890")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /slip/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Paid").length).toBeGreaterThan(0);
  });

  it("explains a cancelled order instead of showing its steps", () => {
    renderOrder({ status: "cancelled" });

    expect(screen.getByText(/This order was cancelled/)).toBeInTheDocument();
    expect(screen.queryByText("Not paid yet")).not.toBeInTheDocument();
  });
});
