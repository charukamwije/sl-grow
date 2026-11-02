import { describe, expect, it } from "vitest";
import {
  buildEnquiryMessage,
  buildOrderMessage,
  validateCheckout,
  waLink,
  type CheckoutDetails,
} from "@/lib/order/whatsapp";
import { formatLKR } from "@/lib/products";
import { isPlaceholderNumber } from "@/lib/shop-config";

const details: CheckoutDetails = {
  name: "Nimal Perera",
  phone: "0771234567",
  method: "delivery",
  address: "12 Galle Road, Colombo 3",
  notes: "Call before coming",
};

const cart = { s_tomato: 2, f_compost: 1 };

describe("validateCheckout", () => {
  it("requires a name and phone (FR-O-01, AC-05)", () => {
    expect(validateCheckout({ ...details, name: "" }, cart)).toBe("nameAndPhone");
    expect(validateCheckout({ ...details, phone: "  " }, cart)).toBe("nameAndPhone");
  });

  it("requires an address for delivery only (FR-O-02, AC-06)", () => {
    expect(validateCheckout({ ...details, address: "" }, cart)).toBe("address");
    expect(
      validateCheckout({ ...details, method: "pickup", address: "" }, cart)
    ).toBeNull();
  });

  it("refuses an empty cart", () => {
    expect(validateCheckout(details, {})).toBe("emptyCart");
  });

  it("accepts a complete order", () => {
    expect(validateCheckout(details, cart)).toBeNull();
  });
});

describe("buildOrderMessage (FR-O-04, FR-O-05, AC-07)", () => {
  const message = buildOrderMessage(details, cart);

  it("lists the customer, method and address", () => {
    expect(message).toContain("Name: Nimal Perera");
    expect(message).toContain("Phone: 0771234567");
    expect(message).toContain("Method: Delivery");
    expect(message).toContain("Address: 12 Galle Road, Colombo 3");
    expect(message).toContain("Notes: Call before coming");
  });

  it("lists each item in English with its code, quantity and line total", () => {
    expect(message).toContain(
      `- [S-TOMATO] Tomato seedling (Thakkali) x 2 = ${formatLKR(160)}`
    );
    expect(message).toContain(`- [F-COMPOST] Compost (10 kg bag) x 1 = ${formatLKR(650)}`);
    expect(message).toContain(`Total before delivery: ${formatLKR(810)}`);
  });

  it("leaves out the address and empty notes for a pickup", () => {
    const pickup = buildOrderMessage(
      { ...details, method: "pickup", notes: "" },
      cart
    );

    expect(pickup).toContain("Method: Pickup");
    expect(pickup).not.toContain("Address:");
    expect(pickup).not.toContain("Notes:");
  });
});

describe("buildEnquiryMessage (FR-I-07, AC-23)", () => {
  it("names the crop and land size", () => {
    const message = buildEnquiryMessage("Tea (Ceylon)", 2, 4.94);

    expect(message).toContain("Crop: Tea (Ceylon)");
    expect(message).toContain("Land size: 2.00 ha (4.94 acres)");
  });
});

describe("waLink", () => {
  it("builds a wa.me link with the encoded message", () => {
    expect(waLink("Hi & bye\nnext", "94771234567")).toBe(
      "https://wa.me/94771234567?text=Hi%20%26%20bye%0Anext"
    );
  });
});

describe("isPlaceholderNumber (AC-12)", () => {
  it("flags the placeholder and accepts a real number", () => {
    expect(isPlaceholderNumber("94XXXXXXXXX")).toBe(true);
    expect(isPlaceholderNumber("94771234567")).toBe(false);
  });
});
