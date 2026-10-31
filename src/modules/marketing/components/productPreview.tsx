import { CalendarCheck2, Check, ClipboardCheck, FileText, ReceiptText } from 'lucide-react';

const activities = [
  {
    icon: FileText,
    title: 'Orçamento aprovado',
    description: 'Instalação elétrica',
    status: 'Aprovado',
    statusClassName: 'bg-success-surface text-success',
  },
  {
    icon: ClipboardCheck,
    title: 'Ordem de serviço',
    description: 'Amanhã, 09:00',
    status: 'Agendada',
    statusClassName: 'bg-info-surface text-info',
  },
  {
    icon: ReceiptText,
    title: 'Recebível',
    description: 'R$ 1.200,00',
    status: 'Em aberto',
    statusClassName: 'bg-warning-surface text-warning',
  },
];

export function ProductPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-xl">
      <div aria-hidden="true" className="absolute -inset-4 rounded-[3rem] bg-primary/10 sm:-inset-8" />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl shadow-brand/10">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/50" />
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/35" />
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/20" />

          <span className="ml-3 text-xs text-muted-foreground">Marco Serviços / Visão geral</span>
        </div>

        <div className="p-4 sm:p-6">
          <div>
            <p className="text-xl font-semibold tracking-tight">Seu dia, mais organizado.</p>
            <p className="mt-1 text-xs text-muted-foreground">Acompanhe o trabalho e os próximos passos.</p>
          </div>

          <div className="mt-6 grid grid-cols-3 border-y border-border">
            <div className="py-4 pr-3">
              <p className="text-xs text-muted-foreground">A receber</p>
              <p className="mt-1 text-sm font-semibold text-primary sm:text-lg">R$ 1.200</p>
            </div>

            <div className="border-l border-border px-3 py-4">
              <p className="text-xs text-muted-foreground">Agendados</p>
              <p className="mt-1 text-sm font-semibold sm:text-lg">1</p>
            </div>

            <div className="border-l border-border py-4 pl-3">
              <p className="text-xs text-muted-foreground">Em andamento</p>
              <p className="mt-1 text-sm font-semibold sm:text-lg">0</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Próximos passos</p>
              <p className="mt-1 text-xs text-muted-foreground">Um atendimento seguindo o fluxo.</p>
            </div>

            <CalendarCheck2 aria-hidden="true" className="size-5 text-primary" />
          </div>

          <ul className="mt-3 divide-y divide-border">
            {activities.map(({ icon: Icon, title, description, status, statusClassName }) => (
              <li key={title} className="flex items-center gap-3 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon aria-hidden="true" className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{description}</p>
                </div>

                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName}`}>
                  {status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative -mt-3 ml-auto flex w-fit max-w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg shadow-brand/10 sm:-mr-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-surface text-success">
          <Check aria-hidden="true" className="size-5" />
        </span>

        <div>
          <p className="text-sm font-semibold">Próximo passo preparado.</p>
          <p className="mt-1 text-xs text-muted-foreground">Orçamento aprovado → ordem de serviço</p>
        </div>
      </div>

      <figcaption className="relative mt-4 text-center text-xs text-muted-foreground">
        Prévia ilustrativa com dados demonstrativos.
      </figcaption>
    </figure>
  );
}
