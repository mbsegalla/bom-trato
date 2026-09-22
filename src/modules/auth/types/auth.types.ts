import type { PlanPrice } from '@/modules/plans/types/plan.types';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface RegistrationPlan {
  name: string;
  price: PlanPrice;
}

export type RegisterResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export interface RegisterFormProps {
  selectedPlan?: RegistrationPlan;
}

export type EmailVerificationResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export type EmailVerificationOperation = 'verify' | 'resend';
