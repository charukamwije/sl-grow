/**
 * Sri Lankan mobile numbers. Orders need one the shop can call and send a
 * WhatsApp or SMS to, so checkout accepts only a mobile number and stores it
 * in international form without "+" (947XXXXXXXX), the form wa.me needs.
 */

const MOBILE = /^7\d{8}$/;

/** "077 123 4567", "+94 77 123 4567", "94771234567" or "771234567" → "94771234567" */
export function normalizeMobile(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;

  if (digits.startsWith("94")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  return MOBILE.test(digits) ? `94${digits}` : null;
}

/** "94771234567" → "+94 77 123 4567"; anything else is shown as it was saved */
export function formatMobile(phone: string): string {
  const normalized = normalizeMobile(phone);
  if (!normalized) return phone;
  const local = normalized.slice(2);
  return `+94 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}
