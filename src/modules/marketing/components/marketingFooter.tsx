import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border px-6 py-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          bom trato.
        </Link>

        <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
          <Link href="/termos" className="hover:text-foreground">
            Termos de Uso
          </Link>

          <Link href="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
        </div>

        <Link
          href="/#pricing"
          className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Conhecer os planos
        </Link>
      </div>
    </footer>
  );
}
