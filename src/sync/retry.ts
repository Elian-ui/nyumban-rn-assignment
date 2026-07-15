import { ApiError } from '../api';

const TRANSIENT_STATUSES = new Set([429, 500, 503]);

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export async function withTransientRetry<T>(
  work: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      const retryable =
        !(error instanceof ApiError) || TRANSIENT_STATUSES.has(error.status);
      if (!retryable || attempt === 2) throw error;
      const retryAfter =
        error instanceof ApiError ? error.retryAfterSeconds : null;
      const delay = retryAfter ? retryAfter * 1000 : 500 * 2 ** attempt;
      await wait(delay);
    }
  }
  throw lastError;
}
