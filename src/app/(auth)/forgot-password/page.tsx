import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@/modules/auth/components/forgotPasswordForm';

export const metadata: Metadata = {
  title: 'Recuperar senha | Bom Trato',
  description: 'Recupere o acesso à sua conta no Bom Trato.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
