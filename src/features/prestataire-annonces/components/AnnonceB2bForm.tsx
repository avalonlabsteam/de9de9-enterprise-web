import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/common/EmptyState';
import { refreshAccueil } from '@/features/auth/api/accueil';
import { CategorieVisual, FamilleBadge } from '@/features/client-catalogue/components/CategorieVisual';
import {
  annonceKey,
  annonceRecue,
  annoncesListeKey,
  enregistrerB2b,
  etapesOf,
  isRouteAbsente,
  soumettre,
  useReferentielB2b,
  type CorpsB2b,
  type ZoneInput,
} from '../api/annonces';
import { annonceErreur } from '../lib/erreurs';
import type { Annonce, AnnonceB2b, EtapeRefus, Photo } from '../schemas/annonces';
import { PhotosUploader } from './PhotosUploader';
import { detailPath, editPath, useAnnonceFlow } from './useAnnonceFlow';
import { ZonesPicker } from './ZonesPicker';

/** The blocks of the form — also the codes a refusal names (`etapes[].code`). */
type Bloc = 'titre' | 'categorie' | 'services' | 'zones' | 'tarif' | 'delai' | 'capacite' | 'certifications' | 'references' | 'description';

/** The blocks from top to bottom: the first one at fault is the one scrolled to. */
const ORDRE: Bloc[] = ['titre', 'categorie', 'services', 'zones', 'tarif', 'delai', 'capacite', 'certifications', 'references', 'description'];
const AUCUNE: EtapeRefus[] = [];

