import { describe, expect, it } from "vitest";
import {
  acceptsReceipt,
  isOrderStatus,
  isPaymentMethod,
  ORDER_PROGRESS,
  statusLabel,
  validateCheckout,
  type CheckoutDetails,
} from "@/lib/order/checkout";
import { checkReceipt, MAX_RECEIPT_BYTES } from "@/lib/uploads";

const details: CheckoutDetails = {
  name: "Nimal Perera",
  phone: "0771234567",
  method: "delivery",
  payment: "cod",
  address: "12 Galle Road, Colombo 3",
  notes: "Call before coming",
};

const cart = { s_tomato: 2, f_compost: 1 };

describe("validateCheckout", () => {
  it("requires a name and phone (FR-O-01, AC-05)", () => {
    expect(validateCheckout({ ...details, name: "" }, cart)).toBe("nameAndPhone");
    expect(validateCheckout({ ...details, phone: "  " }, cart)).toBe("nameAndPhone");
  });

  it("requires a Sri Lankan mobile number", () => {
    expect(validateCheckout({ ...details, phone: "12345" }, cart)).toBe("phone");
    expect(validateCheckout({ ...details, phone: "0112345678" }, cart)).toBe("phone");
    expect(validateCheckout({ ...details, phone: "+94 77 123 4567" }, cart)).toBeNull();
  });

  it("requires an address for delivery only (FR-O-02, AC-06)", () => {
    expect(validateCheckout({ ...details, address: "" }, cart)).toBe("address");
    expect(validateCheckout({ ...details, method: "pickup", address: "" }, cart)).toBeNull();
  });

  it("refuses an empty cart", () => {
    expect(validateCheckout(details, {})).toBe("emptyCart");
  });

  it("accepts a complete order, paid either way", () => {
    expect(validateCheckout(details, cart)).toBeNull();
    expect(validateCheckout({ ...details, payment: "bank_transfer" }, cart)).toBeNull();
  });
});

describe("order statuses and payment methods", () => {
  it("knows the five statuses and two ways to pay", () => {
    for (const status of ["created", "received", "out_for_delivery", "completed", "cancelled"]) {
      expect(isOrderStatus(status)).toBe(true);
    }
    expect(isOrderStatus("shipped")).toBe(false);
    expect(isPaymentMethod("cod")).toBe(true);
    expect(isPaymentMethod("bank_transfer")).toBe(true);
    expect(isPaymentMethod("card")).toBe(false);
  });

  it("calls a pickup order ready for pickup where a delivery is out for delivery", () => {
    expect(statusLabel("out_for_delivery", "pickup")).toBe("Ready for pickup");
    expect(statusLabel("out_for_delivery", "delivery")).toBe("Out for delivery");
    expect(statusLabel("received", "pickup")).toBe("Confirmed");
  });

  it("shows cancelled as a banner, not a step", () => {
    expect(ORDER_PROGRESS).not.toContain("cancelled");
  });

  it("takes a slip only for an open, unpaid bank transfer", () => {
    const order = { payment: "bank_transfer", status: "received", paid: false } as const;

    expect(acceptsReceipt(order)).toBe(true);
    expect(acceptsReceipt({ ...order, payment: "cod" })).toBe(false);
    expect(acceptsReceipt({ ...order, paid: true })).toBe(false);
    expect(acceptsReceipt({ ...order, status: "cancelled" })).toBe(false);
  });
});

describe("checkReceipt", () => {
  const withHeader = (header: string | number[], size = 64) => {
    const bytes = new Uint8Array(size);
    bytes.set(typeof header === "string" ? [...header].map((c) => c.charCodeAt(0)) : header);
    return bytes;
  };

  it("accepts a photo or a PDF", () => {
    expect(checkReceipt(withHeader([0xff, 0xd8, 0xff]))).toEqual({ type: "image/jpeg", ext: "jpg" });
    expect(checkReceipt(withHeader("%PDF-1.7"))).toEqual({ type: "application/pdf", ext: "pdf" });
  });

  it("refuses an SVG or HTML page, whatever it is called", () => {
    expect(checkReceipt(withHeader("<svg xmlns"))).toEqual({ error: "type" });
    expect(checkReceipt(withHeader("<!doctype html>"))).toEqual({ error: "type" });
  });

  it("refuses an empty file and one over 5 MB", () => {
    expect(checkReceipt(new Uint8Array())).toEqual({ error: "empty" });
    expect(checkReceipt(withHeader("%PDF-1.7", MAX_RECEIPT_BYTES + 1))).toEqual({ error: "tooLarge" });
  });
});
