import { getApiConfig } from '@/config/api.config';

import { currentUserResponseSchema, emailVerificationTokenSchema, sessionResponseSchema } from '../schemas/auth.schema';
import type { AuthUser, SessionResponse } from '../types/auth.types';
import { CsrfRequestError, requestCsrfToken } from './csrf.service';

type Session = SessionResponse & {
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

type SessionOperation = 'login' | 'refresh' | 'verify';

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

    this.name = 'SessionError';
  }
}

function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const pending = mutationQueue.then(operation, operation);

  mutationQueue = pending.catch(() => undefined);

  return pending;
}

function sessionErrorMessage(status: number, operation: SessionOperation): string {
  if (status === 429) {
    return 'Muitas tentativas. Aguarde antes de tentar novamente.';
  }

  if (operation === 'login') {
    if (status === 401) {
      return 'E-mail ou senha inválidos.';
    }

    if (status === 403) {
      return 'Confirme seu e-mail antes de entrar.';
    }

    return 'Não foi possível entrar. Tente novamente.';
  }

  if (operation === 'verify') {
    if (status === 400 || status === 401 || status === 410) {
      return 'O link é inválido, expirou ou já foi utilizado.';
    }

    return 'Não foi possível confirmar seu e-mail. Tente novamente.';
  }

  if (status === 401) {
    return 'Sua sessão expirou. Entre novamente.';
  }

  return 'Não foi possível restaurar sua sessão.';
}

async function requestSession(path: string, operation: SessionOperation, body?: object): Promise<Session> {
  const { baseUrl, timeoutMs } = getApiConfig();

  let csrfToken: string;

  try {
    csrfToken = await requestCsrfToken();
  } catch (error: unknown) {
    if (error instanceof CsrfRequestError) {
      throw new SessionError(
        error.status === 429
          ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
          : 'Não foi possível iniciar a autenticação. Tente novamente.',
        error.status,
      );
    }

    throw error;
  }

  let response: Response;

  try {
    response = await fetch(new URL(path, baseUrl), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new SessionError('Não conseguimos confirmar o resultado da solicitação.', 0, true);
  }

  if (!response.ok) {
    throw new SessionError(sessionErrorMessage(response.status, operation), response.status, response.status >= 500);
  }

  const payload: unknown = await response.json().catch(() => null);

  const parsed = sessionResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new SessionError('Não conseguimos ler a sessão retornada.', 0, true);
  }

  session = {
    ...parsed.data,
    expiresAt: Date.now() + parsed.data.expiresIn * 1000,
  };

  return session;
}

export function login(email: string, password: string): Promise<void> {
  return serialized(async () => {
    await requestSession('/api/auth/login', 'login', {
      email,
      password,
    });
  });
}

export function restoreSession(): Promise<Session> {
  if (refreshFlight) {
    return refreshFlight;
  }

  refreshFlight = serialized(() => requestSession('/api/auth/refresh', 'refresh'))
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

  const current = session && session.expiresAt > Date.now() + 15_000 ? session : await restoreSession();

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

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await authenticatedFetch('/api/auth/me');

  if (!response.ok) {
    throw new SessionError('Não foi possível carregar sua conta.', response.status);
  }

  const payload: unknown = await response.json();

  const parsed = currentUserResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new SessionError('Não foi possível ler sua conta.');
  }

  return parsed.data;
}

export async function logout(): Promise<void> {
  const response = await authenticatedFetch('/api/auth/logout', {
    method: 'POST',
  });

  if (!response.ok && response.status !== 401) {
    throw new SessionError('Não foi possível encerrar sua sessão.', response.status);
  }

  session = null;
}

async function confirm(token: string): Promise<VerificationOutcome> {
  try {
    await serialized(() => requestSession('/api/auth/verify-email', 'verify', { token }));

    return {
      kind: 'confirmed',
    };
  } catch (error: unknown) {
    if (!(error instanceof SessionError) || !error.uncertain) {
      throw error;
    }

    try {
      await restoreSession();

      const user = await getCurrentUser();

      if (!user.emailVerified) {
        throw error;
      }

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
