import { describe, expect, it } from "vitest";
import { hasRole, isRole } from "@/lib/supabase/roles";

describe("hasRole", () => {
  it.each([
    ["member", "member", true],
    ["member", "admin", false],
    ["member", "super_admin", false],
    ["admin", "member", true],
    ["admin", "admin", true],
    ["admin", "super_admin", false],
    ["super_admin", "admin", true],
    ["super_admin", "super_admin", true],
  ] as const)("%s meets %s: %s", (role, min, expected) => {
    expect(hasRole(role, min)).toBe(expected);
  });

  it("gives nobody any role", () => {
    expect(hasRole(null, "member")).toBe(false);
    expect(hasRole(undefined, "member")).toBe(false);
  });
});

describe("isRole", () => {
  it("accepts the three roles", () => {
    expect(["member", "admin", "super_admin"].every(isRole)).toBe(true);
  });

  it.each(["owner", "Admin", "", null, 1])("rejects %s", (value) => {
    expect(isRole(value)).toBe(false);
  });
});
