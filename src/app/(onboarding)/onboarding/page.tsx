import type { Metadata } from 'next';

import { OnboardingContent } from '@/modules/onboarding/components/onboardingContent';

export const metadata: Metadata = {
  title: 'Configurar conta',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingPage() {
  return <OnboardingContent />;
}
