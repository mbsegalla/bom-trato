import type { Metadata } from 'next';

import { AuthPageHeader } from '@/modules/auth/components/authPageHeader';
import { LoginForm } from '@/modules/auth/components/loginForm';

export const metadata: Metadata = {
  title: 'Entrar | Bom Trato',
  description: 'Acesse sua conta no Bom Trato.',
};

export default function LoginPage() {
  return (
    <>
      <AuthPageHeader
        eyebrow="Bem-vindo de volta"
        title="Entre no seu espaço"
        description="Vamos cuidar dos próximos bons tratos?"
      />

      <div className="mt-8">
        <LoginForm />
      </div>
    </>
  );
}
