import { vi } from "vitest";
import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from "@supabase/supabase-js";
import { mergeCarts, type Cart } from "@/lib/products";

/**
 * Stand-ins for what the routes reach Supabase through:
 *
 * - `client`, the session client `createClient()` from lib/supabase/server
 *   returns - only its `auth` methods are used, and each is a spy.
 * - `store`, the helpers from lib/supabase/store. The cart ones keep an
 *   in-memory map keyed by uid, so tests can assert exactly whose cart was
 *   read or written; the merge applies BR-20 like the SQL function does.
 * - `admin`, the service-role client: `auth.admin.deleteUser`, the role
 *   lookup in `profiles` (from `roles`, member when absent) and `audit_log`
 *   inserts (collected in `auditRows`).
 */
function createSupabaseDouble() {
  const carts = new Map<string, unknown>();
  const roles = new Map<string, string>();
  const auditRows: Record<string, unknown>[] = [];

  const auth = {
    getUser: vi.fn(),
    getClaims: vi.fn(),
    signOut: vi.fn(),
    signInWithOAuth: vi.fn(),
    exchangeCodeForSession: vi.fn(),
  };

  const store = {
    getCart: vi.fn(async (uid: string) => carts.get(uid)),
    saveCart: vi.fn(async (uid: string, items: Cart) => {
      carts.set(uid, items);
    }),
    mergeCart: vi.fn(async (uid: string, items: Cart) => {
      const merged = mergeCarts((carts.get(uid) as Cart | undefined) ?? {}, items);
      carts.set(uid, merged);
      return merged;
    }),
    insertOrder: vi.fn(),
    insertPlan: vi.fn(),
  };

  const admin = {
    auth: { admin: { deleteUser: vi.fn() } },
    from: (table: string) => ({
      select: () => ({
        eq: (_column: string, uid: string) => ({
          maybeSingle: async () => ({
            data: table === "profiles" && roles.has(uid) ? { role: roles.get(uid) } : null,
            error: null,
          }),
        }),
      }),
      insert: async (row: Record<string, unknown>) => {
        if (table === "audit_log") auditRows.push(row);
        return { error: null };
      },
    }),
  };

  return {
    client: { auth },
    auth,
    store,
    admin,
    carts,
    roles,
    auditRows,

    /** A session the Auth server accepts */
    givenUser(
      uid: string,
      {
        email = "user@example.com",
        metadata = {} as Record<string, unknown>,
        role = "member",
      } = {}
    ) {
      roles.set(uid, role);
      auth.getUser.mockResolvedValue({
        data: { user: { id: uid, email, user_metadata: metadata } },
        error: null,
      });
    },
    /** No session cookie at all */
    givenSignedOut() {
      auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new AuthSessionMissingError(),
      });
    },
    /** A session the Auth server rejects (revoked, expired, user gone) */
    givenRejectedSession() {
      auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new AuthApiError("Session not found", 403, "session_not_found"),
      });
    },
    /** The Auth server cannot be reached */
    givenAuthOutage() {
      auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new AuthRetryableFetchError("fetch failed", 0),
      });
    },

    reset() {
      carts.clear();
      roles.clear();
      auditRows.length = 0;
      for (const spy of Object.values(auth)) spy.mockReset();
      store.insertOrder.mockReset().mockResolvedValue({ id: "new-order", ref: "ASW-NEW234" });
      store.insertPlan.mockReset().mockResolvedValue("new-plan");
      admin.auth.admin.deleteUser.mockReset().mockResolvedValue({ data: {}, error: null });
      auth.signOut.mockResolvedValue({ error: null });
      this.givenSignedOut();
    },
  };
}

// One instance per test file - Vitest gives each file its own module registry,
// so the mock factory and the test body see the same double without leaking
// between files.
export const supabaseDouble = createSupabaseDouble();

/** Accounts switched on, as `isSupabaseConfigured()` checks */
export function stubSupabaseEnv() {
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  vi.stubEnv("SUPABASE_SECRET_KEY", "secret-key");
}
