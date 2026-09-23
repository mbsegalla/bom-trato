import type { Metadata } from 'next';

import { EmailVerification } from '@/modules/auth/components/emailVerification';

export const metadata: Metadata = {
  title: 'Confirmar e-mail',
  description: 'Confirme seu e-mail para continuar no Bom Trato.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailPage() {
  return <EmailVerification />;
}
