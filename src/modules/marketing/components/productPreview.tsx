import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardCheck,
  FilePenLine,
  LayoutDashboard,
  ReceiptText,
  Users,
} from 'lucide-react';

import { BrandLogo } from '@/components/brandLogo';

const navigation = [
  {
    icon: LayoutDashboard,
    label: 'Visão geral',
    active: true,
  },
  {
    icon: Users,
    label: 'Clientes',
    active: false,
  },
  {
    icon: FilePenLine,
    label: 'Orçamentos',
    active: false,
  },
  {
    icon: ClipboardCheck,
    label: 'Ordens',
    active: false,
  },
];

export function ProductPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-2xl">
      <div aria-hidden="true" className="absolute -inset-4 rounded-[3rem] bg-primary/10 blur-sm sm:-inset-8" />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl shadow-brand/10">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-4 py-3">
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/50" />
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/35" />
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/20" />

          <span className="ml-3 truncate text-xs text-muted-foreground">app.bomtrato.com.br</span>
        </div>

        <div className="grid sm:grid-cols-[9.75rem_1fr]">
          <aside className="hidden border-r border-border bg-muted/15 p-4 sm:block">
            <BrandLogo alt="" className="w-24" />

            <nav aria-label="Prévia da navegação" className="mt-7">
              <ul className="space-y-1">
                {navigation.map(({ icon: Icon, label, active }) => (
                  <li key={label}>
                    <div
                      className={
                        active
                          ? 'flex items-center gap-2.5 rounded-lg bg-secondary px-2.5 py-2 text-xs font-medium text-secondary-foreground'
                          : 'flex items-center gap-2.5 px-2.5 py-2 text-xs text-muted-foreground'
                      }
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        <Icon aria-hidden="true" className="size-4" strokeWidth={1.7} />
                      </span>

                      <span className="whitespace-nowrap">{label}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0 p-4 sm:p-5">
            <div>
              <p className="text-xs text-muted-foreground">Marco Serviços</p>

              <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight">Visão geral</h2>
            </div>

            <div className="mt-5 grid grid-cols-3 border-y border-border">
              <div className="py-3 pr-2">
                <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">Recebido no mês</p>

                <p className="mt-1 text-sm font-semibold tracking-tight text-primary sm:text-base">R$ 3.450</p>
              </div>

              <div className="border-l border-border px-2 py-3 sm:px-3">
                <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">A receber</p>

                <p className="mt-1 text-sm font-semibold tracking-tight text-primary sm:text-base">R$ 1.200</p>
              </div>

              <div className="border-l border-border py-3 pl-2 sm:pl-3">
                <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">Em andamento</p>

                <p className="mt-1 text-sm font-semibold tracking-tight sm:text-base">2</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <CalendarDays aria-hidden="true" className="size-4 text-primary" />

                  <p className="text-xs font-semibold">Próximos agendamentos</p>
                </div>

                <div className="grid grid-cols-[3rem_1fr] gap-3 py-3">
                  <div>
                    <p className="text-xs font-semibold">09:00</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Amanhã</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">Instalação elétrica</p>

                    <p className="mt-1 truncate text-[10px] text-muted-foreground">Cliente Almeida</p>
                  </div>
                </div>

                <div className="grid grid-cols-[3rem_1fr] gap-3 border-t border-border py-3">
                  <div>
                    <p className="text-xs font-semibold">14:30</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Amanhã</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">Manutenção preventiva</p>

                    <p className="mt-1 truncate text-[10px] text-muted-foreground">Comercial Silva</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <AlertTriangle aria-hidden="true" className="size-4 text-warning" />

                  <p className="text-xs font-semibold">Precisa da sua atenção</p>
                </div>

                <div className="py-3">
                  <p className="text-xs font-medium">2 orçamentos aguardando resposta</p>

                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    Acompanhe o retorno dos clientes.
                  </p>
                </div>

                <div className="border-t border-border py-3">
                  <p className="text-xs font-medium">1 recebível em aberto</p>

                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">R$ 1.200,00 pendente.</p>
                </div>
              </section>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
              <div className="flex min-w-0 items-center gap-2">
                <ReceiptText aria-hidden="true" className="size-4 shrink-0 text-primary" />

                <p className="truncate text-xs text-muted-foreground">
                  Atendimento, execução e financeiro no mesmo fluxo.
                </p>
              </div>

              <span className="hidden shrink-0 text-[10px] font-medium text-primary sm:block">Atualizado agora</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative -mt-3 ml-auto flex w-fit max-w-[90%] items-center gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg shadow-brand/10 sm:-mr-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-surface text-success">
          <Check aria-hidden="true" className="size-5" />
        </span>

        <div>
          <p className="text-sm font-semibold">Orçamento aprovado.</p>

          <p className="mt-1 text-xs text-muted-foreground">A ordem de serviço já pode seguir com o mesmo contexto.</p>
        </div>
      </div>

      <figcaption className="relative mt-4 text-center text-xs text-muted-foreground">
        Prévia ilustrativa baseada na interface do Bom Trato.
      </figcaption>
    </figure>
  );
}
