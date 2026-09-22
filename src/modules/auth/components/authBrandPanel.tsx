import { CalendarDays, ChartNoAxesCombined, Check, FileText, Users } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Clientes',
    description: 'sempre por perto',
  },
  {
    icon: FileText,
    title: 'Orçamentos',
    description: 'que viram serviços',
  },
  {
    icon: CalendarDays,
    title: 'Atendimentos',
    description: 'organizados',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Recebimentos',
    description: 'no controle',
  },
];

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden flex-col overflow-hidden bg-brand text-brand-foreground lg:flex">
      <div className="relative flex flex-1 flex-col px-10 pt-10 xl:px-14 xl:pt-12">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-lg bg-brand-foreground text-2xl font-bold tracking-tighter text-brand"
            >
              bt
            </span>

            <span className="text-3xl font-semibold tracking-tight">
              bom trato<span className="text-brand-muted">.</span>
            </span>
          </div>

          <p className="hidden text-right text-xs leading-relaxed tracking-widest text-brand-muted xl:block">
            PEQUENOS NEGÓCIOS
            <br />
            GRANDES CONQUISTAS
          </p>
        </div>

        <div className="mt-14 max-w-lg">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
            Seu trabalho
            <br />
            bem feito.
            <br />
            Seu negócio
            <br />
            bem cuidado.
          </h2>

          <p className="mt-5 max-w-sm text-lg leading-relaxed text-brand-muted">
            Clientes, orçamentos e serviços em um só lugar.
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm rounded-2xl border border-brand-foreground/15 bg-brand-foreground/5 p-5">
            <p className="text-sm text-brand-muted">Seu próximo bom trato</p>

            <div className="mt-5 rounded-xl bg-card p-5 text-card-foreground">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-surface text-success">
                  <Check aria-hidden="true" className="size-5" />
                </span>

                <div>
                  <p className="text-sm font-semibold">Orçamento aprovado</p>

                  <p className="mt-1 text-xs text-muted-foreground">Tudo pronto para começar.</p>
                </div>
              </div>

              <div aria-hidden="true" className="mt-5 space-y-2">
                <div className="h-2 w-4/5 rounded-full bg-muted" />
                <div className="h-2 w-3/5 rounded-full bg-muted" />
                <div className="h-2 w-2/5 rounded-full bg-muted" />
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-brand-muted">
              Mais organização para fazer o que você faz de melhor.
            </p>
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-4 border-t border-brand-foreground/15 px-6 py-8 xl:px-10">
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title} className="px-3 not-first:border-l not-first:border-brand-foreground/15">
            <Icon aria-hidden="true" className="mb-3 size-5 text-brand-muted" strokeWidth={1.5} />

            <p className="text-xs font-medium">{title}</p>

            <p className="mt-1 text-xs leading-relaxed text-brand-muted">{description}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
