"use client";

import { createContext, ReactNode, useContext } from "react";
import type { Role } from "@/lib/supabase/roles";

export type SessionUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  /** For showing or hiding admin links only; the server checks every action */
  role: Role;
};

type SessionContextType = {
  /** The signed-in customer as the server verified them, or null */
  user: SessionUser | null;
  /** False when Supabase is not configured and the app runs as guest only */
  accountsEnabled: boolean;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * Hands the server's view of the session to client components. The root
 * layout resolves it once per request and `router.refresh()` after sign-in or
 * sign-out re-renders it, so nothing on the client has to ask again.
 */
export const SessionProvider = ({
  children,
  ...value
}: SessionContextType & { children: ReactNode }) => (
  <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
