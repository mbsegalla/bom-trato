'use client';

import { CalendarClock, LoaderCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionError } from '@/modules/auth/services/session.service';

import {
  workOrderRecurrenceFormSchema,
  workOrderRecurrenceLimits,
  workOrderRecurrenceUnitSchema,
} from '../../schemas/workOrderRecurrence.schema';
import { getWorkOrderRecurrence, saveWorkOrderRecurrence } from '../../services/workOrderRecurrence.service';
import type { WorkOrderRecurrenceUnit, WorkOrderRecurrenceView } from '../../types/workOrderRecurrence.types';

interface WorkOrderRecurrenceSectionProps {
  organizationId: string;
  workOrderId: string;
}

type RecurrenceState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: WorkOrderRecurrenceView }
  | { kind: 'error'; message: string };

const intervalOptions = [
  { value: 'DAY', label: 'Dias' },
  { value: 'WEEK', label: 'Semanas' },
  { value: 'MONTH', label: 'Meses' },
] satisfies { value: WorkOrderRecurrenceUnit; label: string }[];

export function WorkOrderRecurrenceSection({ organizationId, workOrderId }: WorkOrderRecurrenceSectionProps) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);

  const [state, setState] = useState<RecurrenceState>({ kind: 'loading' });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [intervalUnit, setIntervalUnit] = useState<WorkOrderRecurrenceUnit>('MONTH');
  const [intervalCount, setIntervalCount] = useState('1');
  const [nextVisitOn, setNextVisitOn] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void getWorkOrderRecurrence(organizationId, workOrderId)
      .then((data) => {
        if (!active) {
          return;
        }

        setState({ kind: 'ready', data });
        setIntervalUnit(data.recurrence?.intervalUnit ?? 'MONTH');
        setIntervalCount(String(data.recurrence?.intervalCount ?? 1));
        setNextVisitOn(data.recurrence?.nextVisitOn ?? '');
        setEnabled(data.recurrence?.enabled ?? true);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setState({
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar a recorrência.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, refreshVersion, router, workOrderId]);

  function refresh(): void {
    if (submittingRef.current) {
      return;
    }

    setState({ kind: 'loading' });
    setRefreshVersion((value) => value + 1);
  }

  async function handleSave(): Promise<void> {
    if (state.kind !== 'ready' || !state.data.canConfigure || submittingRef.current) {
      return;
    }

    const data = state.data;
    const parsed = workOrderRecurrenceFormSchema.safeParse({
      intervalUnit,
      intervalCount: Number(intervalCount),
      nextVisitOn,
      enabled,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Confira a frequência e a data da visita.');
      return;
    }

    if ((data.completedOn !== null && nextVisitOn < data.completedOn) || (enabled && nextVisitOn < data.today)) {
      toast.error('Informe uma próxima visita a partir da data mínima indicada.');
      return;
    }

    if (enabled && data.customerArchived) {
      toast.error('Não é possível ativar a recorrência de um cliente arquivado.');
      return;
    }

    submittingRef.current = true;
    setSaving(true);

    try {
      const version = data.recurrence?.version ?? 0;
      const saved = await saveWorkOrderRecurrence(organizationId, workOrderId, version, parsed.data);

      if (!mountedRef.current) {
        return;
      }

      if (saved.recurrence === null || saved.recurrence.version !== version + 1) {
        throw new Error('Não foi possível confirmar a configuração salva.');
      }

      setState({ kind: 'ready', data: saved });
      setIntervalUnit(saved.recurrence.intervalUnit);
      setIntervalCount(String(saved.recurrence.intervalCount));
      setNextVisitOn(saved.recurrence.nextVisitOn);
      setEnabled(saved.recurrence.enabled);
      toast.success(saved.recurrence.enabled ? 'Recorrência salva.' : 'Recorrência pausada.');
    } catch (cause: unknown) {
      if (!mountedRef.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      toast.error(cause instanceof Error ? cause.message : 'Não foi possível confirmar a configuração salva.');
      setState({
        kind: 'error',
        message: 'Atualize a recorrência para consultar a configuração atual antes de tentar novamente.',
      });
    } finally {
      submittingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  }

  const data = state.kind === 'ready' ? state.data : null;
  const disabled = saving || !data?.canConfigure;
  const minVisitOn =
    data?.completedOn && (!enabled || data.completedOn > data.today) ? data.completedOn : data?.today;
  const overdue = data?.recurrence?.enabled && data.recurrence.nextVisitOn < data.today;

  return (
    <section id="recurrence" className="min-w-0 scroll-mt-8 border-t border-border pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <CalendarClock aria-hidden="true" className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Serviço recorrente</h2>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Defina a frequência e a próxima visita prevista deste serviço. Nenhum orçamento, agendamento ou cobrança
            será criado automaticamente nesta etapa.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={saving || state.kind === 'loading'}
          onClick={refresh}
          className="min-h-11 cursor-pointer"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar
        </Button>
      </div>

      {state.kind === 'loading' && (
        <p role="status" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Consultando recorrência...
        </p>
      )}

      {state.kind === 'error' && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      {data !== null && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium">
              {data.recurrence === null
                ? 'Recorrência não configurada'
                : data.recurrence.enabled
                  ? 'Recorrência ativa'
                  : 'Recorrência pausada'}
            </p>
            {overdue && <span className="text-xs font-medium text-destructive">Próxima visita em atraso</span>}
          </div>

          {data.customerArchived && (
            <p className="mt-4 text-sm text-muted-foreground">
              O cliente está arquivado. A recorrência não pode ser ativada; uma configuração existente pode ser pausada.
            </p>
          )}

          {!data.canConfigure && !data.customerArchived && (
            <p className="mt-4 text-sm text-muted-foreground">
              As configurações estão disponíveis apenas para consulta.
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="recurrence-count">A cada</Label>
              <Input
                id="recurrence-count"
                type="number"
                min={1}
                max={workOrderRecurrenceLimits[intervalUnit]}
                step={1}
                value={intervalCount}
                disabled={disabled}
                onChange={(event) => setIntervalCount(event.currentTarget.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence-unit">Periodicidade</Label>
              <Select
                items={intervalOptions}
                value={intervalUnit}
                disabled={disabled}
                onValueChange={(value) => {
                  const parsed = workOrderRecurrenceUnitSchema.safeParse(value);

                  if (parsed.success) {
                    setIntervalUnit(parsed.data);
                  }
                }}
              >
                <SelectTrigger id="recurrence-unit" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {intervalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence-next-visit">Próxima visita prevista</Label>
              <DatePicker
                id="recurrence-next-visit"
                name="nextVisitOn"
                value={nextVisitOn}
                disabled={disabled}
                min={minVisitOn ? new Date(`${minVisitOn}T00:00:00`) : undefined}
                onValueChange={setNextVisitOn}
                placeholder="Selecione a data"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <label className="mt-5 flex min-h-10 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              disabled={disabled || (data.customerArchived && !enabled)}
              onChange={(event) => setEnabled(event.currentTarget.checked)}
              className="size-4 accent-primary"
            />
            Manter recorrência ativa
          </label>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Desmarque para pausar sem perder a frequência e a data registradas. A data de referência segue o horário de
            Brasília.
          </p>

          {data.canConfigure && (
            <Button
              type="button"
              disabled={saving || (data.customerArchived && enabled)}
              onClick={() => void handleSave()}
              className="mt-5 min-h-11 cursor-pointer"
            >
              {saving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              Salvar recorrência
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
