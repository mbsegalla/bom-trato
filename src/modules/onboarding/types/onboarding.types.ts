import type { z } from 'zod';

import type {
  onboardingAccessSourceSchema,
  onboardingStateSchema,
  onboardingStepSchema,
  onboardingTrialSchema,
} from '../schemas/onboarding.schema';

export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
export type OnboardingAccessSource = z.infer<typeof onboardingAccessSourceSchema>;
export type OnboardingTrial = z.infer<typeof onboardingTrialSchema>;
export type OnboardingState = z.infer<typeof onboardingStateSchema>;
