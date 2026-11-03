/**
 * ==== SHOP SETTINGS ====
 *
 * The shop's WhatsApp Business number in international format without "+" or
 * spaces, as wa.me links need it. Orders, plantation enquiries and
 * certification applications are all sent here.
 */
export const OWNER_WHATSAPP = "94768683639";

/** The same number written for people to read and dial */
export const OWNER_WHATSAPP_DISPLAY = "+94 76 868 3639";

/** True while the number above is still a placeholder (AC-12) */
export function isPlaceholderNumber(number: string = OWNER_WHATSAPP): boolean {
  return !/^\d{8,15}$/.test(number);
}
