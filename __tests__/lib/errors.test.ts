import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/lib/utils/errors";

describe("getErrorMessage", () => {
  it("reads the message off an Error", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("reads the message off a plain object", () => {
    expect(getErrorMessage({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("falls back when there is no message", () => {
    expect(getErrorMessage({}, "fallback")).toBe("fallback");
  });

  it("falls back on an empty message", () => {
    expect(getErrorMessage({ message: "" }, "fallback")).toBe("fallback");
  });

  it("falls back on a non-string message", () => {
    expect(getErrorMessage({ message: 500 }, "fallback")).toBe("fallback");
  });

  it("falls back on null and undefined", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });
});
