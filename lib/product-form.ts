import { CATEGORIES, UNITS, type Category, type Unit } from "./data/products";
import { VEGETABLES } from "./data/vegetables";
import type { Localized } from "./i18n/types";
import { checkUpload, IMAGE_KINDS, type UploadError } from "./uploads";

/** What the admin product form submits, checked */
export type ProductInput = {
  id: string;
  category: Category;
  name: Localized;
  unit: Unit;
  icon: string;
  price: number;
  vegId: string | null;
  active: boolean;
};

export type ProductFormErrors = Partial<Record<keyof ProductInput | "form", string>>;

export const PRODUCT_ID_PATTERN = /^[a-z]+_[a-z0-9_]+$/;

const MAX_NAME = 120;
const MAX_ICON = 16;
const MAX_PRICE = 10_000_000;

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Reads and checks the product form. The database checks the same rules
 * again (0003_products.sql); this side exists to give the admin a message
 * per field.
 */
export function parseProductForm(
  form: FormData
): { input: ProductInput; errors?: never } | { input?: never; errors: ProductFormErrors } {
  const errors: ProductFormErrors = {};

  const id = text(form, "id").toLowerCase();
  if (!PRODUCT_ID_PATTERN.test(id) || id.length > 40) {
    errors.id =
      "Use lower-case letters, an underscore, then letters, digits or underscores (e.g. f_compost). Up to 40 characters.";
  }

  const category = text(form, "category");
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    errors.category = "Choose a category.";
  }

  const unit = text(form, "unit");
  if (!(UNITS as readonly string[]).includes(unit)) {
    errors.unit = "Choose a unit.";
  }

  const name = {
    en: text(form, "name_en"),
    si: text(form, "name_si"),
    ta: text(form, "name_ta"),
  };
  if (!name.en) {
    errors.name = "An English name is required.";
  } else if (Object.values(name).some((value) => value.length > MAX_NAME)) {
    errors.name = `Names can be up to ${MAX_NAME} characters.`;
  }

  const icon = text(form, "icon") || "🌱";
  if ([...icon].length > MAX_ICON) {
    errors.icon = "Use one emoji.";
  }

  const priceText = text(form, "price");
  const price = Number(priceText);
  if (!priceText || !Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
    errors.price = "Enter a price in LKR, 0 or more.";
  }

  const vegText = text(form, "vegId");
  const vegId = vegText || null;
  if (vegId && !VEGETABLES.some((veg) => veg.id === vegId)) {
    errors.vegId = "Choose a vegetable from the list.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    input: {
      id,
      category: category as Category,
      name,
      unit: unit as Unit,
      icon,
      price: Math.round(price * 100) / 100,
      vegId,
      active: form.get("active") === "on",
    },
  };
}

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const IMAGE_ERRORS: Record<UploadError, string> = {
  empty: "Choose a photo to upload.",
  tooLarge: "The photo must be 2 MB or smaller.",
  type: "Use a JPEG, PNG or WebP photo.",
};

/** A product photo: JPEG, PNG or WebP up to 2 MB, checked by its first bytes */
export function checkImage(
  bytes: Uint8Array
): { type: string; ext: string; error?: never } | { error: string } {
  const result = checkUpload(bytes, { maxBytes: MAX_IMAGE_BYTES, kinds: IMAGE_KINDS });
  return result.error ? { error: IMAGE_ERRORS[result.error] } : result;
}
