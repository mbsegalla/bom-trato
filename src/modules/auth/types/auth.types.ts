import type { PlanPrice } from '@/modules/plans/types/plan.types';
import type { ServiceResult } from '@/shared/types/serviceResult';

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

export type RegisterResult = ServiceResult;

export type ResendVerificationResult = ServiceResult<Record<never, never>, { rateLimited?: boolean }>;

export type ForgotPasswordResult = ServiceResult<Record<never, never>, { rateLimited?: boolean }>;

export type ResetPasswordResult = ServiceResult<
  Record<never, never>,
  { invalidToken?: boolean; rateLimited?: boolean }
>;
