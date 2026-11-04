/**
 * Whether this deployment has Supabase credentials at all. Without them the
 * app runs in guest mode (FR-A-10): no sign-in, the cart stays on the device,
 * and the Account page explains that accounts are not set up.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_PUBLISHABLE_KEY &&
      process.env.SUPABASE_SECRET_KEY
  );
}
