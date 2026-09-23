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
      rateLimited?: boolean;
    };

export type EmailVerificationOperation = 'verify' | 'resend';

export type ForgotPasswordResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
      rateLimited?: boolean;
    };

export type ResetPasswordResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
      invalidToken?: boolean;
      rateLimited?: boolean;
    };
