import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { uiActions } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useAccesB2c } from '@/features/auth/api/accueil';
import type { AnnonceCard } from '@/features/auth/schemas/accueil';
import { usePrestataireAccueil } from '@/features/prestataire-dashboard/api/dashboard';

function AnnonceTile({ annonce }: { annonce: AnnonceCard }) {
  const L = useL();
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-full bg-secondary text-[20px]">
          {annonce.icone ?? '🧰'}
        </span>
        <div className="min-w-0 flex-1">
          {annonce.categorie && <p className="truncate text-xs font-semibold text-de9-teal">{annonce.categorie}</p>}
          <p className="text-[15px] font-bold break-words text-de9-ink">{annonce.service}</p>
          <p className="mt-0.5 text-[13px] text-de9-slate">{annonce.prixLabel ?? L('Sur devis', 'حسب عرض السعر')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {annonce.canaux.map((canal) => (
              <span
                key={canal}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                  canal === 'B2C' ? 'bg-de9-teal-soft text-de9-teal-dark' : 'bg-de9-blue-tint text-de9-blue',
                )}
              >
                {canal === 'B2C' ? L('B2C · app de9de9', 'B2C · تطبيق de9de9') : canal}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * « Mes annonces » as it is while the annonce routes are not deployed: the
 * services on the company's directory card, read from the home (guide 16b
 * §11-12). Read-only — the card is edited by de9de9. The day the list route
 * answers, `AnnoncesListe` shows the stored annonces instead.
 */
export function AnnoncesLectureSeule() {
  const L = useL();
  const accueil = usePrestataireAccueil();
  const annonces = accueil?.annonces ?? [];
  // « actif » on the de9de9 app (the access block's word, guide 21 §12), yet no service of the card is mapped to it.
  const notPublished = useAccesB2c() === 'actif' && !!accueil?.b2c && annonces.length > 0 && !annonces.some((a) => a.canaux.includes('B2C'));

  return (
    <div className="flex flex-col gap-4">
      {annonces.length === 0 ? (
        <EmptyState
          title={L('Aucun service sur votre fiche', 'لا توجد خدمات في بطاقتك')}
          description={L('Contactez de9de9 pour la compléter.', 'اتصل بـ de9de9 لإكمالها.')}
          icon={<Megaphone className="size-6" />}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {annonces.map((annonce, i) => (
            <AnnonceTile key={`${annonce.sousCategorieCode ?? annonce.service}-${i}`} annonce={annonce} />
          ))}
        </div>
      )}

      {notPublished && (
        <p className="rounded-lg bg-de9-orange/15 px-4 py-3 text-[13px] text-de9-orange-deep">
          {L(
            "Vos services ne sont pas encore publiés sur l'app de9de9.",
            'خدماتك غير منشورة بعد على تطبيق de9de9.',
          )}
        </p>
      )}

      <div className="flex flex-col items-start gap-3 rounded-lg bg-de9-row px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-de9-slate">
          {L(
            'Vos services sont gérés par de9de9 : catégories, zones et tarifs de votre fiche.',
            'خدماتك تُدار من طرف de9de9: الفئات والمناطق والأسعار في بطاقتك.',
          )}
        </p>
        <Button variant="outline" size="sm" className="flex-none" onClick={uiActions.openSupport}>
          {L('Demander une modification à de9de9', 'طلب تعديل من de9de9')}
        </Button>
      </div>
    </div>
  );
}
