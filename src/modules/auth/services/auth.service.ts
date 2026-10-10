import { getApiConfig } from '@/config/api.config';

import { readRetryAfterSeconds } from '../helpers/requestCooldown';
import { startVerificationCooldown } from '../helpers/verificationCooldown';
import type { RegisterInput, RegisterResult } from '../types/auth.types';
import { CsrfRequestError, requestCsrfToken } from './csrf.service';

async function readErrorCode(response: Response): Promise<string | null> {
  const payload: unknown = await response.json().catch(() => null);

  if (typeof payload !== 'object' || payload === null || !('error' in payload)) {
    return null;
  }

  const error = Reflect.get(payload, 'error');

  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const code = Reflect.get(error, 'code');

  return typeof code === 'string' ? code : null;
}

function getRegistrationErrorMessage(status: number, code: string | null): string {
  if (code === 'LEGAL_DOCUMENT_VERSION_OUTDATED') {
    return 'Os Termos de Uso foram atualizados. Recarregue a página para continuar.';
  }

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

    const csrfToken = await requestCsrfToken();

    registrationStarted = true;

    const response = await fetch(new URL('/api/auth/register', baseUrl), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      if (response.status === 429) {
        startVerificationCooldown(readRetryAfterSeconds(response));
      }

      const code = await readErrorCode(response);

      return {
        success: false,
        message: getRegistrationErrorMessage(response.status, code),
      };
    }

    startVerificationCooldown();

    return {
      success: true,
    };
  } catch (error: unknown) {
    if (error instanceof CsrfRequestError) {
      if (error.status === 429 && error.response) {
        startVerificationCooldown(readRetryAfterSeconds(error.response));
      }

      return {
        success: false,
        message:
          error.status === 429
            ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
            : 'Não foi possível iniciar o cadastro. Tente novamente.',
      };
    }

    return {
      success: false,
      message: registrationStarted
        ? 'Não conseguimos confirmar o resultado do cadastro. Verifique seu e-mail antes de tentar novamente.'
        : 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
    };
  }
}
