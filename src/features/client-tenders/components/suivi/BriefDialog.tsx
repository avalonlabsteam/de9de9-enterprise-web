import { useState } from 'react';
import { Check, FileText, Lock, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toProblem } from '@/api/problem';
import { WILAYAS } from '@/lib/catalogue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PieceSlot } from '@/components/common/PieceSlot';
import type { Brief, SuiviAction } from '../../schemas/suivi';
import { ConfirmDialog } from './Dialogs';

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-[13px] font-bold',
        active ? 'bg-de9-teal text-white' : 'bg-secondary text-de9-teal-dark',
      )}
    >
      {children}
    </button>
  );
}

/**
 * « Modifier la demande » — the form is `brief`, already holding the demande's
 * values. `save` sends the PUT the action describes; it resolves true when the
 * screen was replaced, false to keep the form open (the error is shown).
 */
export function BriefDialog({
  brief,
  action,
  busy,
  onClose,
  save,
}: {
  brief: Brief;
  action: SuiviAction;
  busy: boolean;
  onClose: () => void;
  save: (body: Record<string, unknown>, files: File[]) => Promise<{ ok: boolean; error?: unknown }>;
}) {
  const L = useL();
  const [services, setServices] = useState<string[]>(
    brief.services.options.filter((o) => o.selectionne).map((o) => o.code),
  );
  const [description, setDescription] = useState(brief.description ?? '');
  const [wilaya, setWilaya] = useState(brief.wilaya ?? '');
  // The stored preset, or none when the stored date matches no preset.
  const [delai, setDelai] = useState<string | null>(brief.delai?.code ?? null);
  const [budget, setBudget] = useState(brief.budget?.maxDzd != null ? String(brief.budget.maxDzd) : '');
  const [cadence, setCadence] = useState<number | null>(brief.typeBesoin?.valeur ?? null);
  const [frequence, setFrequence] = useState<number | null>(brief.frequence?.valeur ?? null);
  const [criteres, setCriteres] = useState(brief.criteresSelection ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  // The récurrent option's number, read from the answer (2 today).
  const recurrentValeur = brief.typeBesoin?.options.find((o) => o.code === 'recurrent')?.valeur ?? 2;
  const isRecurrent = cadence === recurrentValeur;
  const wilayas = wilaya && !WILAYAS.includes(wilaya as (typeof WILAYAS)[number]) ? [wilaya, ...WILAYAS] : WILAYAS;

  const bodyOf = (): Record<string, unknown> | null => {
    if (budget && !/^\d+$/.test(budget)) {
      setError(L('Budget : un montant en DA, sans décimales.', 'الميزانية: مبلغ بالدينار دون كسور.'));
      return null;
    }
    if (isRecurrent && frequence == null) {
      setError(L('Choisissez une fréquence pour un contrat récurrent.', 'اختر تواترًا للعقد المتكرر.'));
      return null;
    }
    return {
      version: brief.version,
      subCategoryCodes: services,
      description,
      wilaya,
      // Same preset (or none) keeps the stored date; another is recounted from today.
      delai,
      budgetMaxDzd: budget ? Number(budget) : null,
      cadence,
      // Only with a recurrent contract.
      ...(isRecurrent ? { frequence } : {}),
      criteresSelection: criteres,
    };
  };

  const submit = async () => {
    const body = bodyOf();
    if (!body) return;
    setError(null);
    const result = await save(body, files);
    if (!result.ok && result.error) {
      const problem = toProblem(result.error);
      setError(problem.detail ?? L('Enregistrement impossible. Réessayez.', 'تعذّر الحفظ. أعد المحاولة.'));
    }
  };

  const onSave = () => {
    // At « Devis en cours » the action asks first: prestataires will be told.
    if (action.confirm) {
      if (bodyOf()) setAsking(true);
      return;
    }
    void submit();
  };

  const docs = brief.documents;

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{brief.formulaire.titre}</DialogTitle>
          </DialogHeader>

          {brief.formulaire.avertissement && (
            <p className="flex gap-2 rounded-lg bg-de9-orange/15 px-3.5 py-3 text-[13px] text-de9-orange-deep">
              <TriangleAlert className="mt-0.5 size-4 flex-none" />
              {brief.formulaire.avertissement}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3.5 py-3 text-[13px] font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4">
            {/* Category: locked, not sent */}
            {brief.categorie && (
              <div className="flex items-center gap-2 text-[13px] text-de9-slate">
                <Lock className="size-3.5" />
                <span aria-hidden>{brief.categorie.icone}</span>
                <span className="font-semibold text-de9-ink">{brief.categorie.label}</span>
              </div>
            )}

            {brief.services.options.length > 0 && (
              <div>
                <Label className="mb-2 block">{L('Services', 'الخدمات')}</Label>
                <div className="flex flex-wrap gap-2">
                  {brief.services.options.map((option) => {
                    const on = services.includes(option.code);
                    return (
                      <button
                        key={option.code}
                        type="button"
                        aria-pressed={on}
                        disabled={!brief.services.modifiable}
                        onClick={() =>
                          setServices((prev) => (on ? prev.filter((c) => c !== option.code) : [...prev, option.code]))
                        }
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-60',
                          on ? 'bg-de9-teal text-white' : 'bg-secondary text-de9-ink',
                        )}
                      >
                        {on && <Check className="size-3.5" />}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="brief-description" className="mb-2 block">
                {L('Description détaillée du besoin', 'وصف مفصّل للحاجة')}
              </Label>
              <Textarea id="brief-description" rows={4} maxLength={8000} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <Label className="mb-2 block">{L("Wilaya / lieu d'exécution", 'الولاية / مكان التنفيذ')}</Label>
              <Select value={wilaya} onValueChange={setWilaya}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={L('Choisir une wilaya', 'اختر ولاية')} />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {brief.delai && (
              <div>
                <Label className="mb-2 block">{L('Délai souhaité', 'الأجل المطلوب')}</Label>
                {/* No preset matches the stored date: show it, select nothing. */}
                {!brief.delai.code && brief.delai.label && delai === null && (
                  <p className="mb-2 text-[12.5px] text-de9-slate">
                    {L('Actuellement : ', 'حاليًا: ')}
                    {brief.delai.label}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {brief.delai.options.map((option) => (
                    <Chip key={option.code} active={delai === option.code} onClick={() => setDelai(option.code)}>
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="brief-budget" className="mb-2 block">
                {L('Budget estimatif', 'الميزانية التقديرية')}
              </Label>
              <div className="relative">
                <Input
                  id="brief-budget"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={L('Sans budget', 'دون ميزانية')}
                  className="pe-14"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value.replace(/\s/g, ''))}
                />
                <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-[13px] text-de9-gray">
                  DA
                </span>
              </div>
            </div>

            {brief.typeBesoin && brief.typeBesoin.options.length > 0 && (
              <div>
                <Label className="mb-2 block">{L('Type de besoin', 'نوع الحاجة')}</Label>
                <div className="flex flex-wrap gap-2">
                  {brief.typeBesoin.options.map((option) => (
                    <Chip key={option.code} active={cadence === option.valeur} onClick={() => setCadence(option.valeur ?? null)}>
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {isRecurrent && brief.frequence && (
              <div>
                <Label className="mb-2 block">{L('Fréquence', 'التواتر')}</Label>
                <div className="flex flex-wrap gap-2">
                  {brief.frequence.options.map((option) => (
                    <Chip key={option.code} active={frequence === option.valeur} onClick={() => setFrequence(option.valeur ?? null)}>
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="brief-criteres" className="mb-2 block">
                {L('Critères de sélection prioritaires', 'معايير الاختيار ذات الأولوية')}
              </Label>
              <Textarea id="brief-criteres" rows={3} maxLength={4000} value={criteres} onChange={(e) => setCriteres(e.target.value)} />
            </div>

            {docs && (
              <div>
                <Label className="mb-2 block">{L('Documents joints', 'المستندات المرفقة')}</Label>
                {/* Files already on the demande: listed, never removed. */}
                {docs.fichiers.length > 0 && (
                  <ul className="mb-2 flex flex-col gap-1.5">
                    {docs.fichiers.map((f) => (
                      <li key={f.id ?? f.nom} className="flex items-center gap-2 text-[13px] text-de9-ink">
                        <FileText className="size-4 flex-none text-de9-teal-dark" />
                        <span className="truncate">{f.nom}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {files.length > 0 && (
                  <ul className="mb-2 flex flex-col gap-1.5">
                    {files.map((file, i) => (
                      <li key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-[13px]">
                        <FileText className="size-4 flex-none text-de9-teal-dark" />
                        <span className="min-w-0 flex-1 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                          aria-label={L('Retirer', 'إزالة')}
                          className="grid size-6 place-items-center rounded-full hover:bg-secondary"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {docs.ajoutPossible && (
                  <PieceSlot
                    label={L('Ajouter un document', 'إضافة مستند')}
                    hint={docs.indication ?? undefined}
                    accept="application/pdf,image/*"
                    maxBytes={10 * 1024 * 1024}
                    onReject={() => toast.error(L('Fichier trop lourd : 10 Mo maximum.', 'الملف ثقيل: 10 ميغابايت كحد أقصى.'))}
                    value={null}
                    onChange={(picked) => {
                      const file = picked?.file;
                      if (file) setFiles((prev) => [...prev, file]);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              {L('Annuler', 'إلغاء')}
            </Button>
            <Button onClick={onSave} disabled={busy}>
              {busy ? L('Enregistrement…', 'جارٍ الحفظ…') : brief.formulaire.bouton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {asking && (
        <ConfirmDialog
          action={action}
          busy={busy}
          onClose={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            void submit();
          }}
        />
      )}
    </>
  );
}
