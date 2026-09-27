import type { z } from 'zod';

import type {
  dashboardFinancialSchema,
  dashboardFinancialTrendSchema,
  dashboardSummarySchema,
  dashboardUpcomingSchema,
} from '../schemas/dashboard.schema';

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

export type DashboardFinancial = z.infer<typeof dashboardFinancialSchema>;

export type DashboardFinancialTrend = z.infer<typeof dashboardFinancialTrendSchema>;

export type DashboardUpcoming = z.infer<typeof dashboardUpcomingSchema>;

export interface DashboardData {
  summary: DashboardSummary;
  financial: DashboardFinancial;
  financialTrend: DashboardFinancialTrend;
  upcoming: DashboardUpcoming;
}
