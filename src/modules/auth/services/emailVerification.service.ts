import { getApiConfig } from '@/config/api.config';

import { readRetryAfterSeconds } from '../helpers/requestCooldown';
import { getVerificationCooldownSeconds, startVerificationCooldown } from '../helpers/verificationCooldown';
import { resendVerificationEmailSchema } from '../schemas/auth.schema';
import type { ResendVerificationResult } from '../types/auth.types';
import { CsrfRequestError, requestCsrfToken } from './csrf.service';

export async function resendVerificationEmail(email: string): Promise<ResendVerificationResult> {
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
      rateLimited: true,
      message: `Aguarde ${remainingSeconds}s antes de solicitar outro e-mail.`,
    };
  }

  startVerificationCooldown();

  try {
    const { baseUrl, timeoutMs } = getApiConfig();

    const csrfToken = await requestCsrfToken();

    const response = await fetch(new URL('/api/auth/resend-verification', baseUrl), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        email: result.data,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      if (response.status === 429) {
        startVerificationCooldown(readRetryAfterSeconds(response));
      }

      return {
        success: false,
        rateLimited: response.status === 429,

        message:
          response.status === 400
            ? 'Confira o endereço de e-mail informado.'
            : response.status === 429
              ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
              : 'Não foi possível reenviar o e-mail. Tente novamente.',
      };
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    if (error instanceof CsrfRequestError && error.status === 429 && error.response) {
      startVerificationCooldown(readRetryAfterSeconds(error.response));

      return {
        success: false,
        rateLimited: true,
        message: 'Muitas tentativas. Aguarde antes de tentar novamente.',
      };
    }

    return {
      success: false,
      message: 'Não conseguimos confirmar o envio. Confira sua caixa de entrada antes de solicitar outro e-mail.',
    };
  }
}
