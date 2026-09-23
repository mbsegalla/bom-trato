import { getApiConfig } from '@/config/api.config';

import { startPasswordResetCooldown } from '../helpers/passwordResetCooldown';
import { readRetryAfterSeconds } from '../helpers/verificationCooldown';
import { csrfResponseSchema, emailSchema, passwordResetTokenSchema } from '../schemas/auth.schema';
import type { ForgotPasswordResult, ResetPasswordResult } from '../types/auth.types';

interface CsrfResult {
  success: boolean;
  token?: string;
  status?: number;
  response?: Response;
}

async function getCsrfToken(baseUrl: URL, timeoutMs: number): Promise<CsrfResult> {
  const response = await fetch(new URL('/api/auth/csrf', baseUrl), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      response,
    };
  }

  const payload: unknown = await response.json();
  const result = csrfResponseSchema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
    };
  }

  return {
    success: true,
    token: result.data.csrfToken,
  };
}

function getForgotPasswordErrorMessage(status: number): string {
  switch (status) {
    case 400:
    case 422:
      return 'Confira o endereço de e-mail informado.';

    case 403:
      return 'Não foi possível validar a solicitação. Tente novamente.';

    case 429:
      return 'Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente.';

    default:
      return 'Não foi possível solicitar a recuperação de senha. Tente novamente mais tarde.';
  }
}

function getResetPasswordError(status: number): Omit<Extract<ResetPasswordResult, { success: false }>, 'success'> {
  switch (status) {
    case 400:
    case 422:
      return {
        message: 'A nova senha não atende aos requisitos.',
      };

    case 401:
      return {
        message: 'Este link é inválido, expirou ou já foi utilizado.',
        invalidToken: true,
      };

    case 403:
      return {
        message: 'Não foi possível validar a solicitação. Tente novamente.',
      };

    case 429:
      return {
        message: 'Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente.',
        rateLimited: true,
      };

    default:
      return {
        message: 'Não foi possível alterar sua senha. Tente novamente mais tarde.',
      };
  }
}

export async function requestPasswordReset(emailInput: string): Promise<ForgotPasswordResult> {
  const emailResult = emailSchema.safeParse(emailInput);

  if (!emailResult.success) {
    return {
      success: false,
      message: 'Informe um endereço de e-mail válido.',
    };
  }

  let requestStarted = false;

  try {
    const { baseUrl, timeoutMs } = getApiConfig();

    const csrfResult = await getCsrfToken(new URL(baseUrl), timeoutMs);

    if (!csrfResult.success || !csrfResult.token) {
      if (csrfResult.status === 429 && csrfResult.response) {
        startPasswordResetCooldown(readRetryAfterSeconds(csrfResult.response));
      }

      return {
        success: false,
        rateLimited: csrfResult.status === 429,
        message:
          csrfResult.status === 429
            ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
            : 'Não foi possível iniciar a solicitação. Tente novamente.',
      };
    }

    requestStarted = true;

    const response = await fetch(new URL('/api/auth/forgot-password', baseUrl), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfResult.token,
      },
      body: JSON.stringify({
        email: emailResult.data,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      if (response.status === 429) {
        startPasswordResetCooldown(readRetryAfterSeconds(response));
      }

      return {
        success: false,
        rateLimited: response.status === 429,
        message: getForgotPasswordErrorMessage(response.status),
      };
    }

    startPasswordResetCooldown();

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: requestStarted
        ? 'Não conseguimos confirmar o envio. Confira seu e-mail antes de solicitar um novo link.'
        : 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
    };
  }
}

export async function resetPassword(tokenInput: string, password: string): Promise<ResetPasswordResult> {
  const tokenResult = passwordResetTokenSchema.safeParse(tokenInput);

  if (!tokenResult.success) {
    return {
      success: false,
      invalidToken: true,
      message: 'O link de recuperação é inválido.',
    };
  }

  let resetStarted = false;

  try {
    const { baseUrl, timeoutMs } = getApiConfig();

    const csrfResult = await getCsrfToken(new URL(baseUrl), timeoutMs);

    if (!csrfResult.success || !csrfResult.token) {
      return {
        success: false,
        rateLimited: csrfResult.status === 429,
        message:
          csrfResult.status === 429
            ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
            : 'Não foi possível iniciar a solicitação. Tente novamente.',
      };
    }

    resetStarted = true;

    const response = await fetch(new URL('/api/auth/reset-password', baseUrl), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfResult.token,
      },
      body: JSON.stringify({
        token: tokenResult.data,
        password,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return {
        success: false,
        ...getResetPasswordError(response.status),
      };
    }

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: resetStarted
        ? 'Não conseguimos confirmar a alteração da senha. Tente entrar antes de solicitar uma nova recuperação.'
        : 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
    };
  }
}
