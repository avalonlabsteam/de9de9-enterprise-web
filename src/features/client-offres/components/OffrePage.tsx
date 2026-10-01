import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useAccesB2b } from '@/features/auth/api/accueil';
import { FamilleBadge } from '@/features/client-catalogue/components/CategorieVisual';
import { catalogueActions } from '@/features/client-catalogue/stores/catalogueStore';
import { useKycState } from '@/features/kyc/api/kyc';
import { useOffre } from '../api/offres';
import { PrestataireIdentite } from './OffreParts';

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '' || children === false) return null;
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="flex-none text-[13px] text-de9-gray">{label}</dt>
      <dd className="min-w-0 text-[13.5px] font-semibold break-words text-de9-ink sm:text-end">{children}</dd>
    </div>
  );
}

const Chips = ({ items }: { items: string[] }) => (
  <span className="flex flex-wrap gap-1.5 sm:justify-end">
    {items.map((item) => (
      <span key={item} className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-semibold text-de9-ink">
        {item}
      </span>
    ))}
  </span>
);

/**
 * One offer of a prestataire (`/client/offres/{id}`): what it published, and
 * « Demander un devis » — which opens the existing demande form, pre-filled.
 * The prestataire is not contacted from here: de9de9 passes the demande on.
 */
export function OffrePage() {
  const { id } = useParams<{ id: string }>();
  const L = useL();
  const navigate = useNavigate();
  const query = useOffre(id);
  const kyc = useKycState();
  const accesB2b = useAccesB2b();
  const offre = query.data;

  const retour = () => navigate(offre?.categorie ? `/client/family/${encodeURIComponent(offre.categorie.code)}` : '/client');

  const demander = () => {
    const demande = offre?.demande;
    if (!offre || !demande) return;
    // The demande form opens on the offer's category, its services ticked, the offer attached.
    catalogueActions.openWithOffre(
      {
        annonceId: demande.annonceId,
        categoryCode: demande.categoryCode,
        wilayas: demande.wilayas,
        prestataireSouhaite: demande.prestataireSouhaite ?? L(`Prestataire souhaité : ${offre.prestataire.nom}`, `مقدّم الخدمة المرغوب: ${offre.prestataire.nom}`),
        note: offre.demander?.note ?? null,
      },
      demande.subCategoryCodes,
    );
    // The ticks are kept through the KYC detour.
    navigate(kyc.verified ? `/client/publish/${encodeURIComponent(demande.categoryCode)}` : '/client/kyc');
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <button type="button" onClick={retour} className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-de9-gray hover:text-de9-ink">
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {offre?.categorie ? L(offre.categorie.libelle, offre.categorie.libelle) : L('Catalogue', 'الكتالوج')}
      </button>

      {query.isPending && (
        <div className="flex flex-col gap-3">
          <div className="h-44 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
        </div>
      )}

      {query.isError && !offre && (
        <EmptyState
          title={
            // Paused, suspended, delisted, or the caller's own company: all the same answer.
            toProblem(query.error).status === 404
              ? L("Cette offre n'est plus disponible.", 'هذا العرض لم يعد متاحًا.')
              : L("Impossible de charger l'offre", 'تعذّر تحميل العرض')
          }
          action={
            toProblem(query.error).status === 404 ? (
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                {L('Retour aux offres', 'العودة إلى العروض')}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
            )
          }
        />
      )}

      {offre && (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="text-xl font-extrabold break-words text-de9-ink sm:text-2xl">{offre.titre}</h1>
            <PrestataireIdentite prestataire={offre.prestataire} grand />
          </header>

          {offre.photos.length > 0 && (
            <div className="flex snap-x gap-2 overflow-x-auto">
              {offre.photos.map((photo) => (
                <a key={photo.url} href={photo.url} target="_blank" rel="noreferrer" className="flex-none snap-start">
                  <img src={photo.url} alt="" className="h-44 w-64 rounded-xl object-cover" />
                </a>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="px-4 py-1">
              <dl className="divide-y divide-border">
                <Ligne label={L('Catégorie', 'الفئة')}>
                  {offre.categorie && (
                    <span className="inline-flex items-center gap-2">
                      {offre.categorie.libelle}
                      <FamilleBadge label={offre.categorie.familleLabel} hex={offre.categorie.hex} />
                    </span>
                  )}
                </Ligne>
                <Ligne label={L('Services proposés', 'الخدمات المقترحة')}>
                  {offre.services.length > 0 && <Chips items={offre.services.map((s) => s.libelle)} />}
                </Ligne>
                <Ligne label={L('Zones de couverture', 'مناطق التغطية')}>
                  {offre.zones.length > 0 && (
                    <Chips
                      items={offre.zones.map((z) =>
                        // A whole wilaya reads by its name; a commune names its wilaya.
                        z.commune ? `${z.commune} (${z.wilaya ?? z.wilayaCode})` : (z.wilaya ?? String(z.wilayaCode)),
                      )}
                    />
                  )}
                </Ligne>
                <Ligne label={L('Tarification', 'التسعير')}>{offre.tarifLabel}</Ligne>
                <Ligne label={L('Délai de démarrage', 'مهلة البدء')}>{offre.delaiLabel}</Ligne>
                <Ligne label={L('Capacité', 'القدرة')}>{offre.capacite}</Ligne>
                <Ligne label={L('Certifications & agréments', 'الشهادات والاعتمادات')}>
                  {offre.certifications.length > 0 && <Chips items={offre.certifications} />}
                </Ligne>
                <Ligne label={L('Références', 'المراجع')}>
                  {offre.references && <span className="font-medium whitespace-pre-line">{offre.references}</span>}
                </Ligne>
              </dl>
            </CardContent>
          </Card>

          {offre.description && (
            <Card>
              <CardContent className="flex flex-col gap-2 py-4">
                <h2 className="text-[13px] text-de9-gray">{L('Description', 'الوصف')}</h2>
                <p className="text-[13.5px] whitespace-pre-line text-de9-ink">{offre.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Pinned to the bottom of the window, inside the page's own column. */}
          {offre.demande && accesB2b && (
            <div className="pointer-events-none sticky bottom-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4">
              <div className="pointer-events-auto flex flex-col gap-1.5">
                <Button size="lg" className="h-13 w-full rounded-xl text-[15px]" onClick={demander}>
                  {offre.demander?.label ?? L('Demander un devis', 'طلب عرض سعر')}
                </Button>
                <p className="text-center text-[12px] text-de9-gray">
                  {offre.demander?.note ?? L('de9de9 transmet votre demande et vous présente les devis.', 'de9de9 ينقل طلبك ويعرض عليك عروض الأسعار.')}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
