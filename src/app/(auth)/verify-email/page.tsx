import type { Metadata } from 'next';

import { EmailVerification } from '@/modules/auth/components/emailVerification';

export const metadata: Metadata = {
  title: 'Confirmar e-mail | Bom Trato',
  description: 'Confirme seu e-mail para continuar no Bom Trato.',
  robots: {
    index: false,
    follow: false,
  },
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ planPriceId?: string | string[] }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { planPriceId } = await searchParams;

  return <EmailVerification planPriceId={typeof planPriceId === 'string' ? planPriceId : undefined} />;
}
