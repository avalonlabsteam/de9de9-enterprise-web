import { useState } from 'react';
import { Download, Eye, FileCheck2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/api/apiClient';
import { toProblem } from '@/api/problem';
import { downloadAuthedFile, openAuthedFile } from '@/lib/authedFile';
import { tailleLabel } from '@/lib/fichiers';
import { useL, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useLangStore } from '@/stores/langStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useContratPartenariat } from '../api/contrat';

/** The bearer token only ever travels to the API's own host. */
function surApi(url: string): boolean {
  try {
    const api = new URL(apiClient.defaults.baseURL ?? '', window.location.origin);
    return new URL(url, api).origin === api.origin;
  } catch {
    return false;
  }
}

/**
 * « Contrat de partenariat » on the prestataire's profile: whether de9de9
 * recorded it as signed, since when, and the signed PDF once de9de9 filed it.
 * Read only — both are de9de9's to set.
 */
export function ContratPartenariat() {
  const t = useT();
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const query = useContratPartenariat();
  const [busy, setBusy] = useState<'voir' | 'telecharger' | null>(null);

  // Not a prestataire company (400), or one this session cannot read: the profile has no such card.
  if (query.isError && [400, 403, 404].includes(toProblem(query.error).status)) return null;

  const tete = (sousTitre: string | null, pastille?: { label: string; signe: boolean }) => (
    <div className="flex items-center gap-3">
      <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-de9-teal-tint text-de9-teal-dark">
        <FileCheck2 className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-de9-ink">{t('contrat')}</p>
        {sousTitre && (
          <p className="truncate text-[12px] text-de9-gray">
            <bdi>{sousTitre}</bdi>
          </p>
        )}
      </div>
      {pastille && (
        <span
          className={cn(
            'flex-none rounded-full px-2.5 py-1 text-[11.5px] font-bold',
            pastille.signe ? 'bg-de9-teal-soft text-de9-teal-dark' : 'bg-de9-orange/20 text-de9-orange-deep',
          )}
        >
          {pastille.label}
        </span>
      )}
    </div>
  );

  if (query.isPending) {
    return (
      <Card>
        <CardContent className="flex animate-pulse flex-col gap-4 py-5">
          <div className="h-10 rounded-lg bg-secondary" />
          <div className="h-10 rounded-lg bg-secondary" />
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          {tete(L('Impossible de charger le contrat.', 'تعذّر تحميل العقد.'))}
          <Button variant="outline" size="sm" className="self-start" onClick={() => void query.refetch()}>
            {L('Réessayer', 'إعادة المحاولة')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const c = query.data;
  const signeLe =
    c.signeLe && !Number.isNaN(Date.parse(c.signeLe))
      ? new Date(c.signeLe).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'Africa/Algiers',
        })
      : null;
  const taille = tailleLabel(c.sizeBytes, L);
  const nom = c.fileName ?? 'contrat-partenariat.pdf';

  const run = async (kind: 'voir' | 'telecharger') => {
    const url = c.url;
    if (!url) return;
    setBusy(kind);
    try {
      // Anywhere but on the API, the address is opened as it is — without the token.
      if (!surApi(url)) window.open(url, '_blank', 'noopener');
      else if (kind === 'voir') await openAuthedFile(url);
      else await downloadAuthedFile(url, nom);
    } catch {
      toast.error(
        kind === 'voir'
          ? L("Impossible d'ouvrir le contrat.", 'تعذّر فتح العقد.')
          : L('Téléchargement impossible.', 'تعذّر التنزيل.'),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5">
        {tete(c.url ? [c.fileName, taille].filter(Boolean).join(' · ') || null : null, {
          label: L(c.statutLabel ?? (c.signe ? 'Signé' : 'Non signé'), c.signe ? 'موقّع' : 'غير موقّع'),
          signe: c.signe,
        })}

        {signeLe && (
          <div className="rounded-lg bg-background px-3 py-2.5">
            <p className="text-[11.5px] text-de9-gray">{L('Signature', 'التوقيع')}</p>
            <p className="text-[13px] font-bold text-de9-ink" dir="ltr">
              {signeLe}
            </p>
          </div>
        )}

        {c.url ? (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={() => void run('voir')} disabled={busy !== null}>
              {busy === 'voir' ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
              {L('Voir le contrat', 'عرض العقد')}
            </Button>
            <Button variant="outline" className="flex-1 gap-1.5" onClick={() => void run('telecharger')} disabled={busy !== null}>
              {busy === 'telecharger' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {L('Télécharger', 'تنزيل')}
            </Button>
          </div>
        ) : (
          <p className="rounded-lg bg-secondary px-3.5 py-3 text-[13px] text-de9-slate">
            {c.signe
              ? L("de9de9 n'a pas encore déposé le contrat signé ici.", 'لم يُودِع de9de9 العقد الموقّع هنا بعد.')
              : L('Le contrat apparaîtra ici une fois signé avec de9de9.', 'سيظهر العقد هنا بعد توقيعه مع de9de9.')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
