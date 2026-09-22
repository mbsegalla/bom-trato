import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RegisterFormSkeleton } from '@/modules/auth/components/registerFormSkeleton';
import { RegistrationContent } from '@/modules/auth/components/registrationContent';

export const metadata: Metadata = {
  title: 'Criar conta | Bom Trato',
  description: 'Crie sua conta no Bom Trato e organize a rotina do seu negócio.',
};

interface RegisterPageProps {
  searchParams: Promise<{ planPriceId?: string | string[] }>;
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <Suspense fallback={<RegisterFormSkeleton />}>
      <RegistrationContent searchParams={searchParams} />
    </Suspense>
  );
}
