'use client';

import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function BillingReturn() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <LoaderCircle className="size-7 animate-spin text-primary" />

      <h1 className="mt-5 text-2xl font-semibold">Confirmando seu pagamento</h1>

      <p className="mt-2 text-sm text-muted-foreground">Aguarde um instante...</p>
    </div>
  );
}
