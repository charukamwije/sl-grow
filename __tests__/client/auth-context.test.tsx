/**
 * @vitest-environment jsdom
 */
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import "./setup";

const authService = vi.hoisted(() => ({
  startSignIn: vi.fn(),
  deleteSession: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/authService", () => authService);
vi.mock("@/contexts/notification-context", () => ({
  useNotification: () => ({
    addErrorNotification: vi.fn(),
    addSuccessNotification: vi.fn(),
    addWarningNotification: vi.fn(),
  }),
}));

// Two independent consumers, to prove they read one shared state rather than
// each holding their own copy of the hook.
function Consumer({ label }: { label: string }) {
  const { loadingProvider, isAuthLoading, signInWithGoogle } = useAuth();

  return (
    <div>
      <span data-testid={`${label}-provider`}>{loadingProvider ?? "idle"}</span>
      <span data-testid={`${label}-busy`}>{String(isAuthLoading)}</span>
      <button onClick={() => void signInWithGoogle()}>{label} sign in</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("AuthProvider", () => {
  it("gives every consumer the same auth state", async () => {
    let release!: (value: unknown) => void;
    authService.startSignIn.mockReturnValue(
      new Promise((r) => (release = r))
    );

    render(
      <AuthProvider>
        <Consumer label="first" />
        <Consumer label="second" />
      </AuthProvider>
    );

    expect(screen.getByTestId("first-provider")).toHaveTextContent("idle");
    expect(screen.getByTestId("second-provider")).toHaveTextContent("idle");

    act(() => {
      screen.getByRole("button", { name: "first sign in" }).click();
    });

    // The operation started in the first consumer must disable the second one
    // too, or the two could race over the same user and session cookie.
    await waitFor(() =>
      expect(screen.getByTestId("second-provider")).toHaveTextContent("google")
    );
    expect(screen.getByTestId("second-busy")).toHaveTextContent("true");

    // A failed start ends the operation; a successful one leaves the page
    await act(async () => {
      release({ success: false, error: "nope" });
    });

    expect(screen.getByTestId("first-provider")).toHaveTextContent("idle");
    expect(screen.getByTestId("second-provider")).toHaveTextContent("idle");
  });

  it("exposes the whole auth surface", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      ),
    });

    expect(Object.keys(result.current).sort()).toEqual([
      "deleteAccount",
      "isAuthLoading",
      "loadingProvider",
      "signInWithGoogle",
      "signOut",
    ]);
  });
});

describe("useAuth", () => {
  it("refuses to run outside a provider", () => {
    function Orphan() {
      useAuth();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      "useAuth must be used within an AuthProvider"
    );
  });
});
