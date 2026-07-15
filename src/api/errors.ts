export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiErrorFromResponse(
  response: Response,
): Promise<ApiError> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const message =
    body &&
    typeof body === 'object' &&
    'error' in body &&
    typeof body.error === 'string'
      ? body.error
      : `Request failed (${response.status})`;
  const retryAfter = response.headers.get('Retry-After');

  return new ApiError(
    message,
    response.status,
    body,
    retryAfter ? Number(retryAfter) : null,
  );
}
