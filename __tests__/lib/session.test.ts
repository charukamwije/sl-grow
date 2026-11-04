import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_COOKIE_OPTIONS,
  SESSION_EXPIRES_IN,
  isRecent,
  safeNextPath,
  withSessionLifetime,
} from "@/lib/supabase/session";

const NOW = new Date("2026-01-01T00:00:00Z");
const nowSeconds = NOW.getTime() / 1000;

describe("session constants", () => {
  it("keeps the session cookies away from page scripts", () => {
    expect(SESSION_COOKIE_OPTIONS).toMatchObject({ httpOnly: true, sameSite: "lax" });
  });

  it("caps a stored cookie at the session's lifetime, in seconds", () => {
    // @supabase/ssr asks for 400 days
    expect(withSessionLifetime({ httpOnly: true, maxAge: 400 * 24 * 60 * 60 })).toEqual({
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60,
    });
  });

  it("leaves a cookie removal alone", () => {
    expect(withSessionLifetime({ maxAge: 0 })).toEqual({ maxAge: 0 });
  });

  it("expires sessions after two weeks, in milliseconds", () => {
    expect(SESSION_EXPIRES_IN).toBe(14 * 24 * 60 * 60 * 1000);
  });
});

describe("isRecent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a timestamp from this instant", () => {
    expect(isRecent(nowSeconds)).toBe(true);
  });

  it("accepts a timestamp just inside the five minute window", () => {
    expect(isRecent(nowSeconds - 299)).toBe(true);
  });

  it("accepts a timestamp exactly five minutes old", () => {
    expect(isRecent(nowSeconds - 300)).toBe(true);
  });

  it("rejects a timestamp just outside the window", () => {
    expect(isRecent(nowSeconds - 301)).toBe(false);
  });

  it("rejects a clearly stale timestamp", () => {
    expect(isRecent(nowSeconds - 60 * 60)).toBe(false);
  });

  it("accepts a timestamp in the future", () => {
    // Clock skew between Supabase and this server must not lock a user out.
    expect(isRecent(nowSeconds + 60)).toBe(true);
  });
});

describe("safeNextPath", () => {
  it.each(["/", "/shop", "/account?confirmDelete=1", "/guides/1#top"])(
    "keeps the path %s on this site",
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    }
  );

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "/\\attacker.example",
    "shop",
    "",
    null,
    42,
  ])("falls back to the home page for %s", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });
});
