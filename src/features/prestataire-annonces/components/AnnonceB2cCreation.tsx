import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { annonceRecue, creerB2c, isRouteAbsente, useReferentielB2c } from '../api/annonces';
import { annonceErreur } from '../lib/erreurs';
import { editPath } from './useAnnonceFlow';

/** A group or category picture from the de9de9 app, or its initial when it has none. */
function Vignette({ url, libelle, className }: { url?: string | null; libelle: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (url && !failed) return <img src={url} alt="" onError={() => setFailed(true)} className={cn('object-cover', className)} />;
  return (
    <span aria-hidden className={cn('grid place-items-center bg-de9-teal-soft text-[18px] font-extrabold text-de9-teal-dark', className)}>
      {libelle.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * The first two steps of a B2C annonce: a group of the de9de9 app, then one of
 * its categories. One B2C annonce = one category of the app, so choosing it
 * CREATES the draft — and locks the category for good. A category the company
 * already announces links to that annonce; Santé and Chauffeur are locked.
 */
export function AnnonceB2cCreation() {
  const L = useL();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const referentiel = useReferentielB2c();
  const [groupeId, setGroupeId] = useState<number | null>(null);
  const [creating, setCreating] = useState<number | null>(null);
  /** A refusal about one category, printed on its row. */
  const [refus, setRefus] = useState<{ id: number; message: string } | null>(null);

  const groupe = referentiel.data?.groupes.find((g) => g.id === groupeId);
  const libelle = (x: { libelle: string; libelleAr?: string | null }) => L(x.libelle, x.libelleAr ?? x.libelle);

  const choisir = async (categoryId: number) => {
    setCreating(categoryId);
    setRefus(null);
    try {
      const annonce = await creerB2c(categoryId);
      annonceRecue(queryClient, annonce);
      // The draft has an address of its own from here on: the wizard goes on there.
      navigate(editPath(annonce.id), { replace: true });
    } catch (error) {
      const { problem, message } = annonceErreur(error, L);
      // Another seat took the category meanwhile, or it is locked: said on the row, and the rows are read again.
      if (problem.code === 'categorie_deja_annoncee' || problem.code === 'categorie_non_disponible' || problem.code === 'reference_inconnue') {
        setRefus({ id: categoryId, message });
        void referentiel.refetch();
      } else toast.error(message);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <header className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => (groupe ? setGroupeId(null) : navigate('/prestataire/annonces'))}
          aria-label={L('Retour', 'رجوع')}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-de9-ink">{groupe ? libelle(groupe) : L('Créez votre annonce', 'أنشئ إعلانك')}</h1>
          <p className="text-[12.5px] text-de9-gray">
            {groupe
              ? L('Choisissez la catégorie de votre annonce. Elle ne pourra plus changer.', 'اختر فئة إعلانك. لا يمكن تغييرها لاحقًا.')
              : L('Annonce B2C — visible par les particuliers sur l’app de9de9.', 'إعلان B2C — يظهر للأفراد على تطبيق de9de9.')}
          </p>
        </div>
      </header>

      {referentiel.isPending && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {referentiel.isError && (
        <EmptyState
          title={
            isRouteAbsente(referentiel.error)
              ? L("La création d'annonces n'est pas encore disponible", 'إنشاء الإعلانات غير متاح بعد')
              : toProblem(referentiel.error).code === 'referentiel_indisponible'
                ? L("Le catalogue de l'app de9de9 est momentanément indisponible.", 'كتالوج تطبيق de9de9 غير متاح مؤقتًا.')
                : L('Impossible de charger le catalogue', 'تعذّر تحميل الكتالوج')
          }
          description={isRouteAbsente(referentiel.error) ? undefined : L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.')}
          action={
            isRouteAbsente(referentiel.error) ? undefined : (
              <Button variant="outline" size="sm" onClick={() => void referentiel.refetch()}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
            )
          }
        />
      )}

      {/* Step 1 — the groups */}
      {referentiel.data && !groupe && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {referentiel.data.groupes.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupeId(g.id)}
              className="relative flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
            >
              <Vignette url={g.photoUrl} libelle={g.libelle} className="size-16 rounded-full" />
              <span className="text-[13px] font-bold break-words text-de9-ink">{libelle(g)}</span>
              {/* Every category of the group is locked: it still opens, to say why. */}
              {g.verrouille && <Lock className="absolute end-2.5 top-2.5 size-4 text-de9-gray" />}
            </button>
          ))}
        </div>
      )}

      {/* Step 2 — the categories of the group; a free one creates the draft */}
      {groupe && (
        <ul className="flex flex-col gap-2">
          {groupe.categories.map((c) => {
            const occupe = c.dejaUtilisee || c.indisponible;
            return (
              <li key={c.id}>
                <div className={cn('flex items-center gap-3 rounded-xl bg-card p-3 shadow-soft dark:ring-1 dark:ring-border', occupe && 'opacity-80')}>
                  <Vignette url={c.photoUrl} libelle={c.libelle} className="size-11 flex-none rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold break-words text-de9-ink">{libelle(c)}</p>
                    {c.dejaUtilisee && (
                      <p className="text-[12px] text-de9-gray">
                        {L('Déjà annoncée', 'معلن عنها بالفعل')}
                        {c.annonceId && (
                          <>
                            {' · '}
                            <Link to={editPath(c.annonceId)} className="font-semibold text-de9-teal-dark underline">
                              {L("Modifier l'annonce", 'تعديل الإعلان')}
                            </Link>
                          </>
                        )}
                      </p>
                    )}
                    {c.indisponible && (
                      <p className="text-[12px] text-de9-gray">
                        {c.indisponibleMotif ?? L('Catégorie soumise à vérification — contactez de9de9', 'فئة تخضع للتحقق — اتصل بـ de9de9')}
                      </p>
                    )}
                    {refus?.id === c.id && <p className="text-[12px] text-de9-red">{refus.message}</p>}
                  </div>
                  {c.indisponible ? (
                    <Lock className="size-4 flex-none text-de9-gray" />
                  ) : c.dejaUtilisee ? null : (
                    <Button size="sm" disabled={creating !== null} onClick={() => void choisir(c.id)}>
                      {creating === c.id ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4 rtl:rotate-180" />}
                      {L('Choisir', 'اختيار')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
