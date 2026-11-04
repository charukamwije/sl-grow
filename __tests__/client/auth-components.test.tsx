/**
 * @vitest-environment jsdom
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountDeleteButton from "@/components/auth/AccountDeleteButton";
import AuthButtons from "@/components/auth/AuthButtons";
import AuthModal from "@/components/modals/AuthModal";
import type { AuthOperation } from "@/lib/supabase/useSupabaseAuth";
import { renderWithLanguage as render } from "./render";
import "./setup";

const auth = vi.hoisted(() => ({
  loadingProvider: null as AuthOperation,
  isAuthLoading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => auth }));

function busyWith(provider: AuthOperation) {
  auth.loadingProvider = provider;
  auth.isAuthLoading = provider !== null;
}

const signedInUser = {
  uid: "user-1",
  email: "user@example.com",
  displayName: "Example User",
  photoURL: null,
  role: "member" as const,
};

const modalTitle = () => screen.queryByRole("heading", { name: "Sign in" });

beforeEach(() => {
  vi.clearAllMocks();
  busyWith(null);
  auth.signInWithGoogle.mockResolvedValue({ success: true });
  auth.signOut.mockResolvedValue({ success: true });
  auth.deleteAccount.mockResolvedValue({ success: true });
});

describe("AuthButtons", () => {
  it("offers sign-out to a signed-in user", async () => {
    render(<AuthButtons user={signedInUser} />);

    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("opens the sign-in modal for a signed-out visitor", async () => {
    render(<AuthButtons user={null} />);

    expect(modalTitle()).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(modalTitle()).toBeInTheDocument());
  });

  it("disables sign-out while any operation is running", () => {
    busyWith("google");
    render(<AuthButtons user={signedInUser} />);

    expect(screen.getByRole("button", { name: /sign out/i })).toBeDisabled();
  });

  it("disables sign-in while any operation is running", () => {
    busyWith("delete");
    render(<AuthButtons user={null} />);

    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
  });
});

describe("AccountDeleteButton", () => {
  it("does nothing when the confirmation is declined", async () => {
    // Deletion is irreversible, so the guard is the whole point of this button.
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AccountDeleteButton />);

    await userEvent.click(screen.getByRole("button"));

    expect(confirm).toHaveBeenCalled();
    expect(auth.deleteAccount).not.toHaveBeenCalled();
  });

  it("deletes once the confirmation is accepted", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AccountDeleteButton />);

    await userEvent.click(screen.getByRole("button"));

    expect(auth.deleteAccount).toHaveBeenCalledTimes(1);
  });

  it("warns that the action cannot be undone and removes saved data", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AccountDeleteButton />);

    await userEvent.click(screen.getByRole("button"));

    expect(confirm.mock.calls[0][0]).toMatch(/cannot be undone/i);
    expect(confirm.mock.calls[0][0]).toMatch(/orders and plans/i);
  });

  it("asks to finish once the user is back from re-authenticating", () => {
    render(<AccountDeleteButton confirmDelete />);

    expect(
      screen.getByRole("button", { name: "Finish deleting account" })
    ).toBeInTheDocument();
  });

  it("is disabled while another operation is running", () => {
    busyWith("signout");
    render(<AccountDeleteButton />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("AuthModal", () => {
  it("renders nothing while closed", () => {
    render(<AuthModal isOpen={false} onClose={vi.fn()} />);

    expect(modalTitle()).not.toBeInTheDocument();
  });

  it("offers Google sign-in only", () => {
    render(<AuthModal isOpen onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /guest/i })).not.toBeInTheDocument();
  });

  it("closes after Google sign-in succeeds", async () => {
    const onClose = vi.fn();
    render(<AuthModal isOpen onClose={onClose} />);

    await userEvent.click(
      screen.getByRole("button", { name: /sign in with google/i })
    );

    expect(auth.signInWithGoogle).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("stays open when sign-in fails, so the user can retry", async () => {
    auth.signInWithGoogle.mockResolvedValue({ success: false, error: "nope" });
    const onClose = vi.fn();
    render(<AuthModal isOpen onClose={onClose} />);

    await userEvent.click(
      screen.getByRole("button", { name: /sign in with google/i })
    );

    await waitFor(() => expect(auth.signInWithGoogle).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(modalTitle()).toBeInTheDocument();
  });

  it("disables the button and spins while signing in", () => {
    busyWith("google");
    render(<AuthModal isOpen onClose={vi.fn()} />);

    const button = screen.getByRole("button", { name: /sign in with google/i });
    expect(button).toBeDisabled();
    expect(button).toContainElement(screen.getByTestId("loading-spinner"));
  });

  it("closes on the dismiss button", async () => {
    const onClose = vi.fn();
    render(<AuthModal isOpen onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("loading indicators", () => {
  it("AuthButtons spins only while signing out", () => {
    busyWith("signout");
    const { unmount } = render(<AuthButtons user={signedInUser} />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    unmount();

    busyWith("google");
    render(<AuthButtons user={signedInUser} />);
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("AccountDeleteButton spins only while deleting", () => {
    busyWith("delete");
    const { unmount } = render(<AccountDeleteButton />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    unmount();

    busyWith("signout");
    render(<AccountDeleteButton />);
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });
});

describe("the sign-in modal's lifecycle", () => {
  it("closes again from inside the modal", async () => {
    render(<AuthButtons user={null} />);

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(modalTitle()).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => expect(modalTitle()).not.toBeInTheDocument());
  });
});
