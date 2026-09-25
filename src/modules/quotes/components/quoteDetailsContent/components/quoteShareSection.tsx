import { Clipboard, ExternalLink, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuoteShareSectionProps {
  shareUrl: string | null;
  shareMessage: string | null;
  sharing: boolean;
  onCreate: () => void;
  onRevoke: () => void;
  onCopy: (url: string) => void;
}

export function QuoteShareSection({
  shareUrl,
  shareMessage,
  sharing,
  onCreate,
  onRevoke,
  onCopy,
}: QuoteShareSectionProps) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">Compartilhar com o cliente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere um link seguro para visualização, PDF, aprovação ou recusa.
          </p>
        </div>
        <div className="flex gap-2">
          {shareUrl && (
            <Button type="button" variant="outline" disabled={sharing} onClick={onRevoke} className="cursor-pointer">
              Revogar link
            </Button>
          )}
          <Button type="button" disabled={sharing} onClick={onCreate} className="cursor-pointer">
            {sharing ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <ExternalLink aria-hidden="true" className="size-4" />
            )}
            {shareUrl ? 'Gerar novo link' : 'Gerar link'}
          </Button>
        </div>
      </div>

      {shareUrl && (
        <div className="mt-5 flex gap-2">
          <Input readOnly value={shareUrl} className="h-11 rounded-xl" />
          <Button type="button" variant="outline" onClick={() => onCopy(shareUrl)} className="cursor-pointer">
            <Clipboard aria-hidden="true" className="size-4" />
            Copiar
          </Button>
        </div>
      )}

      {shareMessage && <p className="mt-3 text-sm text-muted-foreground">{shareMessage}</p>}
    </section>
  );
}
