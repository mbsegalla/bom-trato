import type { z } from 'zod';

import type {
  managementPortfolioStatusSchema,
  portalPortfolioStatusSchema,
  portfolioConsentFormSchema,
} from '../schemas/workOrderPortfolio.schema';

export type PortalPortfolioStatus = z.infer<typeof portalPortfolioStatusSchema>;
export type ManagementPortfolioStatus = z.infer<typeof managementPortfolioStatusSchema>;
export type PortfolioConsentInput = z.infer<typeof portfolioConsentFormSchema>;
