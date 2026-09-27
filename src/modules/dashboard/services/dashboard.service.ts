import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  dashboardFinancialSchema,
  dashboardFinancialTrendSchema,
  dashboardSummarySchema,
  dashboardUpcomingSchema,
} from '../schemas/dashboard.schema';
import type {
  DashboardData,
  DashboardFinancial,
  DashboardFinancialTrend,
  DashboardSummary,
  DashboardUpcoming,
} from '../types/dashboard.types';

const dashboardFlights = new Map<string, Promise<DashboardData>>();

function currentMonthPeriod(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getTime() + 1000);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function financialTrendPeriod(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

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

async function readFinancialTrend(response: Response): Promise<DashboardFinancialTrend> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar a evolução dos recebimentos.');
  }

  const payload: unknown = await response.json();

  const parsed = dashboardFinancialTrendSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a evolução dos recebimentos.');
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
  const currentPeriod = currentMonthPeriod();

  const trendPeriod = financialTrendPeriod();

  const currentQuery = new URLSearchParams({
    from: currentPeriod.from,
    to: currentPeriod.to,
  });

  const trendQuery = new URLSearchParams({
    from: trendPeriod.from,
    to: trendPeriod.to,
  });

  const organization = encodeURIComponent(organizationId);

  const [summaryResponse, financialResponse, financialTrendResponse, upcomingResponse] = await Promise.all([
    authenticatedFetch(`/api/organizations/${organization}/dashboard/summary?${currentQuery.toString()}`),
    authenticatedFetch(`/api/organizations/${organization}/dashboard/financial?${currentQuery.toString()}`),
    authenticatedFetch(`/api/organizations/${organization}/dashboard/financial-trend?${trendQuery.toString()}`),
    authenticatedFetch(`/api/organizations/${organization}/dashboard/upcoming-work-orders?limit=5`),
  ]);

  const [summary, financial, financialTrend, upcoming] = await Promise.all([
    readSummary(summaryResponse),
    readFinancial(financialResponse),
    readFinancialTrend(financialTrendResponse),
    readUpcoming(upcomingResponse),
  ]);

  return {
    summary,
    financial,
    financialTrend,
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
