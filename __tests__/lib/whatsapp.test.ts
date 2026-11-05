import { describe, expect, it } from "vitest";
import {
  buildCustomerStatusMessage,
  buildEnquiryMessage,
  mailtoLink,
  smsLink,
  waLink,
} from "@/lib/order/whatsapp";
import { isPlaceholderNumber } from "@/lib/shop-config";

describe("buildEnquiryMessage (FR-I-07, AC-23)", () => {
  it("names the shop, so the owner can tell it from other chats", () => {
    expect(buildEnquiryMessage("Tea (Ceylon)", 1, 2.47)).toMatch(/^Plantation enquiry - Aswedduma/);
  });

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

describe("buildCustomerStatusMessage", () => {
  const order = {
    id: "order-1",
    ref: "ASW-7K3P9Q",
    name: "Nimal",
    method: "pickup" as const,
    payment: "cod" as const,
    paid: false,
    total: 810,
  };

  it("confirms the order by its reference and links to its page", () => {
    const message = buildCustomerStatusMessage(order, "received");

    expect(message).toMatch(/^Hello Nimal,/);
    expect(message).toContain("Your order ASW-7K3P9Q is confirmed.");
    expect(message).toContain("/account/orders/order-1");
  });

  it("says ready for pickup for a pickup order and out for delivery for a delivery", () => {
    expect(buildCustomerStatusMessage(order, "out_for_delivery")).toContain("is ready for pickup");
    expect(
      buildCustomerStatusMessage({ ...order, method: "delivery" }, "out_for_delivery")
    ).toContain("is out for delivery");
  });

  it("asks a bank transfer customer for the slip until the order is paid", () => {
    const bank = { ...order, payment: "bank_transfer" as const };

    expect(buildCustomerStatusMessage(bank, "received")).toContain("upload the slip");
    expect(buildCustomerStatusMessage({ ...bank, paid: true }, "received")).not.toContain("slip");
  });

  it("thanks the customer once the order is done", () => {
    expect(buildCustomerStatusMessage({ ...order, method: "delivery" }, "completed")).toContain(
      "has been delivered"
    );
  });
});

describe("smsLink and mailtoLink", () => {
  it("open the phone's SMS app and the mail app with the message written", () => {
    expect(smsLink("94771234567", "Hi & bye")).toBe("sms:+94771234567?body=Hi%20%26%20bye");
    expect(mailtoLink("a@b.lk", "Order", "Hi")).toBe("mailto:a%40b.lk?subject=Order&body=Hi");
  });
});
