import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { useAccesB2c } from '@/features/auth/api/accueil';
import { annonceKey, useAnnonce } from '../api/annonces';
import { annonceErreur } from '../lib/erreurs';
import { AnnonceB2bForm } from './AnnonceB2bForm';
import { AnnonceB2cCreation } from './AnnonceB2cCreation';
import { AnnonceB2cWizard } from './AnnonceB2cWizard';
import { detailPath, type EditState } from './useAnnonceFlow';

const LISTE = '/prestataire/annonces';

/**
 * « Créer une annonce » (`/prestataire/annonce/create?type=b2b|b2c`) — where the
 * type picker lands. B2B: the form, saved as a draft on demand. B2C: a group,
 * then a category of the de9de9 app — the draft is born there, and the wizard
 * goes on at the draft's own address.
 */
export function AnnonceCreatePage() {
  const [params] = useSearchParams();
  const type = params.get('type');
  const b2cFerme = useAccesB2c() === 'non_autorise';
  if (type === 'b2b') return <AnnonceB2bForm annonce={null} onStale={() => undefined} />;
  // A saved link, without the B2C access de9de9 grants (guide 21 §12): no B2C annonce is started.
  if (type === 'b2c' && b2cFerme) return <Navigate to={LISTE} replace />;
  if (type === 'b2c') return <AnnonceB2cCreation />;
  // No kind in the address: the list opens its picker.
  return <Navigate to={`${LISTE}?creer=1`} replace />;
}

/**
 * « Modifier » (`/prestataire/annonces/{id}/modifier`) — the form of the
 * annonce's kind, pre-filled. An annonce whose status allows no edit (en revue,
 * archivée) says so and sends back to its page.
 */
export function AnnonceEditPage() {
  const { id } = useParams<{ id: string }>();
  const L = useL();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const query = useAnnonce(id);
  // A refused submission sends its blocks along. Read once, then taken off the history entry: a
  // form started over, a refresh or a way back must not show them again once they are fixed.
  const [refusees] = useState(() => (location.state as EditState | null)?.etapes ?? []);
  useEffect(() => {
    if ((location.state as EditState | null)?.etapes) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);
  // A stale version: the annonce is read again and the form starts over from it.
  const [lecture, setLecture] = useState(0);
  const [relit, setRelit] = useState(false);
  const annonce = query.data;

  const relire = () => {
    if (!id) return;
    setRelit(true);
    void queryClient
      .refetchQueries({ queryKey: annonceKey(id) })
      .finally(() => {
        setRelit(false);
        setLecture((n) => n + 1);
      });
  };

  const cadre = (children: React.ReactNode) => (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(annonce ? detailPath(annonce.id) : LISTE)} aria-label={L('Retour', 'رجوع')}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Button>
        <h1 className="truncate text-xl font-extrabold text-de9-ink">{annonce?.titre ?? L("Modifier l'annonce", 'تعديل الإعلان')}</h1>
      </header>
      {children}
    </div>
  );

  // Read again and gone (another seat deleted it): what was held is not shown as if it still existed.
  const disparue = query.isError && toProblem(query.error).code === 'annonce_not_found';
  if (!annonce || relit || disparue) {
    if (query.isError && !relit) {
      const introuvable = toProblem(query.error).status === 404;
      return cadre(
        <EmptyState
          title={introuvable ? L('Cette annonce est introuvable.', 'هذا الإعلان غير موجود.') : L("Impossible de charger l'annonce", 'تعذّر تحميل الإعلان')}
          description={introuvable ? undefined : annonceErreur(query.error, L).message}
          action={
            introuvable ? (
              <Button variant="outline" size="sm" onClick={() => navigate(LISTE)}>
                {L('Mes annonces', 'إعلاناتي')}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
            )
          }
        />,
      );
    }
    return cadre(<div className="h-96 animate-pulse rounded-2xl bg-secondary" />);
  }

  // Only what the backend lists is offered: no « Modifier », no form. A draft is always the pro's to write.
  if (annonce.statut.code !== 'brouillon' && !annonce.actions.some((a) => a.code === 'modifier')) {
    return cadre(
      <EmptyState
        title={L("Cette annonce n'est pas modifiable pour le moment.", 'هذا الإعلان غير قابل للتعديل حاليًا.')}
        description={annonce.bandeau?.texte ?? annonce.statut.label}
        action={
          <Button variant="outline" size="sm" onClick={() => navigate(detailPath(annonce.id))}>
            {L("Voir l'annonce", 'عرض الإعلان')}
          </Button>
        }
      />,
    );
  }

  return annonce.type === 'b2b' ? (
    <AnnonceB2bForm key={lecture} annonce={annonce} etapes={lecture === 0 ? refusees : undefined} onStale={relire} />
  ) : (
    <AnnonceB2cWizard key={lecture} annonce={annonce} etapes={lecture === 0 ? refusees : undefined} onStale={relire} />
  );
}
