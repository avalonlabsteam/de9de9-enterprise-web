import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/common/EmptyState';
import { refreshAccueil } from '@/features/auth/api/accueil';
import {
  annonceKey,
  annonceRecue,
  annoncesListeKey,
  etapesOf,
  isRouteAbsente,
  remplacerB2c,
  remplacerZonesB2c,
  soumettre,
  useCategorieB2c,
  useReferentielB2c,
  useZonesB2c,
  zonesB2cKey,
  type ZoneInput,
} from '../api/annonces';
import {
  ETAPES,
  corpsB2c,
  etapeOfField,
  isEtape,
  lignesOf,
  ordonner,
  questionsVisibles,
  semaineOf,
  verifierB2c,
  type Contenu,
  type Etape,
  type Ligne,
} from '../lib/b2c';
import { annonceErreur } from '../lib/erreurs';
import type { AnnonceB2c, Photo } from '../schemas/annonces';
import { EtapeDisponibilite, EtapeQuestionnaire, EtapeServices, EtapeTarifs, EtapeTitre, EtapeZones } from './AnnonceB2cEtapes';
import { PhotosUploader } from './PhotosUploader';
import { detailPath, useAnnonceFlow, type EditState } from './useAnnonceFlow';

/** What a press of the footer goes on to do, once the content is saved. */
type Suite = 'suivant' | 'quitter' | 'enregistrer' | 'publier';

const cleZone = (z: ZoneInput) => `${z.wilayaCode}:${z.communeCode ?? ''}`;
const memesZones = (a: ZoneInput[], b: ZoneInput[]) => {
  const cles = new Set(a.map(cleZone));
  return a.length === b.length && b.every((z) => cles.has(cleZone(z)));
};

function Squelette() {
  return <div className="h-48 animate-pulse rounded-xl bg-secondary" />;
}

/**
 * The B2C wizard, from step 3 on (guide 19a §5): the category was chosen when
 * the draft was created and is locked. Each « Suivant » saves the whole content
 * with the version held; « Publier » sends the annonce to de9de9's review. An
 * annonce already online is saved whole, by its own button, and must stay
 * complete — the change applies at once.
 */
