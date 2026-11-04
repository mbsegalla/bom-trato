import type { z } from 'zod';

import type {
  automationSettingsFormSchema,
  businessProfileFormSchema,
  businessProfileSchema,
  organizationDocumentTypeSchema,
} from '../schemas/business.schema';

export type OrganizationDocumentType = z.infer<typeof organizationDocumentTypeSchema>;
export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export type BusinessProfileInput = z.output<typeof businessProfileFormSchema>;
export type AutomationSettingsInput = z.output<typeof automationSettingsFormSchema>;
export type BusinessProfileUpdateInput = Partial<BusinessProfileInput & AutomationSettingsInput>;
