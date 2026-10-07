import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toProblem } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentsListe } from '@/components/common/DocumentsListe';
import { EmptyState } from '@/components/common/EmptyState';
import { ReseauxChips } from '@/components/common/ReseauxSociaux';
import { liensRemplis } from '@/lib/reseauxSociaux';
import { FamilleBadge } from '@/features/client-catalogue/components/CategorieVisual';
import { useAnnonce } from '../api/annonces';
import { annonceErreur } from '../lib/erreurs';
import type { Annonce, AnnonceB2b, AnnonceB2c, Confirmation } from '../schemas/annonces';
import { Bandeau, StatutBadge, TypeChip } from './parts';
import { editPath, useAnnonceFlow } from './useAnnonceFlow';

const LISTE = '/prestataire/annonces';

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null;
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

function DetailB2b({ a }: { a: AnnonceB2b }) {
  const L = useL();
  return (
    <dl className="divide-y divide-border">
      <Ligne label={L('Catégorie', 'الفئة')}>
        {a.categorie && (
          <span className="inline-flex items-center gap-2">
            {a.categorie.libelle}
            <FamilleBadge label={a.categorie.familleLabel} hex={a.categorie.hex} />
          </span>
        )}
      </Ligne>
      <Ligne label={L('Services proposés', 'الخدمات المقترحة')}>
        {a.sousCategories.length > 0 && <Chips items={a.sousCategories.map((s) => s.libelle)} />}
      </Ligne>
      <Ligne label={L('Zones de couverture', 'مناطق التغطية')}>
        {a.zones.length > 0 && (
          <Chips
            items={a.zones.map((z) =>
              // A whole wilaya reads by its name; a commune names its wilaya.
              z.commune ? `${z.commune} (${z.wilaya ?? z.wilayaCode})` : (z.wilaya ?? String(z.wilayaCode)),
            )}
          />
        )}
      </Ligne>
      <Ligne label={L('Tarification', 'التسعير')}>{a.tarif?.label}</Ligne>
      <Ligne label={L('Délai de démarrage', 'مهلة البدء')}>{a.delaiLabel}</Ligne>
      <Ligne label={L('Capacité', 'القدرة')}>{a.capacite}</Ligne>
      <Ligne label={L('Certifications & agréments', 'الشهادات والاعتمادات')}>
        {a.certifications.length > 0 && <Chips items={a.certifications} />}
      </Ligne>
      <Ligne label={L('Références', 'المراجع')}>
        {a.references && <span className="font-medium whitespace-pre-line">{a.references}</span>}
      </Ligne>
      <Ligne label={L('Réseaux sociaux', 'شبكات التواصل')}>
        {liensRemplis(a.liensSociaux).length > 0 ? <ReseauxChips liens={a.liensSociaux} className="sm:justify-end" /> : null}
      </Ligne>
    </dl>
  );
}

