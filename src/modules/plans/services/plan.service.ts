import { getApiConfig } from '@/config/api.config';

import { planListResponseSchema } from '../schemas/plan.schema';
import type { PlanListResult } from '../types/plan.types';

export async function listPlans(): Promise<PlanListResult> {
  try {
    const { baseUrl, timeoutMs } = getApiConfig();

    const response = await fetch(new URL('/api/plans', baseUrl), {
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
        message: 'Não foi possível carregar os planos. Tente novamente.',
      };
    }

    const payload: unknown = await response.json();
    const result = planListResponseSchema.safeParse(payload);

    if (!result.success) {
      return {
        success: false,
        message: 'Os planos estão temporariamente indisponíveis.',
      };
    }

    return {
      success: true,
      plans: result.data,
    };
  } catch {
    return {
      success: false,
      message: 'Não foi possível carregar os planos. Tente novamente.',
    };
  }
}
