interface PublicQuoteUnavailableProps {
  message: string;
}

export function PublicQuoteUnavailable({ message }: PublicQuoteUnavailableProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-brand-foreground">
          bt
        </div>

        <h1 className="mt-6 font-heading text-2xl font-semibold">Este orçamento não está disponível</h1>

        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
