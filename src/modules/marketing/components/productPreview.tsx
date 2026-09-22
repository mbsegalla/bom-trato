import { Check, FileText, Users, Wallet } from 'lucide-react';

const metrics = [
  { icon: Users, label: 'Clientes', value: '24' },
  { icon: FileText, label: 'Orçamentos', value: '12' },
  { icon: Wallet, label: 'Recebido', value: 'R$ 8.230' },
];

const quotes = [
  {
    customer: 'Marco Lorenzo',
    service: 'Manutenção elétrica',
    amount: 'R$ 1.200',
    status: 'Aprovado',
  },
  {
    customer: 'Dayane Caetano',
    service: 'Fotográfia de casamento',
    amount: 'R$ 2.350',
    status: 'Enviado',
  },
  {
    customer: 'Marcelo Oliveira',
    service: 'Reforma do banheiro',
    amount: 'R$ 1.800',
    status: 'Rascunho',
  },
];

export function ProductPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-xl">
      <div aria-hidden="true" className="absolute -inset-4 rounded-[3rem] bg-primary/10 sm:-inset-8" />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl shadow-brand/10 lg:-rotate-2">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-4 py-3">
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/50" />
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/35" />
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/20" />

          <span className="ml-3 text-xs text-muted-foreground">bom trato. / visão geral</span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-semibold tracking-tight">Olá, Marco!</p>
              <p className="mt-1 text-xs text-muted-foreground">Seu negócio, com tudo no lugar.</p>
            </div>

            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              JS
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {metrics.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl bg-muted/60 p-2.5 sm:p-4">
                <Icon aria-hidden="true" className="mb-3 size-4 text-primary" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums sm:text-xl">{value}</p>
              </div>
            ))}
          </div>

          <p className="mt-7 mb-3 text-sm font-semibold">Últimos orçamentos</p>

          <ul className="divide-y divide-border">
            {quotes.map((quote) => (
              <li key={quote.customer} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium sm:text-sm">{quote.customer}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{quote.service}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold tabular-nums">{quote.amount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{quote.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative -mt-2 ml-auto flex w-fit max-w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg shadow-brand/10 sm:-mr-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-surface text-success">
          <Check aria-hidden="true" className="size-5" />
        </span>

        <div>
          <p className="text-sm font-semibold">Mais um bom trato fechado.</p>
          <p className="mt-1 text-xs text-muted-foreground">Orçamento aprovado</p>
        </div>
      </div>

      <figcaption className="relative mt-4 text-center text-xs text-muted-foreground">
        Prévia ilustrativa com dados demonstrativos.
      </figcaption>
    </figure>
  );
}
