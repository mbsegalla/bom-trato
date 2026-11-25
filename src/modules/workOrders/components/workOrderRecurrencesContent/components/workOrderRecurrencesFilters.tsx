import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  workOrderRecurrenceListStatusSchema,
  workOrderRecurrenceVisitPeriodSchema,
} from '../../../schemas/workOrderRecurrence.schema';
import type {
  WorkOrderRecurrenceListStatus,
  WorkOrderRecurrenceVisitPeriod,
} from '../../../types/workOrderRecurrence.types';

const statusOptions = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'ACTIVE', label: 'Ativas' },
  { value: 'PAUSED', label: 'Pausadas' },
  { value: 'ARCHIVED', label: 'Clientes arquivados' },
] satisfies { value: WorkOrderRecurrenceListStatus; label: string }[];

const visitOptions = [
  { value: 'ALL', label: 'Todas as datas' },
  { value: 'OVERDUE', label: 'Datas vencidas' },
  { value: 'TODAY', label: 'Hoje' },
  { value: 'NEXT_SEVEN_DAYS', label: 'Hoje e próximos 7 dias' },
] satisfies { value: WorkOrderRecurrenceVisitPeriod; label: string }[];

interface WorkOrderRecurrencesFiltersProps {
  status: WorkOrderRecurrenceListStatus;
  visit: WorkOrderRecurrenceVisitPeriod;
  onStatusChange: (status: WorkOrderRecurrenceListStatus) => void;
  onVisitChange: (visit: WorkOrderRecurrenceVisitPeriod) => void;
  onCustomerNameChange: (name: string) => void;
  onClear: () => void;
}

export function WorkOrderRecurrencesFilters({
  status,
  visit,
  onStatusChange,
  onVisitChange,
  onCustomerNameChange,
  onClear,
}: WorkOrderRecurrencesFiltersProps) {
  const [customerName, setCustomerName] = useState('');

  return (
    <form
      className="grid gap-4 border-y border-border py-4 sm:grid-cols-2 xl:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        onCustomerNameChange(customerName.trim());
      }}
    >
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="recurrences-customer">Cliente</Label>
        <div className="flex gap-2">
          <Input
            id="recurrences-customer"
            value={customerName}
            maxLength={100}
            placeholder="Buscar pelo nome do cliente"
            onChange={(event) => setCustomerName(event.currentTarget.value)}
            className="h-11 rounded-xl"
          />
          <Button type="submit" variant="outline" className="min-h-11 cursor-pointer">
            Buscar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurrences-status">Status</Label>
        <Select
          items={statusOptions}
          value={status}
          onValueChange={(value) => {
            const parsed = workOrderRecurrenceListStatusSchema.safeParse(value);

            if (parsed.success) {
              onStatusChange(parsed.data);
            }
          }}
        >
          <SelectTrigger id="recurrences-status" className="h-11 w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurrences-visit">Próxima visita</Label>
        <Select
          items={visitOptions}
          value={visit}
          onValueChange={(value) => {
            const parsed = workOrderRecurrenceVisitPeriodSchema.safeParse(value);

            if (parsed.success) {
              onVisitChange(parsed.data);
            }
          }}
        >
          <SelectTrigger id="recurrences-visit" className="h-11 w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {visitOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setCustomerName('');
          onClear();
        }}
        className="w-fit cursor-pointer"
      >
        Limpar filtros
      </Button>
    </form>
  );
}
