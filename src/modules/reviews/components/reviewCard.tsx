import { BadgeCheck, Star } from 'lucide-react';

import { formatDate } from '@/shared/formatters/date.formatter';

interface ReviewCardProps {
  reviewerDisplayName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export function ReviewCard({ reviewerDisplayName, rating, comment, createdAt }: ReviewCardProps) {
  return (
    <article className="rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{reviewerDisplayName}</p>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <BadgeCheck className="size-3.5 text-primary" />
            Serviço verificado
          </p>
        </div>

        <div className="flex" aria-label={`${rating} de 5 estrelas`}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              aria-hidden="true"
              fill={index < rating ? 'currentColor' : 'none'}
              className={index < rating ? 'size-4 text-primary' : 'size-4 text-muted-foreground/40'}
            />
          ))}
        </div>
      </div>

      {comment && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{comment}</p>}

      <p className="mt-4 text-xs text-muted-foreground">{formatDate(createdAt)}</p>
    </article>
  );
}
