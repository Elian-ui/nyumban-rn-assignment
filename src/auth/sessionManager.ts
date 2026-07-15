import type { Session } from '../domain';
import { ApiError } from '../api/errors';
import { login, refresh } from './authApi';
import {
  clearSession as clearStoredSession,
  loadSession,
  saveSession,
} from './sessionStorage';

const REFRESH_EARLY_MS = 60_000;

let session: Session | null = null;
let refreshPromise: Promise<Session> | null = null;
const listeners = new Set<(nextSession: Session | null) => void>();

function notifySessionChanged(): void {
  listeners.forEach(listener => listener(session));
}

export function subscribeSession(
  listener: (nextSession: Session | null) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function restoreSession(): Promise<Session | null> {
  session = await loadSession();

  if (!session) {
    return null;
  }

  if (session.accessTokenExpiresAt <= Date.now() + REFRESH_EARLY_MS) {
    try {
      return await refreshSession();
    } catch {
      await clearSession();
      return null;
    }
  }

  return session;
}

export async function createSession(
  email: string,
  password: string,
): Promise<Session> {
  const nextSession = await login(email, password);
  await saveSession(nextSession);
  session = nextSession;
  notifySessionChanged();
  return nextSession;
}

export async function refreshSession(
  rejectedAccessToken?: string,
): Promise<Session> {
  if (refreshPromise) {
    return refreshPromise;
  }

  if (!session) {
    throw new Error('No session available to refresh');
  }

  if (rejectedAccessToken && rejectedAccessToken !== session.accessToken) {
    return session;
  }

  const refreshToken = session.refreshToken;
  refreshPromise = (async () => {
    try {
      const nextSession = await refresh(refreshToken);
      await saveSession(nextSession);
      session = nextSession;
      notifySessionChanged();
      return nextSession;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        session = null;
        await clearStoredSession();
        notifySessionChanged();
      }
      throw error;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function accessToken(): Promise<string> {
  if (!session) {
    throw new Error('Not authenticated');
  }

  if (session.accessTokenExpiresAt <= Date.now() + REFRESH_EARLY_MS) {
    return (await refreshSession()).accessToken;
  }

  return session.accessToken;
}

export async function clearSession(): Promise<void> {
  session = null;
  refreshPromise = null;
  await clearStoredSession();
  notifySessionChanged();
}
