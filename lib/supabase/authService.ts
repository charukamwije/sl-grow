"use client";

/**
 * Authentication service for handling API requests to the server
 */

import { getErrorMessage } from "../utils/errors";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface SignInResult extends AuthResult {
  /** The Google page to send the browser to */
  url?: string;
}

/**
 * The outcomes of an account deletion, which are not interchangeable: a
 * refusal carries no flag and says the account is still there,
 * `reauthRequired` says the server wants a fresh Google sign-in first, and
 * `outcomeUnknown` says the request may have committed before its answer was
 * lost - `deleteUser` can succeed and the response still never arrive.
 */
export interface DeleteAccountResult extends AuthResult {
  reauthRequired?: boolean;
  outcomeUnknown?: boolean;
}

/**
 * Asks the server to start Google sign-in, returning to `next` afterwards
 */
export const startSignIn = async (
  next: string,
  reauth = false
): Promise<SignInResult> => {
  try {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ next, reauth }),
    });

    const data = await response.json();

    if (!response.ok || !data.success || typeof data.url !== "string") {
      throw new Error(data.error || "Sign-in could not be started.");
    }

    return { success: true, url: data.url };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "An error occurred during sign in."),
    };
  }
};

/**
 * Sends a request to end the session on logout
 */
export const deleteSession = async (): Promise<AuthResult> => {
  try {
    const response = await fetch("/api/auth/signout", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to process sign out.");
    }

    return { success: true };
  } catch (error) {
    console.error("Session deletion error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "An error occurred while signing out."),
    };
  }
};

/**
 * Sends a request to delete the user account
 */
export const deleteUserAccount = async (): Promise<DeleteAccountResult> => {
  try {
    const response = await fetch("/api/auth/user", {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        ...(data.reauthRequired ? { reauthRequired: true } : {}),
        error: data.error || "Failed to delete account.",
      };
    }

    return { success: true };
  } catch (error) {
    // The request never produced an answer, so the account may be gone.
    console.error("Account deletion error:", error);
    return {
      success: false,
      outcomeUnknown: true,
      error: getErrorMessage(error, "An error occurred while deleting account."),
    };
  }
};
