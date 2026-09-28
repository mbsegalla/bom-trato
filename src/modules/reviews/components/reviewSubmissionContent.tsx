'use client';

import { CheckCircle2, LoaderCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OrganizationLogo } from '@/modules/organizations/components/organizationLogo';

import { resolveReviewInvitation, submitReview } from '../services/review.service';
import type { ReviewInvitationPreview, SubmittedReview } from '../types/review.types';

function tokenFromHash(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hash = window.location.hash.slice(1);

  return new URLSearchParams(hash).get('token');
}

export function ReviewSubmissionContent() {
  const tokenRef = useRef<string | null>(null);

  const [preview, setPreview] = useState<ReviewInvitationPreview | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedReview | null>(null);

  useEffect(() => {
    let active = true;

    const token = tokenFromHash();

    tokenRef.current = token;

    const request: Promise<ReviewInvitationPreview> = token
      ? resolveReviewInvitation(token)
      : Promise.reject(new Error('Este link de avaliação não é válido.'));

    void request
      .then((result) => {
        if (!active) {
          return;
        }

        setPreview(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a avaliação.');
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function send(): Promise<void> {
    const token = tokenRef.current;

    if (!token || rating === 0 || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await submitReview(token, {
        rating,
        comment: comment.trim() || null,
      });

      setSubmitted(result);

      tokenRef.current = null;

      window.history.replaceState(window.history.state, '', window.location.pathname);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar sua avaliação.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
          Carregando avaliação...
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
        <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-surface text-success">
            <CheckCircle2 aria-hidden="true" className="size-7" />
          </span>

          <h1 className="mt-6 font-heading text-2xl font-semibold">Obrigado pela avaliação!</h1>

          <p className="mt-3 leading-relaxed text-muted-foreground">
            Sua experiência agora faz parte das avaliações verificadas do Bom Trato.
          </p>

          <Link
            href={`/profissionais/${submitted.professionalSlug}`}
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 font-medium text-primary-foreground"
          >
            Ver perfil do profissional
          </Link>
        </section>
      </main>
    );
  }

  if (!preview || error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6">
        <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-semibold">Avaliação indisponível</h1>

          <p role="alert" className="mt-4 text-sm leading-relaxed text-destructive">
            {error ?? 'Este link não está disponível.'}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
          >
            Voltar ao Bom Trato
          </Link>
        </section>
      </main>
    );
  }

  const displayedRating = hoveredRating || rating;

  return (
    <main className="min-h-dvh bg-background px-6 py-12">
      <div className="mx-auto max-w-xl">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-4">
            <OrganizationLogo name={preview.businessName} logoUrl={preview.logoUrl} className="size-16 rounded-2xl" />

            <div>
              <p className="text-sm text-muted-foreground">Você está avaliando</p>

              <h1 className="mt-1 font-heading text-2xl font-semibold">{preview.businessName}</h1>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-muted/40 p-5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Serviço realizado</p>

            <p className="mt-2 font-medium">{preview.workOrderTitle}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold">Como foi sua experiência?</h2>

            <div className="mt-4 flex gap-2" onMouseLeave={() => setHoveredRating(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                  onMouseEnter={() => setHoveredRating(value)}
                  onFocus={() => setHoveredRating(value)}
                  onBlur={() => setHoveredRating(0)}
                  onClick={() => setRating(value)}
                  className="cursor-pointer rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Star
                    aria-hidden="true"
                    fill={value <= displayedRating ? 'currentColor' : 'none'}
                    className={value <= displayedRating ? 'size-9 text-primary' : 'size-9 text-muted-foreground/40'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <label htmlFor="review-comment" className="text-sm font-medium">
              Conte um pouco mais
              <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>
            </label>

            <Textarea
              id="review-comment"
              value={comment}
              maxLength={1000}
              onChange={(event) => setComment(event.currentTarget.value)}
              placeholder="Como foi o atendimento e o serviço realizado?"
              className="mt-2 min-h-32 rounded-xl"
            />

            <p className="mt-2 text-right text-xs text-muted-foreground">{comment.length}/1000</p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button
            type="button"
            disabled={rating === 0 || submitting}
            onClick={() => void send()}
            className="mt-7 min-h-12 w-full cursor-pointer rounded-xl"
          >
            {submitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            Enviar avaliação
          </Button>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            Esta avaliação está vinculada a um serviço concluído no Bom Trato e será identificada como verificada.
          </p>
        </section>
      </div>
    </main>
  );
}
