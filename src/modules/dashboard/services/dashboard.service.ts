import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { dashboardFinancialSchema, dashboardSummarySchema, dashboardUpcomingSchema } from '../schemas/dashboard.schema';
import type { DashboardData, DashboardFinancial, DashboardSummary, DashboardUpcoming } from '../types/dashboard.types';

const dashboardFlights = new Map<string, Promise<DashboardData>>();

function currentMonthPeriod(): {
  from: string;
  to: string;
} {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getTime() + 1000);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

async function readSummary(response: Response): Promise<DashboardSummary> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar o resumo da sua operação.');
  }

  const payload: unknown = await response.json();

  const parsed = dashboardSummarySchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o resumo da sua operação.');
  }

  return parsed.data;
}

async function readFinancial(response: Response): Promise<DashboardFinancial> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar os dados financeiros.');
  }

  const payload: unknown = await response.json();

  const parsed = dashboardFinancialSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados financeiros.');
  }

  return parsed.data;
}

async function readUpcoming(response: Response): Promise<DashboardUpcoming> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar os próximos agendamentos.');
  }

  const payload: unknown = await response.json();

  const parsed = dashboardUpcomingSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os próximos agendamentos.');
  }

  return parsed.data;
}

async function requestDashboard(organizationId: string): Promise<DashboardData> {
  const period = currentMonthPeriod();

  const query = new URLSearchParams({
    from: period.from,
    to: period.to,
  });

  const organization = encodeURIComponent(organizationId);

  const [summaryResponse, financialResponse, upcomingResponse] = await Promise.all([
    authenticatedFetch(`/api/organizations/${organization}/dashboard/summary?${query.toString()}`),
    authenticatedFetch(`/api/organizations/${organization}/dashboard/financial?${query.toString()}`),
    authenticatedFetch(`/api/organizations/${organization}/dashboard/upcoming-work-orders?limit=5`),
  ]);

  const [summary, financial, upcoming] = await Promise.all([
    readSummary(summaryResponse),
    readFinancial(financialResponse),
    readUpcoming(upcomingResponse),
  ]);

  return {
    summary,
    financial,
    upcoming,
  };
}

export function getDashboard(organizationId: string): Promise<DashboardData> {
  const existing = dashboardFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestDashboard(organizationId);

  dashboardFlights.set(organizationId, request);

  const cleanup = () => {
    if (dashboardFlights.get(organizationId) === request) {
      dashboardFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}
