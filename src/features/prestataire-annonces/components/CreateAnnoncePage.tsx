import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { CATALOGUE, WILAYAS } from '@/lib/catalogue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useCreateAnnonce } from '../api/annonces';
import { useAnnonceDraftStore } from '../stores/annonceDraftStore';
import { AnnonceCreatedModal } from './AnnonceCreatedModal';
import { AssignAnnonceModal } from './AssignAnnonceModal';

function chipCls(active: boolean): string {
  return cn(
    'rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all',
    active
      ? 'bg-de9-teal text-white shadow-glow'
      : 'bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
  );
}

/**
 * B2B keeps the single-page offer form below. B2C moved to the wizard dialog,
 * so this route redirects onto the annonces list with the dialog open.
 */
export function CreateAnnoncePage() {
  const [params] = useSearchParams();
  const type = params.get('type') === 'b2b' ? 'b2b' : 'b2c';
  if (type === 'b2c') return <Navigate to="/prestataire/annonces?create=1" replace />;
  return <CreateB2bAnnoncePage />;
}

function CreateB2bAnnoncePage() {
  const L = useL();
  const navigate = useNavigate();

  const createAnnonce = useCreateAnnonce();
  const selectedProIds = useAnnonceDraftStore((s) => s.selectedProIds);
  const resetDraft = useAnnonceDraftStore((s) => s.reset);
  const [created, setCreated] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [families, setFamilies] = useState<string[]>([]);
  const [wilayas, setWilayas] = useState<string[]>([]);
  const [capacite, setCapacite] = useState('');
  const [certifications, setCertifications] = useState('');
  const [tarification, setTarification] = useState<'devis' | 'demande'>('devis');
  const [references, setReferences] = useState('');

  const toggleFamily = (id: string) =>
    setFamilies((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleWilaya = (w: string) =>
    setWilayas((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));

  const serviceNameForPayload = (): string => {
    const names = families
      .map((id) => CATALOGUE.find((f) => f.id === id)?.name.fr)
      .filter((n): n is string => Boolean(n));
    return names.length > 0 ? names.join(', ') : L('Offre B2B', 'عرض B2B');
  };

  const publish = () => {
    createAnnonce.mutate(
      { title: title.trim() || serviceNameForPayload(), serviceName: serviceNameForPayload(), type: 'b2b' },
      { onSuccess: () => setCreated(true) },
    );
  };

  const goToAnnonces = () => {
    resetDraft();
    navigate('/prestataire/annonces');
  };

  const affecterSummary =
    selectedProIds.length > 0
      ? L(
          `${selectedProIds.length} professionnel(s) sélectionné(s)`,
          `${selectedProIds.length} محترف مختار`,
        )
      : L('Optionnel · annonce au nom de la société', 'اختياري · إعلان باسم الشركة');

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <header className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={L('Retour', 'رجوع')}>
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </Button>
        <h1 className="text-[22px] font-black text-de9-ink">
          {L('Créer une annonce B2B', 'إنشاء إعلان B2B')}
        </h1>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-5 py-5">
          <p className="rounded-lg bg-de9-blue-tint px-3.5 py-2.5 text-[13px] font-semibold text-de9-blue">
            {L(
              'Annonce destinée aux clients entreprises (B2B) routés par de9de9.',
              'إعلان موجّه لعملاء الشركات (B2B) الموجَّهين من طرف de9de9.',
            )}
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="titre-offre">{L("Titre de l'offre", 'عنوان العرض')}</Label>
            <Input
              id="titre-offre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={L('Ex. Maintenance CVC entreprise', 'مثال: صيانة تكييف للمؤسسات')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{L('Familles & catégories', 'العائلات والفئات')}</Label>
            <div className="flex flex-wrap gap-2">
              {CATALOGUE.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={chipCls(families.includes(f.id))}
                  onClick={() => toggleFamily(f.id)}
                >
                  <span className="me-1">{f.icon}</span>
                  {f.name.fr}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{L('Wilayas / zone de couverture', 'الولايات / منطقة التغطية')}</Label>
            <div className="flex flex-wrap gap-2">
              {WILAYAS.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={chipCls(wilayas.includes(w))}
                  onClick={() => toggleWilaya(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="capacite">{L('Capacité / volume traitable', 'القدرة / الحجم القابل للمعالجة')}</Label>
            <Input
              id="capacite"
              value={capacite}
              onChange={(e) => setCapacite(e.target.value)}
              placeholder={L('Ex. jusqu’à 20 interventions / mois', 'مثال: حتى 20 تدخلًا / شهر')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="certifs">{L('Certifications & agréments', 'الشهادات والاعتمادات')}</Label>
            <Textarea
              id="certifs"
              rows={2}
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder={L('Ex. ISO 9001, agrément CACOBATPH…', 'مثال: ISO 9001…')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{L('Mode de tarification', 'طريقة التسعير')}</Label>
            <div className="inline-flex w-fit gap-2">
              {([
                { key: 'devis', label: L('Sur devis', 'حسب التسعيرة') },
                { key: 'demande', label: L('Sur demande', 'عند الطلب') },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTarification(opt.key)}
                  className={chipCls(tarification === opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="refs">{L('Références', 'المراجع')}</Label>
            <Textarea
              id="refs"
              rows={3}
              value={references}
              onChange={(e) => setReferences(e.target.value)}
              placeholder={L('Clients ou chantiers de référence…', 'عملاء أو مشاريع مرجعية…')}
            />
          </div>

          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="flex items-center gap-3 rounded-lg bg-card px-4 py-3 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
          >
            <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-de9-teal-tint text-de9-teal">
              <Users className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-de9-ink">
                {L('Affecter à un professionnel', 'تعيين لمحترف')}
              </span>
              <span className="block truncate text-[12px] text-de9-gray">{affecterSummary}</span>
            </span>
            <ChevronRight className="size-5 flex-none text-de9-gray rtl:rotate-180" />
          </button>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 border-t border-de9-line bg-card/95 px-4 py-3 backdrop-blur">
        <Button className="w-full" onClick={publish} disabled={createAnnonce.isPending}>
          {createAnnonce.isPending ? L('Publication…', 'جارٍ النشر…') : L("Publier l'annonce", 'نشر الإعلان')}
        </Button>
      </div>

      <AssignAnnonceModal open={assignOpen} onOpenChange={setAssignOpen} />

      <AnnonceCreatedModal open={created} onOpenChange={setCreated} onSeeAnnonces={goToAnnonces} />
    </div>
  );
}
