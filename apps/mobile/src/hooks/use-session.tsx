import { createContext, use, useMemo, useState, type ReactNode } from 'react';

type Session = {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

/**
 * In-memory session so the sign-in flow can be navigated before the auth API exists.
 * Replace the internals with real token handling (secure storage + refresh) in the auth phase.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  const value = useMemo<Session>(
    () => ({
      isSignedIn,
      signIn: () => setIsSignedIn(true),
      signOut: () => setIsSignedIn(false),
    }),
    [isSignedIn],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const session = use(SessionContext);
  if (!session) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return session;
}
