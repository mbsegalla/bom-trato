import { authIdentitiesResponseSchema } from '../schemas/auth.schema';
import type { AuthProvider } from '../types/auth.types';
import { authenticatedFetch, SessionError } from './session.service';

export async function getAuthIdentityProviders(): Promise<AuthProvider[]> {
  const response = await authenticatedFetch('/api/auth/identities');

  if (!response.ok) {
    throw new SessionError('Não foi possível consultar os métodos de acesso.', response.status);
  }

  const payload: unknown = await response.json();

  const parsed = authIdentitiesResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new SessionError('Não foi possível interpretar os métodos de acesso.');
  }

  return parsed.data.providers;
}

export async function linkGoogleIdentity(credential: string): Promise<void> {
  const response = await authenticatedFetch('/api/auth/google/link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      credential,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
    }

    if (response.status === 409) {
      throw new SessionError('Não foi possível vincular esta conta Google.', 409);
    }

    throw new SessionError('Não foi possível conectar sua conta Google.', response.status);
  }
}
