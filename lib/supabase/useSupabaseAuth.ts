"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/contexts/notification-context";
import {
  AuthResult,
  DeleteAccountResult,
  startSignIn,
  deleteSession,
  deleteUserAccount,
} from "./authService";

/**
 * The auth operations that can be in flight, for loading state management
 */
export type AuthOperation = "google" | "signout" | "delete" | null;

/** Where Google returns to after the re-authentication for deletion */
export const CONFIRM_DELETE_PATH = "/account?confirmDelete=1";

// Swapped out by tests, which cannot navigate jsdom away
export const navigation = {
  assign: (url: string) => window.location.assign(url),
};

/**
 * The app's auth operations and their shared loading state.
 * Instantiate it once through `AuthProvider`; components read it with
 * `useAuth()` so a running operation blocks the others.
 */
export function useSupabaseAuth() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<AuthOperation>(null);
  const {
    addErrorNotification: showErrorMessage,
    addSuccessNotification: showSuccessMessage,
    addWarningNotification: showWarningMessage,
  } = useNotification();

  /**
   * Sends the browser to Google. On success the page is being left, so the
   * loading state stays on until it is.
   */
  const goToGoogle = async (
    next: string,
    reauth: boolean
  ): Promise<AuthResult> => {
    const result = await startSignIn(next, reauth);

    if (!result.success) {
      showErrorMessage(result.error || "An error occurred during sign in.");
      return result;
    }

    navigation.assign(result.url!);
    return { success: true };
  };

  /**
   * Sign in with Google, coming back to the current page
   */
  const signInWithGoogle = async (): Promise<AuthResult> => {
    setLoadingProvider("google");

    const result = await goToGoogle(
      window.location.pathname + window.location.search,
      false
    );

    if (!result.success) {
      setLoadingProvider(null);
    }

    return result;
  };

  /**
   * Sign out user
   */
  const signOut = async (): Promise<AuthResult> => {
    try {
      setLoadingProvider("signout");

      const result = await deleteSession();

      // The server session is gone or unusable either way, so the
      // server-rendered page has to be refreshed.
      router.refresh();

      if (!result.success) {
        // Signed out here, but the session may still be alive elsewhere.
        showWarningMessage(
          result.error || "The server session could not be revoked."
        );
        return result;
      }

      showSuccessMessage("Successfully signed out.");

      return result;
    } finally {
      setLoadingProvider(null);
    }
  };

  /**
   * Delete user account. The server only deletes after a fresh Google
   * sign-in; when there has not been one, the user is sent through Google and
   * comes back to the Account page to confirm again.
   */
  const deleteAccount = async (): Promise<DeleteAccountResult> => {
    setLoadingProvider("delete");

    const serverResult = await deleteUserAccount();

    if (serverResult.reauthRequired) {
      const redirect = await goToGoogle(CONFIRM_DELETE_PATH, true);

      if (!redirect.success) {
        setLoadingProvider(null);
      }

      return serverResult;
    }

    try {
      if (serverResult.outcomeUnknown) {
        // An unconfirmed destructive request may already have deleted the
        // account. Signing out is the recoverable direction - if the account
        // survived the user signs in again, and if it did not the browser is
        // already correct.
        const sessionResult = await deleteSession();

        router.refresh();
        showWarningMessage(
          sessionResult.success
            ? "The deletion could not be confirmed, so the session was ended as a precaution."
            : "The deletion could not be confirmed, and the sign-out did not fully complete, so the session may still be active."
        );

        return serverResult;
      }

      if (!serverResult.success) {
        // A definite refusal: the account is still there.
        showErrorMessage(
          serverResult.error || "An error occurred while deleting account."
        );
        return serverResult;
      }

      // Refresh the page to reflect changes
      router.refresh();
      showSuccessMessage("Account successfully deleted.");

      return serverResult;
    } finally {
      setLoadingProvider(null);
    }
  };

  return {
    loadingProvider,
    isAuthLoading: loadingProvider !== null,
    signInWithGoogle,
    signOut,
    deleteAccount,
  };
}
