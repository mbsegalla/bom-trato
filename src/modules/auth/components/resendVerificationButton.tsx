'use client';

import { LoaderCircle, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { resendVerificationEmail } from '../services/emailVerification.service';

interface ResendVerificationButtonProps {
  email: string;
}

const RESEND_COOLDOWN_MS = 60_000;

export function ResendVerificationButton({ email }: ResendVerificationButtonProps) {
  const busyRef = useRef(false);
  const cooldownUntilRef = useRef(0);

  const [isSending, setIsSending] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRemainingSeconds(Math.max(0, Math.ceil((cooldownUntilRef.current - Date.now()) / 1000)));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [remainingSeconds]);

  async function handleResend() {
    if (busyRef.current || Date.now() < cooldownUntilRef.current) {
      return;
    }

    busyRef.current = true;
    setIsSending(true);
    setFeedback(null);

    cooldownUntilRef.current = Date.now() + RESEND_COOLDOWN_MS;
    setRemainingSeconds(RESEND_COOLDOWN_MS / 1000);

    try {
      const result = await resendVerificationEmail(email);

      setFeedback(
        result.success
          ? {
              success: true,
              message:
                'Se a conta ainda precisar de verificação, você receberá um novo e-mail. Confira também a pasta de spam.',
            }
          : {
              success: false,
              message: result.message,
            },
      );
    } catch {
      setFeedback({
        success: false,
        message: 'Não conseguimos confirmar a solicitação. Confira sua caixa de entrada antes de tentar novamente.',
      });
    } finally {
      busyRef.current = false;
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handleResend}
        disabled={isSending || remainingSeconds > 0}
        aria-describedby={feedback ? 'resend-feedback' : undefined}
        className="min-h-12 w-full rounded-xl"
      >
        {isSending ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
            Enviando...
          </>
        ) : remainingSeconds > 0 ? (
          `Reenviar em ${remainingSeconds}s`
        ) : (
          <>
            <Mail aria-hidden="true" className="size-4" />
            Reenviar e-mail
          </>
        )}
      </Button>

      {feedback && (
        <p
          id="resend-feedback"
          role={feedback.success ? 'status' : 'alert'}
          className={
            feedback.success
              ? 'rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed'
              : 'rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive'
          }
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
