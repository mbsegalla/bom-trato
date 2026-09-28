import type { Metadata } from 'next';

import { ReviewSubmissionContent } from '@/modules/reviews/components/reviewSubmissionContent';

export const metadata: Metadata = {
  title: 'Avaliar serviço',

  robots: {
    index: false,
    follow: false,
  },
};

export default function ReviewPage() {
  return <ReviewSubmissionContent />;
}
