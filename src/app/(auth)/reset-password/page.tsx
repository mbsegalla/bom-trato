import type { Metadata } from 'next';

import { ResetPasswordForm } from '@/modules/auth/components/resetPasswordForm';

export const metadata: Metadata = {
  title: 'Criar nova senha | Bom Trato',
  description: 'Crie uma nova senha para sua conta no Bom Trato.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
