import { Button } from '@/components/ui/button';

export function ActivePlanChangeNotice({ onContinue }: { onContinue(): void }) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-brand-muted p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">Alteração de plano em andamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Existe uma alteração que ainda precisa ser concluída ou acompanhada.
          </p>
        </div>
        <Button type="button" onClick={onContinue} className="cursor-pointer">
          Continuar
        </Button>
      </div>
    </section>
  );
}
