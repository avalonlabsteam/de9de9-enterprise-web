import { useState, type ComponentProps } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { TonePill } from '@/components/actions/parts';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { personColour } from '@/lib/personColour';
import { proLoadError } from '@/lib/proErrors';
import { toProblem } from '@/api/problem';
import { missionPath } from '@/features/prestataire-missions/lib/paths';
import { useUpdateFiche, useWorker } from '../api/workers';
import type { WorkerMission, WorkerProfile } from '../schemas/worker';
import { ficheBody, shownOf, type Drafts, type FicheField } from '../lib/fiche';
import { visiteTag } from '../lib/visiteStatut';

/**
 * « Gestion du professionnel » — a member's profile and missions
 * (`GET /equipe/{id}/profil`, guide 15). The fiche saves on each blur.
 */
export function ProDetailPage() {
  const L = useL();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isPending, isError, error, refetch } = useWorker(id);
  const update = useUpdateFiche(id);
  const [drafts, setDrafts] = useState<Drafts>({});

  const saveWith = async (profile: WorkerProfile, pending: Drafts, retry: boolean): Promise<void> => {
    const built = ficheBody(profile, pending);
    if ('invalid' in built) {
      toast.error(
        built.invalid === 'heures'
          ? L('Heures / semaine : un nombre entier entre 0 et 168.', 'الساعات / الأسبوع: عدد صحيح بين 0 و168.')
          : L('Tarif horaire : un montant positif en DA.', 'التعرفة بالساعة: مبلغ موجب بالدينار.'),
      );
      return;
    }
    try {
      await update.mutateAsync(built.body);
      // Saved: the answer is in the cache — drop the drafts it covers, unless retyped meanwhile.
      setDrafts((d) => {
        const next = { ...d };
        for (const [field, value] of Object.entries(pending) as [FicheField, string][]) {
          if (next[field] === value) delete next[field];
        }
        return next;
      });
    } catch (e) {
      const problem = toProblem(e);
      // Saved by someone else meanwhile: reload the profile, then save again over it.
      if (problem.status === 409 && retry) {
        const fresh = await refetch();
        if (fresh.data) return saveWith(fresh.data, pending, false);
      }
      toast.error(problem.detail ?? L("La fiche n'a pas pu être enregistrée. Réessayez.", 'تعذّر حفظ البطاقة. أعد المحاولة.'));
    }
  };

  const commit = () => {
    if (!data) return;
    const shown = shownOf(data);
    // Only the fields that differ from the profile.
    const pending = Object.fromEntries(
      (Object.entries(drafts) as [FicheField, string][]).filter(([field, value]) => value.trim() !== shown[field].trim()),
    ) as Drafts;
    if (Object.keys(pending).length === 0) {
      setDrafts({});
      return;
    }
    void saveWith(data, pending, true);
  };

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate('/prestataire/effectif')}
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-de9-gray hover:text-de9-ink"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {L('Retour', 'رجوع')}
      </button>

      <h1 className="text-[20px] font-extrabold text-de9-ink">{L('Gestion du professionnel', 'إدارة المحترف')}</h1>

      {isError && (
        <EmptyState
          title={L('Professionnel introuvable', 'المحترف غير موجود')}
          description={toProblem(error).status === 404 ? undefined : proLoadError(toProblem(error), L)}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/prestataire/effectif')}>
              {L('Mon effectif', 'فريقي')}
            </Button>
          }
        />
      )}

      {isPending && !isError && (
        <div className="flex animate-pulse flex-col gap-4">
          <div className="h-24 rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
          <div className="h-48 rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
        </div>
      )}

      {data && (
        <>
          {/* Header */}
          <Card>
            <CardContent className="flex flex-col gap-3 py-5">
              <div className="flex items-center gap-4">
                <WorkerAvatar worker={{ name: data.nom, colorHex: personColour(data.id) }} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[16px] font-bold text-de9-ink">{data.nom}</span>
                    {data.kind === 'contractuel_de9de9' && <BadgeCheck className="size-4 shrink-0 text-de9-blue" />}
                  </div>
                  <p className="truncate text-[12.5px] text-de9-gray">
                    {data.role ?? data.skill ?? L('Ouvrier', 'عامل')}
                    {data.kind === 'contractuel_de9de9' && L(' · Salarié de9de9', ' · موظّف de9de9')}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex-none rounded-full px-2.5 py-1 text-[11.5px] font-bold',
                    data.actif ? 'bg-de9-teal-soft text-de9-teal-dark' : 'bg-secondary text-de9-gray',
                  )}
                >
                  {data.actif ? L('● Actif', '● نشط') : L('● Inactif', '● غير نشط')}
                </span>
              </div>
              {data.competences.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.competences.map((c) => (
                    <span key={c} className="rounded-full bg-de9-teal-tint px-2.5 py-1 text-[12px] font-semibold text-de9-teal-dark">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fiche — éditable: each blur saves the whole fiche */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-de9-gray">{L('Fiche — éditable', 'البطاقة — قابلة للتعديل')}</CardTitle>
              {update.isPending && <Loader2 className="size-4 animate-spin text-de9-teal" aria-label={L('Enregistrement…', 'جارٍ الحفظ…')} />}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  { field: 'role', label: L('Rôle', 'الدور'), maxLength: 128 },
                  { field: 'heures', label: L('Heures / semaine', 'الساعات / الأسبوع'), type: 'number', min: 0, max: 168 },
                  { field: 'tarif', label: L('Tarif horaire (DA)', 'التعرفة بالساعة (دج)'), type: 'number', min: 0 },
                  { field: 'whatsApp', label: 'WhatsApp', type: 'tel', ltr: true },
                  { field: 'skill', label: L('Compétences', 'المهارات'), maxLength: 128, hint: L('Séparées par « · »', 'مفصولة بـ « · »') },
                ] as const
              ).map((f) => (
                <FieldEditor
                  key={f.field}
                  label={f.label}
                  hint={'hint' in f ? f.hint : undefined}
                  value={drafts[f.field] ?? shownOf(data)[f.field]}
                  inputProps={{
                    type: 'type' in f ? f.type : 'text',
                    min: 'min' in f ? f.min : undefined,
                    max: 'max' in f ? f.max : undefined,
                    maxLength: 'maxLength' in f ? f.maxLength : undefined,
                    dir: 'ltr' in f ? 'ltr' : undefined,
                  }}
                  onChange={(v) => setDrafts((d) => ({ ...d, [f.field]: v }))}
                  onCommit={commit}
                />
              ))}
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-de9-gray">{L('Analytics', 'التحليلات')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <Metric value={String(data.analytics.missionsRealisees)} label={L('Missions réalisées', 'المهام المنجزة')} />
              <Metric
                value={data.analytics.satisfactionPercent != null ? `${data.analytics.satisfactionPercent} %` : '—'}
                label={L('Satisfaction', 'الرضا')}
              />
              <Metric
                value={data.analytics.delaiReponseHeures != null ? `${data.analytics.delaiReponseHeures} h` : '—'}
                label={L('Délai de réponse', 'مدة الاستجابة')}
              />
            </CardContent>
          </Card>

          {/* Missions assignées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-de9-gray">{L('Missions assignées', 'المهام المسنَدة')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="avenir">
                <TabsList>
                  <TabsTrigger value="avenir">
                    {L('À venir', 'قادمة')} · {data.missionsAVenir.length}
                  </TabsTrigger>
                  <TabsTrigger value="passees">
                    {L('Passées', 'سابقة')} · {data.missionsPassees.length}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="avenir" className="pt-3">
                  {data.missionsAVenir.length > 0 ? (
                    <MissionList missions={data.missionsAVenir} />
                  ) : (
                    <EmptyState
                      title={L('Aucune mission à venir', 'لا توجد مهام قادمة')}
                      description={L('Les missions affectées apparaîtront ici.', 'ستظهر المهام المسنَدة هنا.')}
                    />
                  )}
                </TabsContent>
                <TabsContent value="passees" className="pt-3">
                  {data.missionsPassees.length > 0 ? (
                    <MissionList missions={data.missionsPassees} />
                  ) : (
                    <EmptyState
                      title={L('Aucune mission passée', 'لا توجد مهام سابقة')}
                      description={L('Les missions terminées apparaîtront ici.', 'ستظهر المهام المنتهية هنا.')}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/** One visit the member is on — opens « Détail de la mission » focused on it. */
function MissionList({ missions }: { missions: WorkerMission[] }) {
  const L = useL();
  return (
    <ul className="divide-y divide-border">
      {missions.map((m) => {
        const tag = visiteTag(m.statut, L);
        return (
          <li key={m.visiteId}>
            <Link to={missionPath(m.contractId, m.visiteId)} className="flex items-center gap-3 py-3 hover:bg-secondary/40">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-de9-ink">{m.prevueLeLabel ?? L('Date à fixer', 'التاريخ سيُحدّد')}</p>
                <p className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-de9-slate">
                  {m.contractRef && <span dir="ltr">{m.contractRef}</span>}
                  {m.contractRef && m.roleOnSite && <span aria-hidden>·</span>}
                  {m.roleOnSite && <span>{m.roleOnSite}</span>}
                </p>
                {m.adresse && (
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-de9-gray">
                    <MapPin className="size-3.5 flex-none text-de9-teal" />
                    {m.adresse}
                  </p>
                )}
              </div>
              {tag && <TonePill tag={tag} className="flex-none" />}
              <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function FieldEditor({
  label,
  hint,
  value,
  inputProps,
  onChange,
  onCommit,
}: {
  label: string;
  hint?: string;
  value: string;
  inputProps: ComponentProps<typeof Input>;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12.5px] text-de9-gray">{label}</Label>
      <Input
        {...inputProps}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      {hint && <span className="text-[11.5px] text-de9-gray">{hint}</span>}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-background px-2 py-3 text-center">
      <span className="text-[20px] font-bold text-de9-ink">{value}</span>
      <span className="text-[11.5px] font-semibold text-de9-gray">{label}</span>
    </div>
  );
}
