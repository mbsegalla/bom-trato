import type { Metadata } from 'next';

import { LoginForm } from '@/modules/auth/components/loginForm';

export const metadata: Metadata = {
  title: 'Entrar | Bom Trato',
  description: 'Acesse sua conta no Bom Trato.',
};

export default function LoginPage() {
  return (
    <>
      <div className="mb-9">
        <p className="mb-3 text-xs font-medium tracking-widest text-primary uppercase">Bem-vindo de volta</p>

        <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">Entre no seu espaço</h1>

        <p className="mt-3 text-base leading-relaxed text-muted-foreground">Vamos cuidar dos próximos bons tratos?</p>
      </div>

      <LoginForm />
    </>
  );
}
