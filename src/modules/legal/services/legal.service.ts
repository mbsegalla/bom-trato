import { getApiConfig } from '@/config/api.config';

import { currentLegalDocumentsResponseSchema } from '../schemas/legal.schema';
import type { CurrentLegalDocumentsResult } from '../types/legal.types';

export async function getCurrentLegalDocuments(): Promise<CurrentLegalDocumentsResult> {
  try {
    const { baseUrl, timeoutMs } = getApiConfig();

    const response = await fetch(new URL('/api/legal/current', baseUrl), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Não foi possível carregar os documentos legais.',
      };
    }

    const payload: unknown = await response.json();
    const parsed = currentLegalDocumentsResponseSchema.safeParse(payload);

    if (!parsed.success) {
      return {
        success: false,
        message: 'Não foi possível interpretar os documentos legais.',
      };
    }

    return {
      success: true,
      documents: parsed.data,
    };
  } catch {
    return {
      success: false,
      message: 'Não foi possível carregar os documentos legais.',
    };
  }
}
