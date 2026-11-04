import { describe, expect, it } from "vitest";
import { checkImage, MAX_IMAGE_BYTES, parseProductForm } from "@/lib/product-form";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = {
  id: "t_rake",
  category: "tools",
  unit: "each",
  name_en: "Hand rake",
  name_si: "අත් පෝරුව",
  name_ta: "கை வாரி",
  icon: "🧹",
  price: "550",
  vegId: "",
  active: "on",
};

describe("parseProductForm", () => {
  it("reads a complete product", () => {
    expect(parseProductForm(form(VALID))).toEqual({
      input: {
        id: "t_rake",
        category: "tools",
        unit: "each",
        name: { en: "Hand rake", si: "අත් පෝරුව", ta: "கை வாரி" },
        icon: "🧹",
        price: 550,
        vegId: null,
        active: true,
      },
    });
  });

  it("treats an unticked box as hidden", () => {
    const { active, ...rest } = VALID;
    void active;

    expect(parseProductForm(form(rest)).input?.active).toBe(false);
  });

  it("lower-cases the ID and allows empty Sinhala and Tamil names", () => {
    const { input } = parseProductForm(form({ ...VALID, id: "T_Rake", name_si: "", name_ta: "" }));

    expect(input?.id).toBe("t_rake");
    expect(input?.name).toEqual({ en: "Hand rake", si: "", ta: "" });
  });

  it.each([
    ["id", "rake", "id"],
    ["id", "t-rake", "id"],
    ["category", "weapons", "category"],
    ["unit", "tonne", "unit"],
    ["name_en", "  ", "name"],
    ["price", "-1", "price"],
    ["price", "abc", "price"],
    ["price", "", "price"],
    ["vegId", "pumpkin", "vegId"],
  ])("refuses %s = %p", (field, value, errorKey) => {
    const result = parseProductForm(form({ ...VALID, [field]: value }));

    expect(result.errors).toHaveProperty(errorKey);
  });

  it("links a seedling to a known vegetable", () => {
    expect(parseProductForm(form({ ...VALID, vegId: "tomato" })).input?.vegId).toBe("tomato");
  });
});

describe("checkImage", () => {
  const withHeader = (header: number[], size = 64) => {
    const bytes = new Uint8Array(size);
    bytes.set(header);
    return bytes;
  };

  it("recognises JPEG, PNG and WebP by their first bytes", () => {
    expect(checkImage(withHeader([0xff, 0xd8, 0xff]))).toEqual({ type: "image/jpeg", ext: "jpg" });
    expect(checkImage(withHeader([0x89, 0x50, 0x4e, 0x47]))).toEqual({ type: "image/png", ext: "png" });
    expect(
      checkImage(withHeader([..."RIFF"].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [..."WEBP"].map((c) => c.charCodeAt(0)))))
    ).toEqual({ type: "image/webp", ext: "webp" });
  });

  it("refuses anything else, whatever it is called", () => {
    expect(checkImage(withHeader([..."<svg"].map((c) => c.charCodeAt(0))))).toEqual({
      error: "Use a JPEG, PNG or WebP photo.",
    });
  });

  it("refuses an empty or oversized file", () => {
    expect(checkImage(new Uint8Array())).toHaveProperty("error");
    expect(checkImage(withHeader([0xff, 0xd8, 0xff], MAX_IMAGE_BYTES + 1))).toEqual({
      error: "The photo must be 2 MB or smaller.",
    });
  });
});
