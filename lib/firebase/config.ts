/**
 * Whether this deployment has Firebase credentials at all. Without them the
 * app runs in guest mode (FR-A-10): no sign-in, the cart stays on the device,
 * and the Account page explains that accounts are not set up. Malformed
 * values are a different case and still fail loudly where they are parsed.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT &&
      process.env.NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG
  );
}
