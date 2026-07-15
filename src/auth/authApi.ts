import { apiErrorFromResponse } from '../api/errors';
import { environment, requireAssessmentKey } from '../config/environment';
import type { Session } from '../domain';

interface AuthResponse {
  access_token: string;
  refreshToken: string;
  expires_in: number;
  agent: {
    id: string;
    display_name: string;
    assignedRegion: string;
  };
}

function normalizeSession(response: AuthResponse): Session {
  return {
    accessToken: response.access_token,
    refreshToken: response.refreshToken,
    accessTokenExpiresAt: Date.now() + response.expires_in * 1000,
    agent: {
      id: response.agent.id,
      displayName: response.agent.display_name,
      assignedRegion: response.agent.assignedRegion,
    },
  };
}

async function authRequest(
  path: '/auth/login' | '/auth/refresh',
  body: Record<string, string>,
): Promise<Session> {
  const response = await fetch(`${environment.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Assessment-Key': requireAssessmentKey(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await apiErrorFromResponse(response);
  }

  return normalizeSession((await response.json()) as AuthResponse);
}

export function login(email: string, password: string): Promise<Session> {
  return authRequest('/auth/login', { email, password });
}

export function refresh(refreshToken: string): Promise<Session> {
  return authRequest('/auth/refresh', { refreshToken });
}
