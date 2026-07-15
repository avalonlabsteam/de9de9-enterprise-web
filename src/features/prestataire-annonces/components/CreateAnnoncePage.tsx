import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Plus, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { CATALOGUE, WILAYAS } from '@/lib/catalogue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PieceSlot, type PieceFile } from '@/components/common/PieceSlot';
import { useCreateAnnonce } from '../api/annonces';
import { useAnnonceDraftStore } from '../stores/annonceDraftStore';
import { AnnonceCreatedModal } from './AnnonceCreatedModal';
import { AssignAnnonceModal } from './AssignAnnonceModal';

type AnnonceType = 'b2c' | 'b2b';

const B2C_CATEGORIES = [
  { key: 'climatisation', emoji: '❄️', label: 'Climatisation' },
  { key: 'plomberie', emoji: '🚿', label: 'Plomberie' },
  { key: 'electricite', emoji: '⚡', label: 'Électricité' },
] as const;

interface ServiceRow {
  id: number;
  name: string;
  prix: string;
}

function chipCls(active: boolean): string {
  return cn(
    'rounded-full border px-3 py-1.5 text-[13px] font-bold transition-colors',
    active
      ? 'border-de9-teal bg-de9-teal text-white'
      : 'border-de9-line bg-card text-de9-gray hover:text-de9-ink',
  );
}

export function CreateAnnoncePage() {
  const L = useL();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const type: AnnonceType = params.get('type') === 'b2b' ? 'b2b' : 'b2c';

  const createAnnonce = useCreateAnnonce();
  const selectedProIds = useAnnonceDraftStore((s) => s.selectedProIds);
  const resetDraft = useAnnonceDraftStore((s) => s.reset);
  const [created, setCreated] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  // B2C state
  const [photo, setPhoto] = useState<PieceFile | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState<ServiceRow[]>([{ id: 1, name: '', prix: '' }]);

  // B2B state
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

  const addService = () =>
    setServices((prev) => [...prev, { id: (prev[prev.length - 1]?.id ?? 0) + 1, name: '', prix: '' }]);
  const removeService = (id: number) => setServices((prev) => prev.filter((s) => s.id !== id));
  const updateService = (id: number, patch: Partial<ServiceRow>) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const serviceNameForPayload = (): string => {
    if (type === 'b2c') {
      return B2C_CATEGORIES.find((c) => c.key === category)?.label ?? L('Annonce B2C', 'إعلان B2C');
    }
    const names = families
      .map((id) => CATALOGUE.find((f) => f.id === id)?.name.fr)
      .filter((n): n is string => Boolean(n));
    return names.length > 0 ? names.join(', ') : L('Offre B2B', 'عرض B2B');
  };

  const publish = () => {
    createAnnonce.mutate(
      { title: title.trim() || serviceNameForPayload(), serviceName: serviceNameForPayload(), type },
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
          {type === 'b2c'
            ? L('Créer une annonce B2C', 'إنشاء إعلان B2C')
            : L('Créer une annonce B2B', 'إنشاء إعلان B2B')}
        </h1>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-5 py-5">
          {type === 'b2b' && (
            <p className="rounded-xl border border-[#C6A8F0] bg-[#F3ECFC] px-3.5 py-2.5 text-[13px] font-semibold text-[#6D3FB5] dark:border-[#4A3570] dark:bg-[#241733] dark:text-[#C6A8F0]">
              {L(
                'Annonce destinée aux clients entreprises (B2B) routés par de9de9.',
                'إعلان موجّه لعملاء الشركات (B2B) الموجَّهين من طرف de9de9.',
              )}
            </p>
          )}

          {type === 'b2c' ? (
            <>
              <div className="flex flex-col gap-2">
                <Label>{L('Photo', 'صورة')}</Label>
                <PieceSlot
                  label={L("Photo de l'annonce", 'صورة الإعلان')}
                  hint={L('JPG ou PNG', 'JPG أو PNG')}
                  value={photo}
                  onChange={setPhoto}
                  fileName="photo-annonce.jpg"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="titre">{L("Titre de l'annonce", 'عنوان الإعلان')}</Label>
                <Input
                  id="titre"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={L('Ex. Entretien climatiseur à domicile', 'مثال: صيانة مكيف في المنزل')}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>{L('Catégorie', 'الفئة')}</Label>
                <div className="flex flex-wrap gap-2">
                  {B2C_CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      className={chipCls(category === c.key)}
                      onClick={() => setCategory(category === c.key ? '' : c.key)}
                    >
                      <span className="me-1">{c.emoji}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="desc">{L('Description', 'الوصف')}</Label>
                <Textarea
                  id="desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={L('Décrivez la prestation…', 'صف الخدمة…')}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>{L('Services & tarifs', 'الخدمات والأسعار')}</Label>
                <div className="flex flex-col gap-2">
                  {services.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Input
                        value={s.name}
                        onChange={(e) => updateService(s.id, { name: e.target.value })}
                        placeholder={L('Service', 'الخدمة')}
                        className="flex-1"
                      />
                      <Input
                        value={s.prix}
                        onChange={(e) => updateService(s.id, { prix: e.target.value })}
                        placeholder={L('Prix DZD', 'السعر DZD')}
                        className="w-28"
                        inputMode="numeric"
                      />
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeService(s.id)}
                          className="flex size-9 flex-none items-center justify-center rounded-lg text-de9-gray hover:bg-black/5 dark:hover:bg-white/5"
                          aria-label={L('Supprimer le service', 'حذف الخدمة')}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addService}
                  className="inline-flex w-fit items-center gap-1.5 text-[13px] font-bold text-de9-teal-dark"
                >
                  <Plus className="size-4" />
                  {L('+ Ajouter un service', '+ إضافة خدمة')}
                </button>
              </div>
            </>
          ) : (
            <>
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
                <div className="inline-flex w-fit rounded-full border border-de9-line bg-secondary p-1">
                  {([
                    { key: 'devis', label: L('Sur devis', 'حسب التسعيرة') },
                    { key: 'demande', label: L('Sur demande', 'عند الطلب') },
                  ] as const).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTarification(opt.key)}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors',
                        tarification === opt.key ? 'bg-card text-de9-ink shadow-sm' : 'text-de9-gray',
                      )}
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
            </>
          )}

          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="flex items-center gap-3 rounded-2xl border border-de9-line bg-de9-row px-4 py-3 text-start transition-colors hover:bg-secondary"
          >
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-secondary text-de9-slate">
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

      <AnnonceCreatedModal
        open={created}
        onOpenChange={setCreated}
        onSeeAnnonces={goToAnnonces}
      />
    </div>
  );
}
