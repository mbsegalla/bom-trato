import { CalendarDays, Clock3, UserRound } from 'lucide-react';

import { OrganizationLogo } from '@/modules/organizations/components/organizationLogo';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { publicWorkOrderStatusContent } from '../../../constants/workOrderPortal.constants';
import type { PublicWorkOrder } from '../../../types/workOrderPortal.types';

interface PublicWorkOrderOverviewProps {
  portal: PublicWorkOrder;
}

export function PublicWorkOrderOverview({ portal }: PublicWorkOrderOverviewProps) {
  const { organization, workOrder } = portal;

  const content = publicWorkOrderStatusContent[workOrder.status];

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="public-work-order-title"
        className="relative isolate overflow-hidden rounded-3xl bg-brand p-6 text-brand-foreground sm:p-10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-32 size-96 rounded-full border border-brand-foreground/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -bottom-48 size-96 rounded-full bg-brand-foreground/5"
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <OrganizationLogo
              name={organization.name}
              logoUrl={organization.logoUrl}
              variant="store"
              className="size-14 rounded-2xl"
            />

            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold wrap-break-word">{organization.name}</p>

              <p className="mt-1 text-xs tracking-wide text-brand-muted uppercase">Portal de acompanhamento</p>
            </div>
          </div>

          <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-brand-foreground/15 bg-brand-foreground/10 px-3 py-2 text-xs font-semibold">
            <Clock3 aria-hidden="true" className="size-4" />

            {content.label}
          </div>

          <h1
            id="public-work-order-title"
            className="mt-5 max-w-2xl font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"
          >
            {content.title}
          </h1>

          <p className="mt-4 max-w-xl leading-relaxed text-brand-muted">{content.description}</p>

          <div className="mt-8 border-t border-brand-foreground/15 pt-6">
            <p className="text-xs font-medium text-brand-muted uppercase">Seu atendimento</p>

            <p className="mt-2 text-lg font-semibold wrap-break-word">{workOrder.title}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays aria-hidden="true" className="size-5" />
          </div>

          <h2 className="mt-4 text-sm text-muted-foreground">
            {workOrder.status === 'SCHEDULED' ? 'Próximo atendimento' : 'Agendamento registrado'}
          </h2>

          <p className="mt-2 font-heading text-lg font-semibold">
            {formatDateTime(workOrder.scheduledStartAt, 'Ainda não definido')}
          </p>

          {workOrder.scheduledEndAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              Término previsto: {formatDateTime(workOrder.scheduledEndAt)}
            </p>
          )}

          {workOrder.status === 'CANCELED' && (
            <p className="mt-3 text-xs text-muted-foreground">O agendamento acima pertence ao atendimento cancelado.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRound aria-hidden="true" className="size-5" />
          </div>

          <h2 className="mt-4 text-sm text-muted-foreground">Profissional responsável</h2>

          <p className="mt-2 font-heading text-lg font-semibold">{workOrder.responsibleName ?? 'Ainda não definido'}</p>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Responsável registrado pelo prestador de serviços.
          </p>
        </section>
      </div>
    </div>
  );
}
