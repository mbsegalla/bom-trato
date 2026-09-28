import { getApiConfig } from '@/config/api.config';
import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  reviewInvitationPreviewResponseSchema,
  reviewInvitationResponseSchema,
  submittedReviewResponseSchema,
} from '../schemas/review.schema';
import type { ReviewInvitation, ReviewInvitationPreview, SubmittedReview } from '../types/review.types';

function invitationPath(organizationId: string, workOrderId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/work-orders/${encodeURIComponent(workOrderId)}/review-invite`;
}

export async function createReviewInvitation(organizationId: string, workOrderId: string): Promise<ReviewInvitation> {
  const response = await authenticatedFetch(invitationPath(organizationId, workOrderId), {
    method: 'POST',
  });

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);

    const code =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'object' &&
      payload.error !== null &&
      'code' in payload.error &&
      typeof payload.error.code === 'string'
        ? payload.error.code
        : null;

    if (code === 'REVIEW_ALREADY_SUBMITTED') {
      throw new Error('Este serviço já recebeu uma avaliação.');
    }

    if (code === 'REVIEW_PUBLIC_PROFILE_REQUIRED') {
      throw new Error('Configure sua Vitrine antes de solicitar avaliações.');
    }

    if (code === 'REVIEW_WORK_ORDER_NOT_COMPLETED') {
      throw new Error('A avaliação só pode ser solicitada depois da conclusão do serviço.');
    }

    throw new Error('Não foi possível gerar o link de avaliação.');
  }

  const payload: unknown = await response.json();

  const parsed = reviewInvitationResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o link de avaliação.');
  }

  return parsed.data;
}

async function publicReviewRequest(path: string, body: unknown): Promise<Response> {
  const { baseUrl } = getApiConfig();

  return fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function resolveReviewInvitation(token: string): Promise<ReviewInvitationPreview> {
  const response = await publicReviewRequest('/api/public/reviews/resolve', {
    token,
  });

  if (!response.ok) {
    if (response.status === 410) {
      throw new Error('Este link de avaliação expirou.');
    }

    if (response.status === 409) {
      throw new Error('Este serviço já foi avaliado.');
    }

    throw new Error('Este link de avaliação não é válido.');
  }

  const payload: unknown = await response.json();

  const parsed = reviewInvitationPreviewResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a avaliação.');
  }

  return parsed.data;
}

export async function submitReview(
  token: string,
  input: {
    rating: number;
    comment: string | null;
  },
): Promise<SubmittedReview> {
  const response = await publicReviewRequest('/api/public/reviews/submit', {
    token,
    ...input,
  });

  if (!response.ok) {
    if (response.status === 410) {
      throw new Error('Este link de avaliação expirou.');
    }

    if (response.status === 409) {
      throw new Error('Este serviço já foi avaliado.');
    }

    throw new Error('Não foi possível enviar sua avaliação.');
  }

  const payload: unknown = await response.json();

  const parsed = submittedReviewResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a avaliação enviada.');
  }

  return parsed.data;
}