export function AnnonceB2cWizard({ annonce, onStale }: { annonce: AnnonceB2c; onStale: () => void }) {
  const L = useL();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const referentiel = useReferentielB2c();
  const categorieQuery = useCategorieB2c(annonce.categorie?.legacyCategoryId);
  const zonesQuery = useZonesB2c(true);
  const flow = useAnnonceFlow();

  const [saved, setSaved] = useState({ id: annonce.id, version: annonce.version });
  const [lignes, setLignes] = useState<Ligne[]>(() => lignesOf(annonce));
  const [uniteDefaut, setUniteDefaut] = useState<number | null>(annonce.uniteDefaut ?? null);
  const [remise, setRemise] = useState(annonce.remise ? String(annonce.remise) : '');
  const [reponseIds, setReponseIds] = useState<string[]>(annonce.reponseIds);
  const [semaine, setSemaine] = useState(() => semaineOf(annonce));
  const [description, setDescription] = useState(annonce.description ?? '');
  const [photos, setPhotos] = useState<Photo[]>(annonce.photos);
  /** The shared zones as edited here; null while they are the server's. */
  const [zonesLocales, setZonesLocales] = useState<ZoneInput[] | null>(null);
  /** The content moved since the last save: only then is a `PUT` sent. */
  const [modifie, setModifie] = useState(false);
  const [etape, setEtape] = useState<Etape>(() => {
    // Sent here by a refused submission: its first step. Else a draft opens on what is left to complete.
    const refusee = ((location.state as EditState | null)?.etapes ?? []).map((e) => e.code).find(isEtape);
    return refusee ?? annonce.etapes.filter((e) => !e.complete).map((e) => e.code).find(isEtape) ?? 'services';
  });
  const [erreurs, setErreurs] = useState<Partial<Record<Etape, string>>>(() =>
    Object.fromEntries(((location.state as EditState | null)?.etapes ?? []).filter((e) => isEtape(e.code)).map((e) => [e.code, e.message ?? ''])),
  );
  const [busy, setBusy] = useState<Suite | null>(null);
  /** The zones are shared: a save that reaches other annonces is confirmed first, then the press goes on. */
  const [confirmer, setConfirmer] = useState<Suite | null>(null);

  const zonesServeur = zonesQuery.data;
  const zonesInitiales = useMemo(
    () => (zonesServeur?.zones ?? []).map((z): ZoneInput => ({ wilayaCode: z.wilayaCode, communeCode: z.communeCode ?? null })),
    [zonesServeur],
  );

  const categorie = categorieQuery.data;
  const questions = questionsVisibles(categorie, lignes);
  // No question for the category and its ticked tasks: the step is skipped.
  const etapes = ETAPES.filter((e) => e !== 'questionnaire' || !categorie || questions.length > 0);
  const courante = etapes.includes(etape) ? etape : 'disponibilite';
  const aller = (cible: Etape) => {
    setEtape(cible);
    window.scrollTo(0, 0);
  };

  const retour = () => {
    const index = etapes.indexOf(courante);
    if (index > 0) aller(etapes[index - 1] ?? 'services');
    else navigate(detailPath(annonce.id));
  };
  const header = (sousTitre?: string) => (
    <header className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={retour} aria-label={L('Retour', 'رجوع')}>
        <ArrowLeft className="size-4 rtl:rotate-180" />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-1.5 text-xl font-extrabold text-de9-ink">
          <span className="truncate">{annonce.titre}</span>
          {/* One B2C annonce = one category of the app: chosen once, it stays. */}
          <Lock className="size-3.5 flex-none text-de9-gray" aria-label={L('Catégorie verrouillée', 'الفئة مقفلة')} />
        </h1>
        <p className="truncate text-[12.5px] text-de9-gray">{sousTitre ?? L('Annonce B2C', 'إعلان B2C')}</p>
      </div>
    </header>
  );

  if (referentiel.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
        {header()}
        <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }
  if (referentiel.isError) {
    const absente = isRouteAbsente(referentiel.error);
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
        {header()}
        <EmptyState
          title={
            absente
              ? L("La création d'annonces n'est pas encore disponible", 'إنشاء الإعلانات غير متاح بعد')
              : L("Le catalogue de l'app de9de9 est momentanément indisponible.", 'كتالوج تطبيق de9de9 غير متاح مؤقتًا.')
          }
          description={absente ? undefined : L('Votre brouillon est conservé.', 'مسودتك محفوظة.')}
          action={
            absente ? undefined : (
              <Button variant="outline" size="sm" onClick={() => void referentiel.refetch()}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
            )
          }
        />
      </div>
    );
  }

  const { limites, unites } = referentiel.data;
  // Publiée or En pause: no review again — every save runs the full rules and applies at once.
  const enLigne = annonce.statut.code === 'publiee' || annonce.statut.code === 'en_pause';
  const publier = annonce.actions.find((a) => a.code === 'soumettre')?.label ?? L('Publier', 'نشر');
  const zones = zonesLocales ?? zonesInitiales;
  const zonesModifiees = zonesLocales !== null && !memesZones(zonesLocales, zonesInitiales);
  const contenu: Contenu = { lignes, uniteDefaut, remise, reponseIds, semaine, description };
  const index = etapes.indexOf(courante);
  const derniere = index === etapes.length - 1;
  const ordonnees = ordonner(lignes, categorie).filter((l) => l.libre === null || l.libre.trim() !== '');

  const libelleOf = (ligne: Ligne): string => {
    if (ligne.libre !== null) return ligne.libre;
    const service = categorie?.services.find((s) => s.id === ligne.serviceId);
    const nomme = ligne.tacheId === null ? service : service?.taches.find((t) => t.id === ligne.tacheId);
    return nomme ? L(nomme.libelle, nomme.libelleAr ?? nomme.libelle) : ligne.libelle;
  };

  /** Any edit of the content: it is to be saved. */
  const toucher =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setModifie(true);
    };
  const changerLignes = (next: Ligne[]) => {
    setLignes(next);
    setModifie(true);
    // A task unticked takes the answers to its own questions with it.
    if (categorie) {
      const admises = new Set(questionsVisibles(categorie, next).flatMap((q) => q.reponses.map((r) => r.id)));
      setReponseIds((ids) => ids.filter((id) => admises.has(id)));
    }
  };

  const montrer = (e: Partial<Record<Etape, string>>) => {
    setErreurs(e);
    const premiere = etapes.find((x) => e[x] !== undefined);
    if (premiere) aller(premiere);
  };

  /** A refusal, on the step it is about. */
  const refus = (error: unknown) => {
    const { problem, message } = annonceErreur(error, L);
    const refusees = etapesOf(error).filter((e) => isEtape(e.code));
    if (problem.code === 'annonce_incomplete' && refusees.length > 0) {
      montrer(Object.fromEntries(refusees.map((e) => [e.code, e.message ?? ''])));
      toast.error(message);
      return;
    }
    if (problem.code === 'reference_inconnue') {
      // The app's tree moved under the annonce: read again, the lines it no longer knows show up to be removed.
      void categorieQuery.refetch();
      montrer({
        [etapeOfField(problem.field) ?? 'services']: L(
          "Ce service n'existe plus sur l'app de9de9. Retirez-le pour continuer.",
          'هذه الخدمة لم تعد موجودة على تطبيق de9de9. احذفها للمتابعة.',
        ),
      });
      return;
    }
    if (problem.code === 'referentiel_indisponible') {
      toast.error(
        L("Le catalogue de l'app de9de9 est momentanément indisponible. Votre brouillon est conservé.", 'كتالوج تطبيق de9de9 غير متاح مؤقتًا. مسودتك محفوظة.'),
      );
      return;
    }
    const cible = problem.status === 400 ? etapeOfField(problem.field) : undefined;
    if (cible) {
      montrer({ [cible]: message });
      return;
    }
    if (problem.code === 'concurrency_conflict') {
      toast.error(message);
      onStale();
      return;
    }
    if (problem.code === 'annonce_etat_invalide') {
      toast.error(message);
      navigate(detailPath(saved.id));
      return;
    }
    flow.refus(error, saved.id);
  };

  const enregistrer = async () => {
    if (!modifie) return saved;
    const result = await remplacerB2c(saved.id, saved.version, corpsB2c(contenu, categorie));
    annonceRecue(queryClient, result);
    const ref = { id: result.id, version: result.version };
    setSaved(ref);
    setModifie(false);
    return ref;
  };

  /** The zones have their own route and their own version; false when the save was refused (said on the step). */
  const sauverZones = async (version: number): Promise<boolean> => {
    try {
      queryClient.setQueryData(zonesB2cKey, await remplacerZonesB2c(version, zones));
      setZonesLocales(null);
      // Every B2C annonce of the company moved with them.
      void queryClient.invalidateQueries({ queryKey: annoncesListeKey });
      return true;
    } catch (error) {
      const { problem, message } = annonceErreur(error, L);
      if (problem.code === 'concurrency_conflict') {
        // Another seat saved the list meanwhile: it is read again, this edit is dropped.
        setZonesLocales(null);
        void zonesQuery.refetch();
        montrer({ zones: L('Vos zones ont été modifiées par un autre membre de votre équipe. Vérifiez-les.', 'تم تعديل مناطقك من طرف عضو آخر في فريقك. تحقق منها.') });
      } else montrer({ zones: message });
      return false;
    }
  };

  const lancer = async (suite: Suite, zonesConfirmees = false) => {
    const e = verifierB2c(contenu, limites, suite === 'publier' || suite === 'enregistrer', zonesServeur ? zones.length : null, L);
    if (Object.keys(e).length > 0) return montrer(e);
    setErreurs({});
    if (zonesModifiees && !zonesConfirmees && (zonesServeur?.annoncesConcernees ?? 0) > 1) {
      setConfirmer(suite);
      return;
    }
    setBusy(suite);
    try {
      if (zonesModifiees && zonesServeur && !(await sauverZones(zonesServeur.version))) return;
      // An annonce already online is saved whole, by its own button: « Suivant » only turns the page.
      const ref = enLigne && suite === 'suivant' ? saved : await enregistrer();
      if (suite === 'suivant') {
        aller(etapes[index + 1] ?? courante);
      } else if (suite === 'publier') {
        const { annonce: soumise, confirmation } = await soumettre(ref.id, ref.version);
        annonceRecue(queryClient, soumise);
        void refreshAccueil(); // online at once when de9de9 switched the review off
        // The detail prints what the backend says happened: sent to review, or online.
        navigate(detailPath(soumise.id), { replace: true, state: { confirmation } });
      } else {
        toast.success(suite === 'quitter' ? L('Brouillon enregistré', 'تم حفظ المسودة') : L('Modifications enregistrées', 'تم حفظ التعديلات'));
        // An edit of an annonce online applies at once: the home's block shows it.
        if (enLigne) void refreshAccueil();
        navigate(suite === 'quitter' ? '/prestataire/annonces' : detailPath(ref.id));
      }
    } catch (error) {
      refus(error);
    } finally {
      setBusy(null);
    }
  };

  /** A step that needs the app's tree: its services and questions are read from the de9de9 app. */
  const avecCategorie = (render: (c: NonNullable<typeof categorie>) => React.ReactNode) => {
    if (categorie) return render(categorie);
    if (categorieQuery.isError) {
      return (
        <EmptyState
          title={
            toProblem(categorieQuery.error).code === 'referentiel_indisponible'
              ? L("Le catalogue de l'app de9de9 est momentanément indisponible.", 'كتالوج تطبيق de9de9 غير متاح مؤقتًا.')
              : L('Impossible de charger les services de la catégorie', 'تعذّر تحميل خدمات الفئة')
          }
          description={L('Votre brouillon est conservé.', 'مسودتك محفوظة.')}
          action={
            <Button variant="outline" size="sm" onClick={() => void categorieQuery.refetch()}>
              {L('Réessayer', 'إعادة المحاولة')}
            </Button>
          }
        />
      );
    }
    return <Squelette />;
  };

  const TITRES: Record<Etape, [string, string]> = {
    services: [L('Services', 'الخدمات'), L('Choisissez les services que vous proposez.', 'اختر الخدمات التي تقدمها.')],
    tarifs: [L('Tarifs', 'الأسعار'), L('Vos prix, en DZD, pour chaque service choisi.', 'أسعارك بالدينار لكل خدمة مختارة.')],
    questionnaire: [
      L('Questionnaire', 'الاستبيان'),
      L('Répondez aux questions pour aider les clients à mieux comprendre votre expertise et compétences.', 'أجب عن الأسئلة لمساعدة العملاء على فهم خبرتك ومهاراتك.'),
    ],
    disponibilite: [
      L('Disponibilité', 'التوفر'),
      L('Indiquez vos jours et heures de disponibilité : les clients réservent sur ces créneaux.', 'حدّد أيام وساعات توفرك: يحجز العملاء في هذه الفترات.'),
    ],
    zones: [L("Zones d'intervention", 'مناطق التدخل'), L('Les wilayas et communes où vous intervenez.', 'الولايات والبلديات التي تعمل فيها.')],
    description: [
      L('Description', 'الوصف'),
      L('Décrivez vos services et votre expérience pour aider les clients à mieux comprendre ce que vous proposez.', 'صف خدماتك وخبرتك لمساعدة العملاء على فهم ما تقدمه.'),
    ],
    photos: [
      L('Galerie photos', 'معرض الصور'),
      L('Ajoutez des photos pour mettre en valeur votre travail et attirer l’attention des clients.', 'أضف صورًا لإبراز عملك وجذب انتباه العملاء.'),
    ],
  };

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 pb-4">
      {/* The two first steps — group, then category — were the creation of the draft. */}
      {header(L(`Annonce B2C · étape ${index + 3} sur ${etapes.length + 2}`, `إعلان B2C · الخطوة ${index + 3} من ${etapes.length + 2}`))}

      <div className="h-1 w-full overflow-hidden rounded-full bg-de9-line">
        <div className="h-full rounded-full bg-de9-teal transition-[width] duration-300" style={{ width: `${((index + 3) / (etapes.length + 2)) * 100}%` }} />
      </div>

      <nav className="flex flex-wrap gap-1.5" aria-label={L("Étapes de l'annonce", 'خطوات الإعلان')}>
        {etapes.map((e) => (
          <button
            key={e}
            type="button"
            aria-current={e === courante ? 'step' : undefined}
            onClick={() => aller(e)}
            className={cn(
              'rounded-full px-3 py-1 text-[12px] font-bold transition-colors',
              e === courante ? 'bg-de9-teal text-white' : 'bg-card text-de9-slate shadow-soft hover:text-de9-ink dark:ring-1 dark:ring-border',
              erreurs[e] !== undefined && e !== courante && 'text-de9-red ring-1 ring-de9-red/50',
            )}
          >
            {TITRES[e][0]}
          </button>
        ))}
      </nav>

      {enLigne && (
        <p className="rounded-lg bg-de9-teal-soft px-3.5 py-2.5 text-[13px] font-semibold text-de9-teal-dark">
          {L(
            'Cette annonce est en ligne : vos modifications s’appliquent dès l’enregistrement, sans nouvelle vérification.',
            'هذا الإعلان منشور: تُطبَّق تعديلاتك فور الحفظ، دون مراجعة جديدة.',
          )}
        </p>
      )}

      <Card>
        <CardContent className="flex flex-col gap-5 py-5">
          <EtapeTitre titre={TITRES[courante][0]} texte={TITRES[courante][1]} />
          {erreurs[courante] !== undefined && (
            <p role="alert" className="rounded-lg bg-de9-red-soft px-3.5 py-2.5 text-[13px] font-semibold text-de9-red dark:bg-de9-red/15">
              {erreurs[courante] || L('Cette étape est à compléter.', 'هذه الخطوة تحتاج إلى إكمال.')}
            </p>
          )}

          {courante === 'services' &&
            avecCategorie((c) => <EtapeServices categorie={c} lignes={lignes} libresMax={limites.lignesLibresMax} onChange={changerLignes} />)}

          {courante === 'tarifs' && (
            <EtapeTarifs
              lignes={ordonnees}
              libelleOf={libelleOf}
              unites={unites}
              uniteDefaut={uniteDefaut}
              remise={remise}
              onUniteDefaut={toucher(setUniteDefaut)}
              onRemise={toucher(setRemise)}
              onLigne={(key, patch) => changerLignes(lignes.map((l) => (l.key === key ? { ...l, ...patch } : l)))}
            />
          )}

          {courante === 'questionnaire' &&
            avecCategorie(() => <EtapeQuestionnaire questions={questions} reponseIds={reponseIds} onChange={toucher(setReponseIds)} />)}

          {courante === 'disponibilite' && <EtapeDisponibilite semaine={semaine} max={limites.plagesParJourMax} onChange={toucher(setSemaine)} />}

          {courante === 'zones' &&
            (zonesServeur ? (
              <EtapeZones zones={zonesServeur} value={zones} modifiees={zonesModifiees} onChange={setZonesLocales} />
            ) : zonesQuery.isError ? (
              <EmptyState
                title={L('Impossible de charger vos zones', 'تعذّر تحميل مناطقك')}
                description={annonceErreur(zonesQuery.error, L).message}
                action={
                  <Button variant="outline" size="sm" onClick={() => void zonesQuery.refetch()}>
                    {L('Réessayer', 'إعادة المحاولة')}
                  </Button>
                }
              />
            ) : (
              <Squelette />
            ))}

          {courante === 'description' && (
            <div>
              <Textarea
                rows={8}
                value={description}
                maxLength={limites.descriptionMax}
                onChange={(e) => toucher(setDescription)(e.target.value)}
                aria-label={L('Description', 'الوصف')}
                aria-invalid={erreurs.description !== undefined}
              />
              <p className="mt-1.5 flex justify-between text-[11.5px] text-de9-gray tabular-nums">
                <span>{L(`${limites.descriptionMin} caractères au moins`, `${limites.descriptionMin} حرفًا على الأقل`)}</span>
                <span>
                  {description.length}/{limites.descriptionMax}
                </span>
              </p>
            </div>
          )}

          {courante === 'photos' && (
            <PhotosUploader
              annonce={saved}
              photos={photos}
              max={limites.photosMax}
              maxOctets={limites.photoMaxOctets}
              disabled={busy !== null}
              ensureDraft={() => Promise.resolve(saved)}
              onStale={onStale}
              onChange={(next) => {
                setPhotos(next.photos);
                // A photo change bumps the annonce's version too.
                setSaved((s) => ({ ...s, version: next.version }));
                void queryClient.invalidateQueries({ queryKey: annonceKey(saved.id) });
                void queryClient.invalidateQueries({ queryKey: annoncesListeKey });
              }}
            />
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-20 -mx-1 flex flex-col gap-2 rounded-t-xl border-t border-de9-line bg-background/95 px-1 py-3 backdrop-blur sm:flex-row">
        {enLigne ? (
          <>
            {!derniere && (
              <Button variant="outline" className="flex-1" onClick={() => void lancer('suivant')} disabled={busy !== null}>
                {busy === 'suivant' && <Loader2 className="size-4 animate-spin" />}
                {L('Suivant', 'التالي')}
              </Button>
            )}
            <Button className="flex-1" onClick={() => void lancer('enregistrer')} disabled={busy !== null}>
              {busy === 'enregistrer' && <Loader2 className="size-4 animate-spin" />}
              {L('Enregistrer les modifications', 'حفظ التعديلات')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" className="flex-1" onClick={() => void lancer('quitter')} disabled={busy !== null}>
              {busy === 'quitter' && <Loader2 className="size-4 animate-spin" />}
              {L('Enregistrer et quitter', 'حفظ والخروج')}
            </Button>
            <Button className="flex-1" onClick={() => void lancer(derniere ? 'publier' : 'suivant')} disabled={busy !== null}>
              {(busy === 'suivant' || busy === 'publier') && <Loader2 className="size-4 animate-spin" />}
              {derniere ? publier : L('Suivant', 'التالي')}
            </Button>
          </>
        )}
      </div>

      {/* The zones are the company's, not this annonce's: a save reaches every B2C annonce it has. */}
      <Dialog open={confirmer !== null} onOpenChange={(open) => !open && setConfirmer(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{L('Enregistrer vos zones ?', 'حفظ مناطقك؟')}</DialogTitle>
            <DialogDescription>
              {L(
                `Ces zones seront appliquées à vos ${zonesServeur?.annoncesConcernees ?? 0} annonces B2C.`,
                `ستُطبَّق هذه المناطق على إعلاناتك B2C الـ ${zonesServeur?.annoncesConcernees ?? 0}.`,
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmer(null)}>
              {L('Revenir', 'رجوع')}
            </Button>
            <Button
              onClick={() => {
                const suite = confirmer;
                setConfirmer(null);
                if (suite) void lancer(suite, true);
              }}
            >
              {L('Enregistrer', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {flow.dialogs}
    </div>
  );
}
