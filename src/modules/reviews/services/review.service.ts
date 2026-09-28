import { getApiConfig } from '@/config/api.config';

import { reviewInvitationPreviewResponseSchema, submittedReviewResponseSchema } from '../schemas/review.schema';
import type { ReviewInvitationPreview, SubmittedReview } from '../types/review.types';

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
