import { getApiConfig } from '@/config/api.config';

import { readRetryAfterSeconds } from '../helpers/requestCooldown';
import { startVerificationCooldown } from '../helpers/verificationCooldown';
import { csrfResponseSchema } from '../schemas/auth.schema';
import type { RegisterInput, RegisterResult } from '../types/auth.types';

function getRegistrationErrorMessage(status: number): string {
  switch (status) {
    case 400:
    case 422:
      return 'Confira os dados informados e os requisitos de senha.';

    case 403:
      return 'Não foi possível validar a solicitação. Tente enviar novamente.';

    case 409:
      return 'Não foi possível criar a conta com esses dados. Se já possui uma conta, tente entrar.';

    case 429:
      return 'Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente.';

    default:
      return 'Não foi possível concluir o cadastro. Tente novamente mais tarde.';
  }
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  let registrationStarted = false;

  try {
    const { baseUrl, timeoutMs } = getApiConfig();

    const csrfResponse = await fetch(new URL('/api/auth/csrf', baseUrl), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!csrfResponse.ok) {
      return {
        success: false,
        message:
          csrfResponse.status === 429
            ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
            : 'Não foi possível iniciar o cadastro. Tente novamente.',
      };
    }

    const csrfPayload: unknown = await csrfResponse.json();
    const csrfResult = csrfResponseSchema.safeParse(csrfPayload);

    if (!csrfResult.success) {
      return {
        success: false,
        message: 'O cadastro está temporariamente indisponível.',
      };
    }

    registrationStarted = true;

    const response = await fetch(new URL('/api/auth/register', baseUrl), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfResult.data.csrfToken,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      if (response.status === 429) {
        startVerificationCooldown(readRetryAfterSeconds(response));
      }

      return {
        success: false,
        message: getRegistrationErrorMessage(response.status),
      };
    }

    startVerificationCooldown();

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: registrationStarted
        ? 'Não conseguimos confirmar o resultado do cadastro. Verifique seu e-mail antes de tentar novamente.'
        : 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
    };
  }
}
