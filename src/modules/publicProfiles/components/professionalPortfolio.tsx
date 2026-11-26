'use client';

import { Camera, ImageOff, LoaderCircle } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { getProfessionalPortfolioImage } from '@/modules/workOrders/services/workOrderPortfolio.service';

interface PortfolioPhoto {
  id: string;
  stage: 'BEFORE' | 'AFTER';
  width: number;
  height: number;
}

interface ProfessionalPortfolioProps {
  slug: string;
  photos: PortfolioPhoto[];
}

export function ProfessionalPortfolio({ slug, photos }: ProfessionalPortfolioProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="flex items-center gap-3">
        <Camera aria-hidden="true" className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-semibold">Trabalhos realizados</h2>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Fotografias de serviços concluídos, publicadas com autorização específica do cliente.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <ProfessionalPortfolioImage key={photo.id} slug={slug} photo={photo} />
        ))}
      </div>
    </section>
  );
}

function ProfessionalPortfolioImage({ slug, photo }: { slug: string; photo: PortfolioPhoto }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    void getProfessionalPortfolioImage(slug, photo.id)
      .then((blob) => {
        if (!active) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;

      if (objectUrl !== null) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photo.id, slug]);

  const label = photo.stage === 'BEFORE' ? 'Antes do serviço' : 'Depois do serviço';

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-4/3 bg-muted/30">
        {url !== null ? (
          <Image
            src={url}
            alt={`${label} realizado pelo profissional`}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-6" />
            <span className="text-xs">Foto indisponível</span>
          </div>
        ) : (
          <div role="status" className="flex h-full items-center justify-center gap-2 text-muted-foreground">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            <span className="sr-only">Carregando foto do portfólio</span>
          </div>
        )}
      </div>

      <figcaption className="p-4 text-sm font-medium">{label}</figcaption>
    </figure>
  );
}
