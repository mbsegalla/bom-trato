'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

import { getGoogleConfig } from '@/config/google.config';
import { cn } from '@/lib/utils';

type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with' | 'signin';

interface GoogleSignInButtonProps {
  text?: GoogleButtonText;
  disabled?: boolean;
  onCredential(credential: string): void;
  onError?(): void;
}

export function GoogleSignInButton({
  text = 'continue_with',
  disabled = false,
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const { clientId } = getGoogleConfig();

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className={cn('flex w-full justify-center', disabled && 'pointer-events-none opacity-60')}>
        <GoogleLogin
          theme="outline"
          size="large"
          text={text}
          shape="rectangular"
          logo_alignment="left"
          width="320"
          onSuccess={(response) => {
            if (!response.credential) {
              onError?.();

              return;
            }

            onCredential(response.credential);
          }}
          onError={() => onError?.()}
        />
      </div>
    </GoogleOAuthProvider>
  );
}