/** A `field` of a 400 → the block that shows its sentence. */
const BLOC_OF: Record<string, Bloc> = {
  titre: 'titre',
  categoryCode: 'categorie',
  sousCategories: 'services',
  zones: 'zones',
  tarif: 'tarif',
  delaiDemarrageJours: 'delai',
  capacite: 'capacite',
  certifications: 'certifications',
  references: 'references',
  description: 'description',
};
const blocOf = (field: string | undefined): Bloc | undefined =>
  field ? (BLOC_OF[field] ?? BLOC_OF[field.split(/[.[]/)[0] ?? '']) : undefined;

const chip = (active: boolean) =>
  cn(
    'rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-all',
    active
      ? 'bg-de9-teal text-primary-foreground shadow-glow'
      : 'bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
  );

function Section({ id, titre, erreur, children }: { id: Bloc | 'photos'; titre: string; erreur?: string; children: React.ReactNode }) {
  return (
    <div id={`bloc-${id}`} className="flex scroll-mt-28 flex-col gap-2">
      <Label className="text-[14px] font-bold text-de9-ink">{titre}</Label>
      {children}
      {erreur && <p className="text-[12px] text-de9-red">{erreur}</p>}
    </div>
  );
}

/**
 * « Créer une annonce B2B » — and the same page edits one (guide 19b §4). One
 * offer in ONE category of the Entreprise catalogue: its services, zones,
 * tarification, délai, photos. « Enregistrer le brouillon » accepts partial
 * content; « Soumettre à de9de9 » sends it to the review. An annonce already
 * published has one button: an edit applies at once, and must stay complete.
 */
export function AnnonceB2bForm({
  annonce,
  etapes = AUCUNE,
  onStale,
}: {
  annonce: AnnonceB2b | null;
  /** A refused submission sent the user here: the blocks to complete, with the backend's sentences. */
  etapes?: EtapeRefus[];
  onStale: () => void;
}) {
  const L = useL();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const referentiel = useReferentielB2b();
  const flow = useAnnonceFlow();

  const [saved, setSaved] = useState(annonce ? { id: annonce.id, version: annonce.version } : null);
  const [titre, setTitre] = useState(annonce?.titre ?? '');
  const [categoryCode, setCategoryCode] = useState(annonce?.categorie?.code ?? '');
  const [services, setServices] = useState<string[]>(annonce?.sousCategories.map((s) => s.code) ?? []);
  const [zones, setZones] = useState<ZoneInput[]>(
    annonce?.zones.map((z) => ({ wilayaCode: z.wilayaCode, communeCode: z.communeCode ?? null })) ?? [],
  );
  const [mode, setMode] = useState(annonce?.tarif?.mode ?? 'sur_devis');
  const [min, setMin] = useState(annonce?.tarif?.minDzd?.toString() ?? '');
  const [max, setMax] = useState(annonce?.tarif?.maxDzd?.toString() ?? '');
  const [unite, setUnite] = useState(annonce?.tarif?.unite ?? 'jour');
  const [delai, setDelai] = useState(annonce?.delaiDemarrageJours?.toString() ?? '');
  const [capacite, setCapacite] = useState(annonce?.capacite ?? '');
  const [references, setReferences] = useState(annonce?.references ?? '');
  const [certifications, setCertifications] = useState<string[]>(annonce?.certifications ?? []);
  const [certif, setCertif] = useState('');
  const [description, setDescription] = useState(annonce?.description ?? '');
  const [photos, setPhotos] = useState<Photo[]>(annonce?.photos ?? []);
  const [famille, setFamille] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Partial<Record<Bloc, string>>>(() => Object.fromEntries(etapes.map((e) => [e.code, e.message ?? ''])));
  const [busy, setBusy] = useState<'brouillon' | 'soumettre' | null>(null);
  /** A photo call is in flight with the version held: no save, no submission until it answers. */
  const [photosBusy, setPhotosBusy] = useState(false);

  // Opened on a refused submission: its first block comes into view once the form is drawn —
  // a frame later, after the route's own scroll to the top.
  const pret = referentiel.isSuccess;
  useEffect(() => {
    const premier = ORDRE.find((bloc) => etapes.some((e) => e.code === bloc));
    if (!pret || !premier) return;
    const frame = requestAnimationFrame(() => document.getElementById(`bloc-${premier}`)?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [pret, etapes]);

  const titrePage = annonce ? L("Modifier l'annonce B2B", 'تعديل إعلان B2B') : L('Créer une annonce B2B', 'إنشاء إعلان B2B');
  const header = (
    <header className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={() => navigate(annonce ? detailPath(annonce.id) : '/prestataire/annonces')} aria-label={L('Retour', 'رجوع')}>
        <ArrowLeft className="size-4 rtl:rotate-180" />
      </Button>
      <h1 className="text-xl font-extrabold text-de9-ink">{titrePage}</h1>
    </header>
  );

  if (referentiel.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
        {header}
        <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }
  if (referentiel.isError) {
    const absente = isRouteAbsente(referentiel.error);
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
        {header}
        <EmptyState
          title={
            absente
              ? L("La création d'annonces n'est pas encore disponible", 'إنشاء الإعلانات غير متاح بعد')
              : L('Impossible de charger le catalogue', 'تعذّر تحميل الكتالوج')
          }
          description={absente ? L('de9de9 gère vos services pour le moment.', 'تدير de9de9 خدماتك حاليًا.') : annonceErreur(referentiel.error, L).message}
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

  const { limites, categories, kyc, tarif } = referentiel.data;
  const categorie = categories.find((c) => c.code === categoryCode);
  const verrouillee = annonce?.categorie?.verrouillee === true;
  // Already published (or paused): no review again — the edit applies at once and must stay complete.
  const enLigne = !!annonce && !annonce.actions.some((a) => a.code === 'soumettre');
  const familles = [...new Map(categories.filter((c) => c.famille).map((c) => [c.famille, c])).values()];
  const modes = tarif.modes.length > 0 ? tarif.modes : [
    { code: 'sur_devis', label: L('Sur devis', 'حسب عرض السعر') },
    { code: 'fourchette', label: L('Fourchette indicative', 'نطاق تقريبي') },
  ];
  const unites = tarif.unites.length > 0 ? tarif.unites : [{ code: 'jour', label: 'jour' }];
  // A service de9de9 retired since has no chip to untick: it is neither counted nor sent again.
  const offerts = new Set(categorie?.services.map((s) => s.code));
  const retenus = services.filter((code) => offerts.has(code));
  const retires = services.length - retenus.length;

  const nombre = (raw: string): number | null => (raw.trim() === '' ? null : Number(raw.replace(',', '.')));
  const corps = (): CorpsB2b => ({
    titre: titre.trim(),
    categoryCode,
    sousCategories: retenus,
    zones,
    tarif:
      mode === 'fourchette'
        ? { mode, minDzd: nombre(min), maxDzd: nombre(max), unite }
        : { mode: 'sur_devis', minDzd: null, maxDzd: null, unite: null },
    delaiDemarrageJours: nombre(delai),
    capacite: capacite.trim() || null,
    references: references.trim() || null,
    certifications,
    description: description.trim() || null,
  });

  /** The rules of the form, as the backend repeats them. `complet`: those of a submission. */
  const verifier = (complet: boolean): Partial<Record<Bloc, string>> => {
    const e: Partial<Record<Bloc, string>> = {};
    if (!titre.trim()) e.titre = L("Donnez un titre à l'offre.", 'أعطِ عنوانًا للعرض.');
    if (!categoryCode) e.categorie = L('Choisissez une catégorie.', 'اختر فئة.');
    const lo = nombre(min);
    const hi = nombre(max);
    if (mode === 'fourchette' && (min.trim() !== '' || max.trim() !== '' || complet)) {
      if (lo === null || hi === null || !Number.isFinite(lo) || !Number.isFinite(hi) || lo < 0 || hi < lo) {
        e.tarif = L('Indiquez un minimum et un maximum en DA, le maximum au moins égal au minimum.', 'أدخل حدًا أدنى وأقصى بالدينار، والأقصى لا يقل عن الأدنى.');
      }
    }
    const jours = nombre(delai);
    if (jours !== null && (!Number.isInteger(jours) || jours < 0)) e.delai = L('Un nombre entier de jours.', 'عدد صحيح من الأيام.');
    if (complet) {
      if (retenus.length === 0) e.services = L('Choisissez au moins un service.', 'اختر خدمة واحدة على الأقل.');
      if (zones.length === 0) e.zones = L('Ajoutez au moins une zone de couverture.', 'أضف منطقة تغطية واحدة على الأقل.');
      if (description.trim().length < limites.descriptionMin) {
        e.description = L(`Décrivez votre offre en ${limites.descriptionMin} caractères au moins.`, `صف عرضك في ${limites.descriptionMin} حرفًا على الأقل.`);
      }
    }
    return e;
  };

  const montrer = (e: Partial<Record<Bloc, string>>) => {
    setErreurs(e);
    const premier = ORDRE.find((bloc) => e[bloc] !== undefined);
    if (premier) document.getElementById(`bloc-${premier}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** The version held is stale. The create page has no annonce to read again: the draft's own page does. */
  const stale = () => {
    if (annonce) return onStale();
    if (!saved) return;
    queryClient.removeQueries({ queryKey: annonceKey(saved.id) });
    navigate(editPath(saved.id), { replace: true });
  };

  /** A refusal, on the block it is about. */
  const refus = (error: unknown) => {
    const { problem, message } = annonceErreur(error, L);
    const etapes = etapesOf(error);
    if (problem.code === 'annonce_incomplete' && etapes.length > 0) {
      montrer(Object.fromEntries(etapes.map((e) => [e.code, e.message ?? ''])));
      toast.error(message);
      return;
    }
    const bloc =
      blocOf(problem.field) ??
      (problem.code === 'sous_categorie_deja_annoncee'
        ? 'services'
        : problem.code === 'categorie_non_disponible'
          ? // The category is still in the catalogue: it is one of its services that left it.
            categorie
            ? 'services'
            : 'categorie'
          : undefined);
    if (bloc) {
      montrer({ [bloc]: message });
      // The catalogue moved under the form: its tiles and chips are read again.
      if (problem.status === 409 || problem.status === 422) void referentiel.refetch();
      return;
    }
    if (problem.code === 'concurrency_conflict') {
      toast.error(message);
      stale();
      return;
    }
    if (problem.code === 'annonce_etat_invalide' && saved) {
      toast.error(message);
      navigate(detailPath(saved.id));
      return;
    }
    flow.refus(error, saved?.id ?? '');
  };

  const enregistrer = async (): Promise<{ id: string; version: number } | null> => {
    const result = await enregistrerB2b(corps(), saved);
    annonceRecue(queryClient, result);
    const ref = { id: result.id, version: result.version };
    setSaved(ref);
    return ref;
  };

  const sauver = async () => {
    if (photosBusy) return;
    const e = verifier(enLigne);
    if (Object.keys(e).length > 0) return montrer(e);
    setErreurs({});
    setBusy('brouillon');
    try {
      const ref = await enregistrer();
      toast.success(enLigne ? L('Modifications enregistrées', 'تم حفظ التعديلات') : L('Brouillon enregistré', 'تم حفظ المسودة'));
      // An edit of an annonce online applies at once: the home's block shows it.
      if (enLigne) void refreshAccueil();
      // A new draft now has an address of its own: a refresh opens it again. (The draft may have
      // been born earlier, silently, by a photo: the page moves at the first save all the same.)
      if (!annonce && ref) navigate(editPath(ref.id), { replace: true });
    } catch (error) {
      refus(error);
    } finally {
      setBusy(null);
    }
  };

  const envoyer = async () => {
    if (photosBusy) return;
    const e = verifier(true);
    if (Object.keys(e).length > 0) return montrer(e);
    setErreurs({});
    setBusy('soumettre');
    try {
      const ref = await enregistrer();
      if (!ref) return;
      const { annonce: soumise, confirmation } = await soumettre(ref.id, ref.version);
      annonceRecue(queryClient, soumise);
      void refreshAccueil(); // online at once when de9de9 switched the review off
      // The detail prints what the backend says happened: sent to review, or online.
      navigate(detailPath(soumise.id), { replace: true, state: { confirmation } });
    } catch (error) {
      refus(error);
    } finally {
      setBusy(null);
    }
  };

  /** Photos need an annonce: a new form saves its draft first, silently. */
  const ensureDraft = async () => {
    const e = verifier(false);
    if (e.titre || e.categorie) {
      montrer({ titre: e.titre, categorie: e.categorie });
      toast.info(L("Donnez un titre et une catégorie à l'annonce avant d'ajouter des photos.", 'أعطِ الإعلان عنوانًا وفئة قبل إضافة الصور.'));
      return null;
    }
    try {
      return await enregistrer();
    } catch (error) {
      refus(error);
      return null;
    }
  };

  const ajouterCertif = () => {
    const tag = certif.trim().slice(0, limites.certificationMax);
    if (tag && !certifications.includes(tag) && certifications.length < limites.certificationsMax) {
      setCertifications([...certifications, tag]);
    }
    setCertif('');
  };

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 pb-4">
      {header}

      <Card>
        <CardContent className="flex flex-col gap-6 py-5">
         {/* Frozen while a save is in flight: what is typed then would not be in it. */}
         <fieldset disabled={busy !== null} className="contents">
          <p className="rounded-lg bg-de9-blue-tint px-3.5 py-2.5 text-[13px] font-semibold text-de9-blue">
            {L(
              'Annonce destinée aux clients entreprises (B2B) routés par de9de9.',
              'إعلان موجّه لعملاء الشركات (B2B) الموجَّهين من طرف de9de9.',
            )}
          </p>

          <Section id="titre" titre={L("Titre de l'offre", 'عنوان العرض')} erreur={erreurs.titre}>
            <Input
              value={titre}
              maxLength={limites.titreMax}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={L('Ex. Nettoyage industriel multi-sites', 'مثال: تنظيف صناعي متعدد المواقع')}
              aria-invalid={!!erreurs.titre}
            />
          </Section>

          <Section id="categorie" titre={L('Catégorie', 'الفئة')} erreur={erreurs.categorie}>
            {verrouillee && categorie ? (
              // Submitted once: the category stays — another category is another annonce.
              <div className="flex items-center gap-3 rounded-xl bg-de9-row px-3.5 py-3">
                <CategorieVisual imageUrl={categorie.imageUrl} icone={categorie.icone} className="size-10" iconClassName="size-10" emojiClassName="text-[22px]" />
                <p className="min-w-0 flex-1 text-[14px] font-bold text-de9-ink">{L(categorie.libelle, categorie.libelleAr ?? categorie.libelle)}</p>
                <Lock className="size-4 flex-none text-de9-gray" aria-label={L('Catégorie verrouillée', 'الفئة مقفلة')} />
              </div>
            ) : (
              <>
                {familles.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {/* The family is the colour group of a category, not a level to pick: these only narrow the tiles. */}
                    {familles.map((f) => (
                      <button
                        key={f.famille}
                        type="button"
                        aria-pressed={famille === f.famille}
                        onClick={() => setFamille(famille === f.famille ? null : (f.famille ?? null))}
                        className={cn('rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-white transition-opacity', famille && famille !== f.famille && 'opacity-40')}
                        style={{ backgroundColor: f.hex ?? undefined }}
                      >
                        {f.familleLabel ?? f.famille}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories
                    .filter((c) => !famille || c.famille === famille)
                    .map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        aria-pressed={c.code === categoryCode}
                        onClick={() => {
                          if (c.code === categoryCode) return;
                          setCategoryCode(c.code);
                          setServices([]); // the services are the category's own
                        }}
                        className={cn(
                          'flex min-h-[76px] items-center gap-2.5 rounded-xl bg-de9-row px-3 py-2.5 text-start transition-shadow hover:shadow-lift',
                          c.code === categoryCode ? 'ring-2 ring-de9-teal' : 'dark:ring-1 dark:ring-border',
                        )}
                      >
                        <CategorieVisual imageUrl={c.imageUrl} icone={c.icone} className="size-9 flex-none" iconClassName="size-9 flex-none" emojiClassName="text-[20px]" />
                        <span className="flex min-w-0 flex-col items-start gap-1">
                          <FamilleBadge label={c.familleLabel} hex={c.hex} />
                          <span className="text-[12.5px] font-bold break-words text-de9-ink">{L(c.libelle, c.libelleAr ?? c.libelle)}</span>
                        </span>
                      </button>
                    ))}
                </div>
              </>
            )}
          </Section>

          {categorie && (
            <Section id="services" titre={L('Services proposés', 'الخدمات المقترحة')} erreur={erreurs.services}>
              <div className="flex flex-wrap gap-2">
                {categorie.services.map((s) => {
                  const pris = s.dejaAnnoncee && !services.includes(s.code);
                  return (
                    <button
                      key={s.code}
                      type="button"
                      disabled={pris}
                      aria-pressed={services.includes(s.code)}
                      title={pris ? L(`Déjà dans l'annonce « ${s.annonce?.titre ?? ''} »`, `موجودة في الإعلان « ${s.annonce?.titre ?? ''} »`) : undefined}
                      onClick={() => setServices(services.includes(s.code) ? services.filter((x) => x !== s.code) : [...services, s.code])}
                      className={cn(chip(services.includes(s.code)), 'disabled:cursor-not-allowed disabled:opacity-50')}
                    >
                      {s.libelle}
                    </button>
                  );
                })}
              </div>
              {retires > 0 && (
                <p className="text-[12px] text-de9-orange-deep">
                  {L(
                    retires > 1 ? `${retires} services ne sont plus au catalogue : ils ont été retirés de l'annonce.` : "Un service n'est plus au catalogue : il a été retiré de l'annonce.",
                    retires > 1 ? `${retires} خدمات لم تعد في الكتالوج: تمت إزالتها من الإعلان.` : 'خدمة لم تعد في الكتالوج: تمت إزالتها من الإعلان.',
                  )}
                </p>
              )}
              {categorie.services.some((s) => s.dejaAnnoncee && !services.includes(s.code)) && (
                <p className="text-[12px] text-de9-gray">
                  {L('Un service grisé est déjà proposé dans une autre de vos annonces en ligne.', 'الخدمة المعطّلة معروضة في إعلان آخر لك.')}
                </p>
              )}
            </Section>
          )}

          <Section id="zones" titre={L('Zones de couverture', 'مناطق التغطية')} erreur={erreurs.zones}>
            <ZonesPicker value={zones} onChange={setZones} max={limites.zonesMax} />
          </Section>

          <Section id="tarif" titre={L('Tarification', 'التسعير')} erreur={erreurs.tarif}>
            <div className="flex flex-wrap gap-2">
              {modes.map((m) => (
                <button key={m.code} type="button" aria-pressed={mode === m.code} onClick={() => setMode(m.code)} className={chip(mode === m.code)}>
                  {m.label}
                </button>
              ))}
            </div>
            {mode === 'fourchette' && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-3">
                  <Input inputMode="numeric" dir="ltr" value={min} onChange={(e) => setMin(e.target.value)} placeholder={L('Minimum (DA)', 'الأدنى (دج)')} aria-label={L('Minimum en DA', 'الحد الأدنى بالدينار')} />
                  <Input inputMode="numeric" dir="ltr" value={max} onChange={(e) => setMax(e.target.value)} placeholder={L('Maximum (DA)', 'الأقصى (دج)')} aria-label={L('Maximum en DA', 'الحد الأقصى بالدينار')} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[12.5px] text-de9-gray">{L('Par', 'لكل')}</span>
                  {unites.map((u) => (
                    <button key={u.code} type="button" aria-pressed={unite === u.code} onClick={() => setUnite(u.code)} className={cn(chip(unite === u.code), 'px-3 py-1 text-[12px]')}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <div className="grid gap-5 sm:grid-cols-2">
            <Section id="delai" titre={L('Délai de démarrage (jours)', 'مهلة البدء (أيام)')} erreur={erreurs.delai}>
              <Input inputMode="numeric" dir="ltr" value={delai} onChange={(e) => setDelai(e.target.value)} placeholder="7" />
            </Section>
            <Section id="capacite" titre={L('Capacité / volume traitable', 'القدرة / الحجم')} erreur={erreurs.capacite}>
              <Input value={capacite} maxLength={limites.capaciteMax} onChange={(e) => setCapacite(e.target.value)} placeholder={L("Ex. jusqu'à 12 sites", 'مثال: حتى 12 موقعًا')} />
            </Section>
          </div>

          <Section id="certifications" titre={L('Certifications & agréments', 'الشهادات والاعتمادات')} erreur={erreurs.certifications}>
            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {certifications.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 ps-3 pe-1.5 text-[12.5px] font-semibold text-de9-ink">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setCertifications(certifications.filter((t) => t !== tag))}
                      aria-label={L(`Retirer ${tag}`, `إزالة ${tag}`)}
                      className="grid size-5 place-items-center rounded-full hover:bg-card"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {certifications.length < limites.certificationsMax && (
              <Input
                value={certif}
                maxLength={limites.certificationMax}
                onChange={(e) => setCertif(e.target.value)}
                onBlur={ajouterCertif}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    ajouterCertif();
                  }
                }}
                placeholder={L('Ex. ISO 9001 — Entrée pour ajouter', 'مثال: ISO 9001 — اضغط Enter للإضافة')}
              />
            )}
            <p className="text-[12px] text-de9-gray">{L('Le badge Certifié est attribué par de9de9.', 'شارة « معتمد » تمنحها de9de9.')}</p>
          </Section>

          <Section id="references" titre={L('Références', 'المراجع')} erreur={erreurs.references}>
            <Textarea rows={3} value={references} maxLength={limites.referencesMax} onChange={(e) => setReferences(e.target.value)} placeholder={L('Clients ou chantiers de référence…', 'عملاء أو مشاريع مرجعية…')} />
          </Section>

          <Section id="description" titre={L('Description', 'الوصف')} erreur={erreurs.description}>
            <Textarea rows={5} value={description} maxLength={limites.descriptionMax} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!erreurs.description} />
            <p className="text-end text-[11.5px] text-de9-gray tabular-nums">
              {description.length}/{limites.descriptionMax}
            </p>
          </Section>

          <Section id="photos" titre={L('Photos', 'الصور')}>
            <PhotosUploader
              annonce={saved}
              photos={photos}
              max={limites.photosMax}
              maxOctets={limites.photoMaxOctets}
              disabled={busy !== null}
              ensureDraft={ensureDraft}
              onStale={stale}
              onBusyChange={setPhotosBusy}
              onChange={(next) => {
                setPhotos(next.photos);
                // A photo change bumps the annonce's version too — here, and in what the other screens hold.
                setSaved((s) => (s ? { ...s, version: next.version } : s));
                queryClient.setQueryData<Annonce>(annonceKey(next.id), (held) => (held ? { ...held, photos: next.photos, version: next.version } : held));
                void queryClient.invalidateQueries({ queryKey: annoncesListeKey });
              }}
            />
          </Section>
         </fieldset>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-20 -mx-1 flex flex-col gap-2 rounded-t-xl border-t border-de9-line bg-background/95 px-1 py-3 backdrop-blur sm:flex-row">
        <Button variant={enLigne ? 'default' : 'outline'} className="flex-1" onClick={() => void sauver()} disabled={busy !== null || photosBusy}>
          {busy === 'brouillon' && <Loader2 className="size-4 animate-spin" />}
          {enLigne ? L('Enregistrer les modifications', 'حفظ التعديلات') : L('Enregistrer le brouillon', 'حفظ المسودة')}
        </Button>
        {!enLigne && (
          <Button
            className="flex-1"
            onClick={() => void envoyer()}
            disabled={busy !== null || photosBusy || !kyc.verifie}
            title={kyc.verifie ? undefined : L('Disponible après vérification de votre entreprise', 'متاح بعد توثيق مؤسستك')}
          >
            {busy === 'soumettre' && <Loader2 className="size-4 animate-spin" />}
            {L('Soumettre à de9de9', 'إرسال إلى de9de9')}
          </Button>
        )}
      </div>
      {!enLigne && !kyc.verifie && (
        <p className="text-center text-[12px] text-de9-orange-deep">
          {L('« Soumettre » sera disponible après vérification de votre entreprise.', '« الإرسال » متاح بعد توثيق مؤسستك.')}
        </p>
      )}
      {flow.dialogs}
    </div>
  );
}
