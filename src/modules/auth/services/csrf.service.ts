import { getApiConfig } from '@/config/api.config';

import { csrfResponseSchema } from '../schemas/auth.schema';

export class CsrfRequestError extends Error {
  constructor(
    readonly status: number,
    readonly response: Response | null = null,
    options?: ErrorOptions,
  ) {
    super('Unable to obtain CSRF token.', options);

    this.name = 'CsrfRequestError';
  }
}

export async function requestCsrfToken(): Promise<string> {
  const { baseUrl, timeoutMs } = getApiConfig();

  let response: Response;

  try {
    response = await fetch(new URL('/api/auth/csrf', baseUrl), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause: unknown) {
    throw new CsrfRequestError(0, null, { cause });
  }

  if (!response.ok) {
    throw new CsrfRequestError(response.status, response);
  }

  const payload: unknown = await response.json().catch(() => null);

  const result = csrfResponseSchema.safeParse(payload);

  if (!result.success) {
    throw new CsrfRequestError(0, response);
  }

  return result.data.csrfToken;
}
