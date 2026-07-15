import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '../domain';
import {
  clearSession,
  createSession,
  restoreSession,
  subscribeSession,
} from './sessionManager';

type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeSession(nextSession => {
      setSession(nextSession);
      setStatus(nextSession ? 'authenticated' : 'unauthenticated');
    });

    restoreSession().then(
      restored => {
        setSession(restored);
        setStatus(restored ? 'authenticated' : 'unauthenticated');
      },
      () => {
        setSession(null);
        setStatus('unauthenticated');
      },
    );

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const created = await createSession(email, password);
    setSession(created);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ status, session, signIn, signOut }),
    [session, signIn, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return value;
}