function DetailB2c({ a }: { a: AnnonceB2c }) {
  const L = useL();
  // One line per day, its ranges side by side.
  const jours = new Map<number, { label: string; plages: string[] }>();
  for (const d of a.disponibilites) {
    const jour = jours.get(d.jour) ?? { label: d.jourLabel ?? String(d.jour), plages: [] };
    jour.plages.push(`${d.debut} – ${d.fin}`);
    jours.set(d.jour, jour);
  }
  return (
    <dl className="divide-y divide-border">
      <Ligne label={L('Catégorie', 'الفئة')}>
        {a.categorie && [a.categorie.groupe, a.categorie.libelle].filter(Boolean).join(' · ')}
      </Ligne>
      {a.lignes.length > 0 && (
        <div className="py-3">
          <dt className="mb-2 text-[13px] text-de9-gray">{L('Services & tarifs', 'الخدمات والأسعار')}</dt>
          <dd>
            <ul className="divide-y divide-border rounded-xl bg-de9-row px-3">
              {a.lignes.map((ligne, i) => (
                <li key={ligne.id ?? i} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                  <span className="min-w-0 break-words text-de9-ink">{ligne.libelle}</span>
                  <span className="flex-none font-semibold tabular-nums" dir="ltr">
                    {ligne.prixLabel ?? (ligne.prixDzd != null ? `${ligne.prixDzd.toLocaleString('fr-FR')} DA` : '—')}
                  </span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
      <Ligne label={L('Remise', 'التخفيض')}>{a.remise > 0 ? `${a.remise} %` : null}</Ligne>
      {a.questionnaire.map((q) => (
        <Ligne key={q.question} label={q.question}>
          {q.reponses.join(', ')}
        </Ligne>
      ))}
      <Ligne label={L('Disponibilité', 'التوفر')}>
        {jours.size > 0 && (
          <span className="flex flex-col gap-0.5 font-medium">
            {[...jours.values()].map((jour) => (
              <span key={jour.label}>
                {jour.label} : <span dir="ltr">{jour.plages.join(' · ')}</span>
              </span>
            ))}
          </span>
        )}
      </Ligne>
      <Ligne label={L("Zones d'intervention", 'مناطق التدخل')}>
        {a.zones?.resume && (
          <span className="flex flex-col font-medium">
            {a.zones.resume}
            {/* One list for the company: every B2C annonce shares it. */}
            {a.zones.note && <span className="text-[12px] font-normal text-de9-gray">{a.zones.note}</span>}
          </span>
        )}
      </Ligne>
    </dl>
  );
}

function Detail({ a }: { a: Annonce }) {
  const L = useL();
  const navigate = useNavigate();
  const flow = useAnnonceFlow({ onDeleted: () => navigate(LISTE) });
  const corriger = a.statut.code === 'refusee' || a.statut.code === 'suspendue';
  // « Modifier » sits in the red card on a refused or suspended annonce.
  const actions = a.actions.filter((action) => !(corriger && action.code === 'modifier'));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {a.typeChip && <TypeChip type={a.type} label={a.typeChip.label} />}
        <StatutBadge tag={a.statut} />
        {a.type === 'b2c' && a.publication && <StatutBadge tag={a.publication} />}
      </div>

      {corriger && a.motif ? (
        <div className="flex flex-col gap-3 rounded-xl border-s-4 border-de9-red/40 bg-de9-red-soft/60 px-4 py-3.5">
          <p className="text-[11px] font-extrabold tracking-[0.1em] text-de9-red uppercase">{L('Motif de de9de9', 'سبب de9de9')}</p>
          <p className="text-[13.5px] whitespace-pre-line text-de9-ink">{a.motif}</p>
          <Button size="sm" className="self-start" onClick={() => navigate(editPath(a.id))}>
            {L('Corriger et renvoyer', 'تصحيح وإعادة الإرسال')}
          </Button>
        </div>
      ) : (
        a.bandeau && <Bandeau ton={a.bandeau.ton} texte={a.bandeau.texte} />
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.code}
              size="sm"
              variant="outline"
              disabled={flow.isBusy(a.id)}
              onClick={() => flow.press(a, action)}
              className={cn(action.style === 'danger' && 'text-destructive')}
            >
              {flow.isBusy(a.id, action.code) && <Loader2 className="size-4 animate-spin" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {a.photos.length > 0 && (
        <div className="flex snap-x gap-2 overflow-x-auto">
          {a.photos.map((photo) => (
            <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="flex-none snap-start">
              <img src={photo.url} alt="" className="h-44 w-64 rounded-xl object-cover" />
            </a>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="px-4 py-1">{a.type === 'b2b' ? <DetailB2b a={a} /> : <DetailB2c a={a} />}</CardContent>
      </Card>

      {a.description && (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <h2 className="text-[13px] text-de9-gray">{L('Description', 'الوصف')}</h2>
            <p className="text-[13.5px] whitespace-pre-line text-de9-ink">{a.description}</p>
          </CardContent>
        </Card>
      )}

      {a.type === 'b2b' && a.documents.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <h2 className="text-[13px] text-de9-gray">{L('Documents', 'المستندات')}</h2>
            <DocumentsListe documents={a.documents} />
          </CardContent>
        </Card>
      )}

      {a.type === 'b2b' && a.demandesIssues?.label && (
        <p className="text-center text-[13px] font-semibold text-de9-slate">{a.demandesIssues.label}</p>
      )}
      {flow.dialogs}
    </>
  );
}

/**
 * One annonce (`/prestataire/annonces/{id}`), either kind: what was typed, its
 * status strip, de9de9's reason when it was refused or suspended — and the
 * buttons its status allows, as the backend lists them.
 */
export function AnnonceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const L = useL();
  const navigate = useNavigate();
  const location = useLocation();
  const query = useAnnonce(id);
  const a = query.data;

  // Arriving from a form that just submitted: what the backend says happened, once.
  const [vue, setVue] = useState(false);
  const confirmation = vue ? null : ((location.state as { confirmation?: Confirmation } | null)?.confirmation ?? null);
  const fermer = () => {
    setVue(true);
    navigate(location.pathname, { replace: true, state: null }); // a refresh must not show it again
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-8">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(LISTE)} aria-label={L('Retour', 'رجوع')}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-de9-ink">{a?.titre ?? L('Annonce', 'إعلان')}</h1>
          {a?.type === 'b2c' && a.sousTitre && <p className="truncate text-[12.5px] text-de9-gray">{a.sousTitre}</p>}
        </div>
      </header>

      {query.isPending && (
        <div className="flex flex-col gap-3">
          <div className="h-10 w-56 animate-pulse rounded-full bg-secondary" />
          <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
        </div>
      )}

      {query.isError && !a && (
        <EmptyState
          title={
            toProblem(query.error).status === 404
              ? L('Cette annonce est introuvable.', 'هذا الإعلان غير موجود.')
              : L("Impossible de charger l'annonce", 'تعذّر تحميل الإعلان')
          }
          description={toProblem(query.error).status === 404 ? undefined : annonceErreur(query.error, L).message}
          action={
            <div className="flex gap-2">
              {toProblem(query.error).status !== 404 && (
                <Button size="sm" onClick={() => void query.refetch()}>
                  {L('Réessayer', 'إعادة المحاولة')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate(LISTE)}>
                {L('Mes annonces', 'إعلاناتي')}
              </Button>
            </div>
          }
        />
      )}

      {a && <Detail a={a} />}

      <Dialog open={confirmation != null} onOpenChange={(open) => !open && fermer()}>
        <DialogContent className="text-center sm:max-w-sm">
          <DialogHeader className="items-center">
            <span className="grid size-14 place-items-center rounded-full bg-de9-teal-soft text-[26px]" aria-hidden>
              📣
            </span>
            <DialogTitle className="text-[18px]">{confirmation?.titre}</DialogTitle>
            {confirmation?.texte && <DialogDescription>{confirmation.texte}</DialogDescription>}
          </DialogHeader>
          <Button className="w-full" onClick={fermer}>
            {confirmation?.bouton ?? L('Voir mon annonce', 'عرض إعلاني')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
