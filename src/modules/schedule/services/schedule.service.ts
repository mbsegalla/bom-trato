import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { scheduleResponseSchema } from '../schemas/schedule.schema';
import type { ScheduleData, ScheduleFilters, ScheduleItem, ScheduleRange } from '../types/schedule.types';

const PAGE_LIMIT = 100;
const MAX_RANGE_MS = 31 * 24 * 60 * 60 * 1000;

const scheduleFlights = new Map<string, Promise<ScheduleData>>();

function schedulePath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/work-orders/schedule`;
}

function getScheduleErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'O período selecionado não é válido.';

    case 403:
      return 'Você não tem permissão para visualizar esta agenda.';

    case 503:
      return 'A agenda está sendo atualizada. Tente novamente em instantes.';

    default:
      return 'Não foi possível carregar os agendamentos.';
  }
}

function splitRange(range: ScheduleRange): ScheduleRange[] {
  const start = range.from.getTime();
  const end = range.to.getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    throw new Error('O período da agenda é inválido.');
  }

  const ranges: ScheduleRange[] = [];

  let cursor = start;

  while (cursor < end) {
    const next = Math.min(cursor + MAX_RANGE_MS, end);

    ranges.push({
      from: new Date(cursor),
      to: new Date(next),
    });

    cursor = next;
  }

  return ranges;
}

async function requestScheduleChunk(
  organizationId: string,
  range: ScheduleRange,
  filters: ScheduleFilters,
): Promise<ScheduleData> {
  const items: ScheduleItem[] = [];

  let page = 1;
  let hasMore = true;
  let generatedAt: Date | null = null;

  while (hasMore) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    });

    if (filters.assignedToId !== null) {
      query.set('assignedToId', filters.assignedToId);
    }

    if (filters.status !== 'ALL') {
      query.set('status', filters.status);
    }

    if (filters.late === 'LATE') {
      query.set('late', 'true');
    }

    if (filters.late === 'ON_TIME') {
      query.set('late', 'false');
    }

    const response = await authenticatedFetch(`${schedulePath(organizationId)}?${query.toString()}`);

    if (response.status === 401) {
      throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
    }

    if (!response.ok) {
      throw new Error(getScheduleErrorMessage(response.status));
    }

    const payload: unknown = await response.json();

    const parsed = scheduleResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new Error('Não foi possível interpretar os dados da agenda.');
    }

    items.push(...parsed.data.items);

    generatedAt = parsed.data.generatedAt;
    hasMore = parsed.data.hasMore;
    page += 1;
  }

  return {
    items,
    generatedAt: generatedAt ?? new Date(),
    from: range.from,
    to: range.to,
  };
}

async function requestSchedule(
  organizationId: string,
  range: ScheduleRange,
  filters: ScheduleFilters,
): Promise<ScheduleData> {
  const ranges = splitRange(range);

  const responses = await Promise.all(
    ranges.map((currentRange) => requestScheduleChunk(organizationId, currentRange, filters)),
  );

  const items = new Map<string, ScheduleItem>();

  let generatedAt = new Date(0);

  for (const response of responses) {
    for (const item of response.items) {
      items.set(item.id, item);
    }

    if (response.generatedAt > generatedAt) {
      generatedAt = response.generatedAt;
    }
  }

  return {
    items: [...items.values()].sort(
      (left, right) => left.scheduledStartAt.getTime() - right.scheduledStartAt.getTime(),
    ),
    generatedAt,
    from: range.from,
    to: range.to,
  };
}

export function listSchedule(
  organizationId: string,
  range: ScheduleRange,
  filters: ScheduleFilters,
): Promise<ScheduleData> {
  const key = [
    organizationId,
    range.from.toISOString(),
    range.to.toISOString(),
    filters.assignedToId ?? 'ALL',
    filters.status,
    filters.late,
  ].join(':');

  const existing = scheduleFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestSchedule(organizationId, range, filters);

  scheduleFlights.set(key, request);

  const cleanup = () => {
    if (scheduleFlights.get(key) === request) {
      scheduleFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}
