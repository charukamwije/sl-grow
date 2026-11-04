/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONFIRM_DELETE_PATH,
  navigation,
  useSupabaseAuth,
} from "@/lib/supabase/useSupabaseAuth";
import "./setup";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
const authService = vi.hoisted(() => ({
  startSignIn: vi.fn(),
  deleteSession: vi.fn(),
  deleteUserAccount: vi.fn(),
}));
const notify = vi.hoisted(() => ({
  addErrorNotification: vi.fn(),
  addSuccessNotification: vi.fn(),
  addWarningNotification: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/supabase/authService", () => authService);
vi.mock("@/contexts/notification-context", () => ({
  useNotification: () => notify,
}));

const GOOGLE = "https://accounts.google.com/o/oauth2";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(navigation, "assign").mockImplementation(() => {});
  window.history.replaceState(null, "", "/shop?tab=seeds");
  authService.startSignIn.mockResolvedValue({ success: true, url: GOOGLE });
  authService.deleteSession.mockResolvedValue({ success: true });
  authService.deleteUserAccount.mockResolvedValue({ success: true });
});

describe("signInWithGoogle", () => {
  it("goes to Google, coming back to the current page", async () => {
    const { result } = renderHook(() => useSupabaseAuth());

    await act(async () => {
      await expect(result.current.signInWithGoogle()).resolves.toEqual({
        success: true,
      });
    });

    expect(authService.startSignIn).toHaveBeenCalledWith("/shop?tab=seeds", false);
    expect(navigation.assign).toHaveBeenCalledWith(GOOGLE);
    // The page is being left, so it stays busy until it is
    expect(result.current.loadingProvider).toBe("google");
  });

  it("shows the error and stops loading when sign-in cannot start", async () => {
    authService.startSignIn.mockResolvedValue({ success: false, error: "Nope." });
    const { result } = renderHook(() => useSupabaseAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(navigation.assign).not.toHaveBeenCalled();
    expect(notify.addErrorNotification).toHaveBeenCalledWith("Nope.");
    expect(result.current.loadingProvider).toBeNull();
  });
});

describe("signOut", () => {
  it("ends the session and refreshes the page", async () => {
    const { result } = renderHook(() => useSupabaseAuth());

    await act(async () => {
      await expect(result.current.signOut()).resolves.toEqual({ success: true });
    });

    expect(router.refresh).toHaveBeenCalled();
    expect(notify.addSuccessNotification).toHaveBeenCalledWith(
      "Successfully signed out."
    );
    expect(result.current.loadingProvider).toBeNull();
  });

  it("warns when the server session could not be revoked", async () => {
    authService.deleteSession.mockResolvedValue({
      success: false,
      error: "Signed out on this device, but the server session could not be revoked.",
    });
    const { result } = renderHook(() => useSupabaseAuth());

    await act(async () => {
      await result.current.signOut();
    });

    // Refreshed anyway: this browser no longer holds the session
    expect(router.refresh).toHaveBeenCalled();
    expect(notify.addWarningNotification).toHaveBeenCalledWith(
      "Signed out on this device, but the server session could not be revoked."
    );
  });
});

describe("deleteAccount", () => {
  it("reports a completed deletion and refreshes the page", async () => {
    const { result } = renderHook(() => useSupabaseAuth());

    await act(async () => {
      await expect(result.current.deleteAccount()).resolves.toEqual({
        success: true,
      });
    });

    expect(router.refresh).toHaveBeenCalled();
    expect(notify.addSuccessNotification).toHaveBeenCalledWith(
      "Account successfully deleted."
    );
    expect(navigation.assign).not.toHaveBeenCalled();
  });

  it("sends the user through Google again when the server asks", async () => {
    authService.deleteUserAccount.mockResolvedValue({
      success: false,
      reauthRequired: true,
      error: "Re-authentication is required.",
    });
    const { result } = renderHook(() => useSupabaseAuth());

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(authService.startSignIn).toHaveBeenCalledWith(CONFIRM_DELETE_PATH, true);
    expect(navigation.assign).toHaveBeenCalledWith(GOOGLE);
    expect(notify.addErrorNotification).not.toHaveBeenCalled();
    expect(result.current.loadingProvider).toBe("delete");
  });

  it("shows a refusal and leaves the session alone", async () => {
    authService.deleteUserAccount.mockResolvedValue({
      success: false,
      error: "Failed to delete account.",
    });
    const { result } = renderHook(() => useSupabaseAuth());

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(notify.addErrorNotification).toHaveBeenCalledWith(
      "Failed to delete account."
    );
    expect(authService.deleteSession).not.toHaveBeenCalled();
    expect(result.current.loadingProvider).toBeNull();
  });

  it("ends the session as a precaution when the outcome is unknown", async () => {
    authService.deleteUserAccount.mockResolvedValue({
      success: false,
      outcomeUnknown: true,
      error: "Failed to fetch",
    });
    const { result } = renderHook(() => useSupabaseAuth());

    await act(async () => {
      await expect(result.current.deleteAccount()).resolves.toMatchObject({
        outcomeUnknown: true,
      });
    });

    expect(authService.deleteSession).toHaveBeenCalled();
    expect(router.refresh).toHaveBeenCalled();
    expect(notify.addWarningNotification).toHaveBeenCalledWith(
      "The deletion could not be confirmed, so the session was ended as a precaution."
    );
  });

  it("stays neutral when the precautionary sign-out fails too", async () => {
    authService.deleteUserAccount.mockResolvedValue({
      success: false,
      outcomeUnknown: true,
    });
    authService.deleteSession.mockResolvedValue({ success: false });
    const { result } = renderHook(() => useSupabaseAuth());

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(notify.addWarningNotification).toHaveBeenCalledWith(
      "The deletion could not be confirmed, and the sign-out did not fully complete, so the session may still be active."
    );
  });
});
