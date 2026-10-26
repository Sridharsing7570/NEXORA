import type { AuthResponse, MeResponse, UserProfile, WorkspaceSummary } from '@repo/api/auth/auth.schemas';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  ApiError,
  clearTokens,
  getStoredRefreshToken,
  refreshSession,
  setSessionEndedHandler,
  storeTokens,
} from '@/lib/api';
import { authApi } from '@/lib/auth-api';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secure-storage';

/** Last known profile, so the app can open signed-in while offline. */
const PROFILE_KEY = 'nexora.profile';

type Status = 'loading' | 'signedOut' | 'signedIn';

type Session = {
  status: Status;
  isSignedIn: boolean;
  user: UserProfile | null;
  workspaces: WorkspaceSummary[];
  /** Store the tokens and profile returned by any sign-in endpoint. */
  completeSignIn: (response: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  /** Revokes every session on the server, including this one. Throws if the server is unreachable. */
  signOutEverywhere: () => Promise<void>;
  /** Re-fetch the profile and workspaces from the server. */
  reloadProfile: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [me, setMe] = useState<MeResponse | null>(null);

  const applyProfile = useCallback(async (profile: MeResponse) => {
    setMe(profile);
    await setSecureItem(PROFILE_KEY, JSON.stringify(profile));
  }, []);

  const endSession = useCallback(async () => {
    await Promise.all([clearTokens(), deleteSecureItem(PROFILE_KEY)]);
    setMe(null);
    setStatus('signedOut');
  }, []);

  // Restore the session on launch.
  useEffect(() => {
    setSessionEndedHandler(() => void endSession());

    (async () => {
      try {
        if (!(await refreshSession())) {
          setStatus('signedOut');
          return;
        }
        await applyProfile(await authApi.me());
        setStatus('signedIn');
      } catch (error) {
        // Offline with a stored session: open with the cached profile instead of signing out.
        const cached = await getSecureItem(PROFILE_KEY);
        if (error instanceof ApiError && error.isNetworkError && cached) {
          setMe(JSON.parse(cached) as MeResponse);
          setStatus('signedIn');
        } else {
          await endSession();
        }
      }
    })();

    return () => setSessionEndedHandler(null);
  }, [applyProfile, endSession]);

  const completeSignIn = useCallback(
    async (response: AuthResponse) => {
      await storeTokens(response.tokens);
      // The auth response has the profile; workspaces come from /users/me.
      setMe({ user: response.user, workspaces: [] });
      setStatus('signedIn');
      try {
        await applyProfile(await authApi.me());
      } catch {
        // Not fatal: the profile is already shown; workspaces load on the next reload.
      }
    },
    [applyProfile],
  );

  const signOut = useCallback(async () => {
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken) {
      // Best effort: sign out locally even if the server is unreachable.
      await authApi.logout(refreshToken).catch(() => undefined);
    }
    await endSession();
  }, [endSession]);

  const signOutEverywhere = useCallback(async () => {
    // Unlike signOut, this must reach the server; otherwise other devices stay signed in.
    await authApi.logoutAll();
    await endSession();
  }, [endSession]);

  const reloadProfile = useCallback(async () => {
    await applyProfile(await authApi.me());
  }, [applyProfile]);

  const value = useMemo<Session>(
    () => ({
      status,
      isSignedIn: status === 'signedIn',
      user: me?.user ?? null,
      workspaces: me?.workspaces ?? [],
      completeSignIn,
      signOut,
      signOutEverywhere,
      reloadProfile,
    }),
    [status, me, completeSignIn, signOut, signOutEverywhere, reloadProfile],
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

/** Name to greet the user with: their name, else the part of their email before the @. */
export function displayName(user: UserProfile | null): string {
  return user?.name?.split(/\s+/)[0] || user?.email?.split('@')[0] || 'there';
}
