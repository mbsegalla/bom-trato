import { Camera } from 'lucide-react';

import { WORK_ORDER_PHOTO_STAGE_LABELS, WORK_ORDER_PHOTO_STAGES } from '../../../constants/workOrderPhoto.constants';
import type { PublicWorkOrderPhoto } from '../../../types/workOrderPhoto.types';
import { WorkOrderPhotoImage } from '../../workOrderPhotoImage';

interface PublicWorkOrderPhotosProps {
  photos: PublicWorkOrderPhoto[];
  token: string;
}

export function PublicWorkOrderPhotos({ photos, token }: PublicWorkOrderPhotosProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Camera aria-hidden="true" className="size-5" />
        </div>

        <h2 className="font-heading text-xl font-semibold">Fotos do seu atendimento</h2>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Acompanhe os registros compartilhados pelo profissional. Toque em uma foto para ampliar.
      </p>

      <div className="mt-6 space-y-7">
        {WORK_ORDER_PHOTO_STAGES.map((stage) => {
          const stagePhotos = photos.filter((photo) => photo.stage === stage);

          if (stagePhotos.length === 0) {
            return null;
          }

          return (
            <div key={stage}>
              <h3 className="mb-3 font-heading text-lg font-semibold">{WORK_ORDER_PHOTO_STAGE_LABELS[stage]}</h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stagePhotos.map((photo) => (
                  <figure key={photo.id} className="overflow-hidden rounded-xl border border-border">
                    <WorkOrderPhotoImage photo={photo} source={{ kind: 'public', token }} />

                    {photo.caption && (
                      <figcaption className="p-4 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                        {photo.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
