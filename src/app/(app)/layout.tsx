import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProvider } from '@/modules/app/components/appProvider';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface ApplicationLayoutProps {
  children: ReactNode;
}

export default function ApplicationLayout({ children }: ApplicationLayoutProps) {
  return <AppProvider>{children}</AppProvider>;
}
