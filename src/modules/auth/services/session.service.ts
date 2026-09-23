import { z } from 'zod';

import { getApiConfig } from '@/config/api.config';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

import { csrfResponseSchema, emailVerificationTokenSchema } from '../schemas/auth.schema';

const sessionSchema = apiResponseSchema(
  z.object({
    accessToken: z.string().min(1),
    expiresIn: z.number().positive(),
    tokenType: z.literal('Bearer'),
    csrfToken: z.string().min(1),
  }),
);

const meSchema = apiResponseSchema(
  z.object({
    email: z.string().email(),
    emailVerified: z.boolean(),
  }),
);

type Session = z.infer<typeof sessionSchema> & {
  expiresAt: number;
};

export type VerificationOutcome =
  | {
      kind: 'confirmed';
    }
  | {
      kind: 'recovered';
      email: string;
    };

let session: Session | null = null;
let refreshFlight: Promise<Session> | null = null;
let mutationQueue: Promise<unknown> = Promise.resolve();

let verification: {
  token: string;
  promise: Promise<VerificationOutcome>;
} | null = null;

export class SessionError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly uncertain = false,
  ) {
    super(message);
  }
}

function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const pending = mutationQueue.then(operation, operation);

  mutationQueue = pending.catch(() => undefined);

  return pending;
}

async function requestSession(path: string, body?: object): Promise<Session> {
  const { baseUrl, timeoutMs } = getApiConfig();

  const csrfResponse = await fetch(new URL('/api/auth/csrf', baseUrl), {
    credentials: 'include',
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!csrfResponse.ok) {
    throw new SessionError('Não foi possível iniciar a autenticação. Tente novamente.', csrfResponse.status);
  }

  const csrfPayload: unknown = await csrfResponse.json();
  const csrfResult = csrfResponseSchema.safeParse(csrfPayload);

  if (!csrfResult.success) {
    throw new SessionError('Resposta de autenticação inválida.');
  }

  let response: Response;

  try {
    response = await fetch(new URL(path, baseUrl), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfResult.data.csrfToken,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new SessionError('Não conseguimos confirmar o resultado da solicitação.', 0, true);
  }

  if (!response.ok) {
    const message =
      response.status === 429
        ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
        : response.status === 401 || response.status === 400 || response.status === 410
          ? 'O link é inválido, expirou ou já foi utilizado. Tente entrar na sua conta.'
          : 'Não foi possível autenticar. Tente novamente.';

    throw new SessionError(message, response.status, response.status >= 500);
  }

  const payload: unknown = await response.json().catch(() => null);

  const parsed = sessionSchema.safeParse(payload);

  if (!parsed.success) {
    throw new SessionError('Não conseguimos ler a sessão retornada.', 0, true);
  }

  session = {
    ...parsed.data,
    expiresAt: Date.now() + parsed.data.expiresIn * 1000,
  };

  return session;
}

export function restoreSession(): Promise<Session> {
  if (refreshFlight) {
    return refreshFlight;
  }

  refreshFlight = serialized(() => requestSession('/api/auth/refresh'))
    .catch((error: unknown) => {
      session = null;
      throw error;
    })
    .finally(() => {
      refreshFlight = null;
    });

  return refreshFlight;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { baseUrl, timeoutMs } = getApiConfig();

  const current = session && session.expiresAt > Date.now() + 15000 ? session : await restoreSession();

  const send = (value: Session) => {
    const headers = new Headers(init.headers);

    headers.set('Authorization', `Bearer ${value.accessToken}`);

    headers.set('X-CSRF-Token', value.csrfToken);

    return fetch(new URL(path, baseUrl), {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
  };

  const response = await send(current);

  if (response.status !== 401) {
    return response;
  }

  const renewed = session && session.accessToken !== current.accessToken ? session : await restoreSession();

  return send(renewed);
}

async function confirm(token: string): Promise<VerificationOutcome> {
  try {
    await serialized(() => requestSession('/api/auth/verify-email', { token }));

    return {
      kind: 'confirmed',
    };
  } catch (error: unknown) {
    if (!(error instanceof SessionError) || !error.uncertain) {
      throw error;
    }

    try {
      await restoreSession();

      const response = await authenticatedFetch('/api/auth/me');

      if (!response.ok) {
        throw error;
      }

      const payload: unknown = await response.json();
      const user = meSchema.parse(payload);

      if (!user.emailVerified) {
        throw error;
      }

      // A recovered cookie may belong to an earlier account.
      // Identify it before allowing the user to continue.
      return {
        kind: 'recovered',
        email: user.email,
      };
    } catch {
      throw error;
    }
  }
}

export function verifyEmailOnce(token: string, retry = false): Promise<VerificationOutcome> {
  if (!emailVerificationTokenSchema.safeParse(token).success) {
    return Promise.reject(new SessionError('O link de confirmação é inválido.'));
  }

  if (!retry && verification?.token === token) {
    return verification.promise;
  }

  const promise = confirm(token);

  verification = {
    token,
    promise,
  };

  return promise;
}
