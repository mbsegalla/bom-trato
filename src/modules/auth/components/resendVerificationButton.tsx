import { LoaderCircle, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ResendVerificationButtonProps {
  isSending: boolean;
  remainingSeconds: number;
  disabled?: boolean;
}

export function ResendVerificationButton({
  isSending,
  remainingSeconds,
  disabled = false,
}: ResendVerificationButtonProps) {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={disabled || isSending || remainingSeconds > 0}
      className="min-h-12 w-full rounded-xl"
    >
      {isSending ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
          Reenviando...
        </>
      ) : remainingSeconds > 0 ? (
        <span className="tabular-nums">
          Reenviar em {minutes}:{seconds}
        </span>
      ) : (
        <>
          <Mail aria-hidden="true" className="size-4" />
          Reenviar e-mail
        </>
      )}
    </Button>
  );
}
