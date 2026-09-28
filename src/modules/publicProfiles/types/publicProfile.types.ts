import type { z } from 'zod';

import type {
  publicProfessionalCardSchema,
  publicProfessionalSchema,
  publicProfessionalsResponseSchema,
  publicProfileFormSchema,
  publicProfileSettingsSchema,
} from '../schemas/publicProfile.schema';

export type PublicProfileSettings = z.infer<typeof publicProfileSettingsSchema>;

export type PublicProfileInput = z.output<typeof publicProfileFormSchema>;

export type PublicProfessionalCard = z.infer<typeof publicProfessionalCardSchema>;

export type PublicProfessional = z.infer<typeof publicProfessionalSchema>;

export type PublicProfessionalPage = z.infer<typeof publicProfessionalsResponseSchema>;
