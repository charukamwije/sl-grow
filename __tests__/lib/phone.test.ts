import { describe, expect, it } from "vitest";
import { formatMobile, normalizeMobile } from "@/lib/order/phone";

describe("normalizeMobile", () => {
  it("accepts a mobile number however it is written", () => {
    for (const input of ["0771234567", "077 123 4567", "077-123-4567", "+94 77 123 4567", "94771234567", "771234567"]) {
      expect(normalizeMobile(input)).toBe("94771234567");
    }
  });

  it("refuses landlines, short numbers and text", () => {
    for (const input of ["0112345678", "07712345", "077123456789", "call me", ""]) {
      expect(normalizeMobile(input)).toBeNull();
    }
  });
});

describe("formatMobile", () => {
  it("writes a stored number for people to read", () => {
    expect(formatMobile("94771234567")).toBe("+94 77 123 4567");
  });

  it("leaves an older free-form number as it was", () => {
    expect(formatMobile("011 234 5678")).toBe("011 234 5678");
  });
});
