import type { Metadata } from 'next';

import { BillingOperationReturn } from '@/modules/settings/components/billingOperationReturn';
import { billingReturnParamsSchema } from '@/modules/settings/schemas/billing.schema';

export const metadata: Metadata = {
  title: 'Confirmando faturamento',
  robots: {
    index: false,
    follow: false,
  },
};

interface BillingReturnPageProps {
  searchParams: Promise<{
    organizationId?: string;
    operationId?: string;
    kind?: string;
  }>;
}

export default async function BillingReturnPage({ searchParams }: BillingReturnPageProps) {
  const params = await searchParams;

  const parsed = billingReturnParamsSchema.safeParse(params);

  if (!parsed.success) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="font-heading text-2xl font-semibold">Retorno inválido</h1>

        <p className="mt-3 text-sm text-muted-foreground">Não foi possível identificar a operação de cobrança.</p>
      </div>
    );
  }

  return (
    <BillingOperationReturn
      organizationId={parsed.data.organizationId}
      operationId={parsed.data.operationId}
      kind={parsed.data.kind}
    />
  );
}
