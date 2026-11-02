/**
 * ==== SHOP SETTINGS ====
 *
 * The shop's WhatsApp number in international format without "+" or spaces,
 * e.g. 94771234567. Orders and plantation enquiries are sent here (OI-02).
 */
export const OWNER_WHATSAPP = "94XXXXXXXXX";

/** True while the number above is still the placeholder (AC-12) */
export function isPlaceholderNumber(number: string = OWNER_WHATSAPP): boolean {
  return !/^\d{8,15}$/.test(number);
}
