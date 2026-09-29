import { useState } from 'react';
import { Download, Eye, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toneText } from '@/lib/tones';
import { apiUrl } from '@/api/hostUrl';
import { openAuthedFile } from '@/lib/authedFile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchFile } from '../api/portefeuille';
import type { Fichier } from '../schemas/portefeuille';

/** Save a blob under the server's file name. */
function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * The viewer sheet of a document card: its title and rows as sent, then
 * « Aperçu », « Télécharger » (saved as `nomFichier`) and « Partager » (the
 * device's share sheet with the file itself — there is no public link).
 */
export function FichierViewer({ fichier, onClose }: { fichier: Fichier; onClose: () => void }) {
  const L = useL();
  const [busy, setBusy] = useState<'apercu' | 'telecharger' | 'partager' | null>(null);
  const v = fichier.visionneuse;
  const name = fichier.nomFichier ?? fichier.titre;

  const run = async (what: 'apercu' | 'telecharger' | 'partager') => {
    setBusy(what);
    try {
      if (what === 'apercu') {
        const href = fichier.apercuHref ?? fichier.telechargerHref;
        if (href) await openAuthedFile(apiUrl(href));
        return;
      }
      if (!fichier.telechargerHref) return;
      const blob = await fetchFile(fichier.telechargerHref);
      if (what === 'telecharger') {
        saveBlob(blob, name);
        return;
      }
      const file = new File([blob], name, { type: fichier.contentType ?? blob.type });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: v?.titre ?? name });
      } else {
        // No share sheet here (most desktops): the file is saved instead.
        saveBlob(blob, name);
      }
    } catch (error) {
      // Closing the share sheet is not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error(L("Impossible d'ouvrir le document.", 'تعذّر فتح المستند.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{v?.titre ?? fichier.titre}</DialogTitle>
        </DialogHeader>
        {v && v.lignes.length > 0 && (
          <dl className="divide-y divide-border rounded-lg bg-secondary/60 px-3.5">
            {v.lignes.map((ligne) => (
              <div key={ligne.code ?? ligne.label} className="flex justify-between gap-4 py-2 text-[13px]">
                <dt className="text-de9-gray">{ligne.label}</dt>
                <dd className={cn('text-end font-semibold tabular-nums', ligne.ton ? toneText(ligne.ton) : 'text-de9-ink')}>
                  {ligne.valeur}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => void run('apercu')} disabled={!!busy}>
            {busy === 'apercu' ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            {L('Aperçu', 'معاينة')}
          </Button>
          <Button variant="outline" onClick={() => void run('partager')} disabled={!!busy}>
            {busy === 'partager' ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
            {L('Partager', 'مشاركة')}
          </Button>
          <Button onClick={() => void run('telecharger')} disabled={!!busy}>
            {busy === 'telecharger' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {L('Télécharger', 'تنزيل')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
