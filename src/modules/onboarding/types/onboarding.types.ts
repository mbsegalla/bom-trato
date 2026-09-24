import type { z } from 'zod';

import type { onboardingStateSchema, onboardingStepSchema } from '../schemas/onboarding.schema';

export type OnboardingStep = z.infer<typeof onboardingStepSchema>;

export type OnboardingState = z.infer<typeof onboardingStateSchema>;
