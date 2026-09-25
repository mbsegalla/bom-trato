'use client';

import { FilterX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { OrganizationMember } from '@/modules/organizations/types/organization.types';

import type { ScheduleLateFilter, ScheduleStatusFilter } from '../../../types/schedule.types';

interface ScheduleFiltersProps {
  members: OrganizationMember[];
  assignedToId: string;
  status: ScheduleStatusFilter;
  late: ScheduleLateFilter;
  onAssignedToChange(value: string): void;
  onStatusChange(value: ScheduleStatusFilter): void;
  onLateChange(value: ScheduleLateFilter): void;
  onClear(): void;
}

export function ScheduleFilters({
  members,
  assignedToId,
  status,
  late,
  onAssignedToChange,
  onStatusChange,
  onLateChange,
  onClear,
}: ScheduleFiltersProps) {
  const filtered = assignedToId !== 'ALL' || status !== 'ALL' || late !== 'ALL';

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <div className="flex-1">
        <label htmlFor="schedule-assignee" className="mb-2 block text-xs font-medium text-muted-foreground">
          Responsável
        </label>
        <select
          id="schedule-assignee"
          value={assignedToId}
          onChange={(event) => onAssignedToChange(event.target.value)}
          className="h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="ALL">Todos os responsáveis</option>
          {members.map((member) => (
            <option key={member.id} value={member.userId}>
              {member.user.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="schedule-status" className="mb-2 block text-xs font-medium text-muted-foreground">
          Status
        </label>
        <select
          id="schedule-status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ScheduleStatusFilter)}
          className="h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="ALL">Todos os status</option>
          <option value="SCHEDULED">Agendados</option>
          <option value="IN_PROGRESS">Em andamento</option>
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="schedule-late" className="mb-2 block text-xs font-medium text-muted-foreground">
          Situação
        </label>
        <select
          id="schedule-late"
          value={late}
          onChange={(event) => onLateChange(event.target.value as ScheduleLateFilter)}
          className="h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="ALL">Todos</option>
          <option value="LATE">Somente atrasados</option>
          <option value="ON_TIME">Sem atraso</option>
        </select>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={!filtered}
        onClick={onClear}
        className="h-11 cursor-pointer rounded-xl px-4"
      >
        <FilterX aria-hidden="true" className="size-4" />
        Limpar
      </Button>
    </div>
  );
}
