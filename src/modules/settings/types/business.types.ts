import type { z } from 'zod';

import type {
  businessProfileFormSchema,
  businessProfileSchema,
  organizationDocumentTypeSchema,
} from '../schemas/business.schema';

export type OrganizationDocumentType = z.infer<typeof organizationDocumentTypeSchema>;

export type BusinessProfile = z.infer<typeof businessProfileSchema>;

export type BusinessProfileInput = z.output<typeof businessProfileFormSchema>;
