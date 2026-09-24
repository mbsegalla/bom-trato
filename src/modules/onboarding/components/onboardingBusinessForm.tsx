'use client';

import { ArrowRight, Building2, LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { completeBusinessSetup } from '../services/onboarding.service';
import type { OnboardingState } from '../types/onboarding.types';

interface OnboardingBusinessFormProps {
  organizationId: string;
  onCompleted(state: OnboardingState): void;
}

export function OnboardingBusinessForm({ organizationId, onCompleted }: OnboardingBusinessFormProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const form = event.currentTarget;

    const formData = new FormData(form);

    const name = String(formData.get('name') ?? '').trim();

    if (name.length < 2 || name.length > 100) {
      setError('Informe um nome entre 2 e 100 caracteres.');

      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const state = await completeBusinessSetup(organizationId, name);

      onCompleted(state);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a configuração.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="business-name">Nome do negócio</Label>

        <div className="relative">
          <Building2
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            id="business-name"
            name="name"
            minLength={2}
            maxLength={100}
            required
            disabled={submitting}
            placeholder="Ex.: Marco Serviços"
            className="h-12 rounded-xl pl-11"
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="min-h-12 w-full cursor-pointer rounded-xl">
        {submitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            Criar meu negócio
            <ArrowRight aria-hidden="true" className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
