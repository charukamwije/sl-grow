import { describe, expect, it } from "vitest";
import { generateOrderRef, isOrderRef } from "@/lib/order/reference";

describe("generateOrderRef", () => {
  it("makes short ASW- references with six easy-to-read characters", () => {
    for (let i = 0; i < 200; i++) {
      const ref = generateOrderRef();
      expect(ref).toMatch(/^ASW-[2-9A-HJKMNP-TW-Z]{6}$/);
      expect(isOrderRef(ref)).toBe(true);
    }
  });

  it("never uses characters that are easy to misread", () => {
    const seen = new Set(
      Array.from({ length: 500 }, () => generateOrderRef().slice(4)).join("")
    );
    for (const confusing of ["0", "O", "1", "I", "L", "U", "V"]) {
      expect(seen.has(confusing)).toBe(false);
    }
  });

  it("is effectively unique", () => {
    const refs = new Set(Array.from({ length: 2000 }, () => generateOrderRef()));
    expect(refs.size).toBe(2000);
  });

  it("skips random bytes that would bias the alphabet", () => {
    // 255 is above the largest multiple of 29 below 256, so it is rejected;
    // 0 maps to "2"
    let call = 0;
    const ref = generateOrderRef((bytes) => {
      bytes.fill(call++ === 0 ? 255 : 0);
      return bytes;
    });
    expect(ref).toBe("ASW-222222");
  });
});

describe("isOrderRef", () => {
  it.each(["ASW-7K3P9Q", "ASW-222222"])("accepts %s", (ref) => {
    expect(isOrderRef(ref)).toBe(true);
  });

  it.each(["asw-7k3p9q", "ASW-7K3P9", "ASW-7K3P9QX", "ASW-O00000", "XYZ-7K3P9Q", 42, null])(
    "rejects %p",
    (value) => {
      expect(isOrderRef(value)).toBe(false);
    }
  );
});
