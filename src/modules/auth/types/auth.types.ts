import type { z } from 'zod';

import type { PlanPrice } from '@/modules/plans/types/plan.types';
import type { ServiceResult } from '@/shared/types/serviceResult';

import type { authSessionSchema, currentUserResponseSchema, sessionResponseSchema } from '../schemas/auth.schema';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  selectedPlanPriceId?: string | null;
}

export interface RegistrationPlan {
  name: string;
  price: PlanPrice;
}

export interface RegisterFormProps {
  selectedPlan?: RegistrationPlan;
}

export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export type AuthUser = z.infer<typeof currentUserResponseSchema>;

export type AuthSession = z.infer<typeof authSessionSchema>;

export type RegisterResult = ServiceResult;

export type ResendVerificationResult = ServiceResult<Record<never, never>, { rateLimited?: boolean }>;

export type ForgotPasswordResult = ServiceResult<Record<never, never>, { rateLimited?: boolean }>;

export type ResetPasswordResult = ServiceResult<
  Record<never, never>,
  { invalidToken?: boolean; rateLimited?: boolean }
>;
