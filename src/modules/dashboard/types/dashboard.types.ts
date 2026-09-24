import type { z } from 'zod';

import type {
  dashboardFinancialSchema,
  dashboardSummarySchema,
  dashboardUpcomingSchema,
} from '../schemas/dashboard.schema';

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

export type DashboardFinancial = z.infer<typeof dashboardFinancialSchema>;

export type DashboardUpcoming = z.infer<typeof dashboardUpcomingSchema>;

export interface DashboardData {
  summary: DashboardSummary;
  financial: DashboardFinancial;
  upcoming: DashboardUpcoming;
}
