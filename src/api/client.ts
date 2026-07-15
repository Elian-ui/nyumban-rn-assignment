import {
  accessToken,
  clearSession,
  refreshSession,
} from '../auth/sessionManager';
import { environment, requireAssessmentKey } from '../config/environment';
import { ApiError, apiErrorFromResponse } from './errors';

export interface ApiRequestOptions extends RequestInit {
  retryAuthentication?: boolean;
}

async function send(
  path: string,
  token: string,
  options: ApiRequestOptions,
): Promise<Response> {
  return fetch(`${environment.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'X-Assessment-Key': requireAssessmentKey(),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = await accessToken();
  let response = await send(path, token, options);

  if (response.status === 401 && options.retryAuthentication !== false) {
    try {
      const refreshed = await refreshSession(token);
      response = await send(path, refreshed.accessToken, {
        ...options,
        retryAuthentication: false,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearSession();
      }
      throw error;
    }
  }

  if (!response.ok) {
    throw await apiErrorFromResponse(response);
  }

  return (await response.json()) as T;
}
