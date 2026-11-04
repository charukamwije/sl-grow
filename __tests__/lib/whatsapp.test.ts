import { describe, expect, it } from "vitest";
import { buildEnquiryMessage, waLink } from "@/lib/order/whatsapp";
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
