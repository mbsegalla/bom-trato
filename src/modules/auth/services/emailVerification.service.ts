import { getApiConfig } from '@/config/api.config';

import {
  csrfResponseSchema,
  emailVerificationTokenSchema,
  resendVerificationEmailSchema,
} from '../schemas/auth.schema';
import type { EmailVerificationOperation, EmailVerificationResult } from '../types/auth.types';
import {
  getVerificationCooldownSeconds,
  readRetryAfterSeconds,
  startVerificationCooldown,
} from './verificationCooldown';

function responseError(status: number, operation: EmailVerificationOperation): string {
  if (status === 429) {
    return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.';
  }

  if (status === 403) {
    return 'Não foi possível validar a solicitação. Tente novamente.';
  }

  if (operation === 'verify' && (status === 400 || status === 401 || status === 410)) {
    return 'Este link é inválido, expirou ou já foi utilizado. Tente entrar ou solicite outro e-mail.';
  }

  if (operation === 'resend' && status === 400) {
    return 'Confira o endereço de e-mail informado.';
  }

  return 'O serviço está temporariamente indisponível. Tente novamente mais tarde.';
}

async function sendRequest(
  operation: EmailVerificationOperation,
  payload: { token: string } | { email: string },
): Promise<EmailVerificationResult> {
  let requestStarted = false;

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
      if (operation === 'resend' && csrfResponse.status === 429) {
        startVerificationCooldown(readRetryAfterSeconds(csrfResponse));
      }

      return {
        success: false,
        rateLimited: csrfResponse.status === 429,
        message:
          csrfResponse.status === 429
            ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
            : 'Não foi possível iniciar a solicitação. Tente novamente.',
      };
    }

    const csrfPayload: unknown = await csrfResponse.json();
    const csrfResult = csrfResponseSchema.safeParse(csrfPayload);

    if (!csrfResult.success) {
      return {
        success: false,
        message: 'O serviço está temporariamente indisponível.',
      };
    }

    const path = operation === 'verify' ? '/api/auth/verify-email' : '/api/auth/resend-verification';

    requestStarted = true;

    const response = await fetch(new URL(path, baseUrl), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfResult.data.csrfToken,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      if (operation === 'resend' && response.status === 429) {
        startVerificationCooldown(readRetryAfterSeconds(response));
      }

      return {
        success: false,
        message: responseError(response.status, operation),
        rateLimited: response.status === 429,
      };
    }

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: requestStarted
        ? operation === 'verify'
          ? 'Não conseguimos confirmar o resultado. Tente entrar; se o e-mail ainda não estiver verificado, tente novamente.'
          : 'Não conseguimos confirmar o envio. Confira sua caixa de entrada antes de solicitar outro e-mail.'
        : 'Não foi possível conectar ao serviço. Tente novamente.',
    };
  }
}

export async function verifyEmail(token: string): Promise<EmailVerificationResult> {
  const result = emailVerificationTokenSchema.safeParse(token);

  if (!result.success) {
    return {
      success: false,
      message: 'O link de verificação é inválido. Solicite outro e-mail.',
    };
  }

  return sendRequest('verify', {
    token: result.data,
  });
}

export async function resendVerificationEmail(email: string): Promise<EmailVerificationResult> {
  const result = resendVerificationEmailSchema.safeParse(email);

  if (!result.success) {
    return {
      success: false,
      message: 'Informe um endereço de e-mail válido.',
    };
  }

  const remainingSeconds = getVerificationCooldownSeconds();

  if (remainingSeconds > 0) {
    return {
      success: false,
      message: `Aguarde ${remainingSeconds}s antes de solicitar outro e-mail.`,
      rateLimited: true,
    };
  }

  // Reserve before the first await to prevent rapid duplicate submissions.
  // Keep the deadline after network failures: the API may have accepted the request.
  startVerificationCooldown();

  return sendRequest('resend', {
    email: result.data,
  });
}
