import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { useL } from '@/lib/i18n';
import { useWorker, useUpdateMember } from '../api/workers';
import type { MemberFields } from '../schemas/worker';

export function ProDetailPage() {
  const L = useL();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isPending, isError } = useWorker(id);
  const update = useUpdateMember();

  const [fields, setFields] = useState<MemberFields>({});
  useEffect(() => {
    if (data) setFields({ role: data.role, hours: data.hours, tarif: data.tarif, avail: data.avail });
  }, [data]);

  function commit(key: keyof MemberFields, value: string) {
    if (!id) return;
    update.mutate({ id, patch: { [key]: value } });
  }

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

      <h1 className="text-[20px] font-extrabold text-de9-ink">
        {L('Gestion du professionnel', 'إدارة المحترف')}
      </h1>

      {isError && (
        <EmptyState
          title={L('Professionnel introuvable', 'المحترف غير موجود')}
          description={L('Veuillez réessayer plus tard.', 'يرجى المحاولة لاحقًا.')}
        />
      )}

      {isPending && !isError && (
        <div className="h-40 animate-pulse rounded-2xl border border-de9-line bg-card" />
      )}

      {data && (
        <>
          {/* Header card */}
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <WorkerAvatar worker={data} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[16px] font-extrabold text-de9-ink">{data.name}</span>
                  {data.type === 'salarie' && (
                    <span className="shrink-0 rounded-full bg-de9-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-de9-teal-dark">
                      🤝 de9de9
                    </span>
                  )}
                </div>
                <p className="truncate text-[12.5px] text-de9-gray">{data.role}</p>
              </div>
              <span className="flex-none rounded-full bg-de9-teal/10 px-2.5 py-1 text-[11.5px] font-bold text-de9-teal-dark">
                {L('● Actif', '● نشط')}
              </span>
            </CardContent>
          </Card>

          {/* Fiche — éditable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">{L('Fiche — éditable', 'البطاقة — قابلة للتعديل')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldEditor
                label={L('Rôle', 'الدور')}
                value={fields.role ?? ''}
                onChange={(v) => setFields((f) => ({ ...f, role: v }))}
                onCommit={(v) => commit('role', v)}
              />
              <FieldEditor
                label={L('Heures travaillées', 'ساعات العمل')}
                value={fields.hours ?? ''}
                onChange={(v) => setFields((f) => ({ ...f, hours: v }))}
                onCommit={(v) => commit('hours', v)}
              />
              <FieldEditor
                label={L('Tarif', 'التعرفة')}
                value={fields.tarif ?? ''}
                onChange={(v) => setFields((f) => ({ ...f, tarif: v }))}
                onCommit={(v) => commit('tarif', v)}
              />
              <FieldEditor
                label={L('Disponibilité', 'التوفّر')}
                value={fields.avail ?? ''}
                onChange={(v) => setFields((f) => ({ ...f, avail: v }))}
                onCommit={(v) => commit('avail', v)}
              />
            </CardContent>
          </Card>

          {data.type === 'salarie' && (
            <>
              {/* Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[15px]">{L('Analytics', 'التحليلات')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3">
                  <Metric value="128" label={L('Missions réalisées', 'المهام المنجزة')} />
                  <Metric value="96%" label={L('Satisfaction', 'الرضا')} />
                  <Metric value="2h" label={L('Délai de réponse', 'مدة الاستجابة')} />
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[15px]">{L('Statistiques', 'الإحصائيات')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Metric value="312 000 DA" label={L('CA global', 'رقم الأعمال الإجمالي')} />
                    <Metric value="47" label={L('Sollicitations', 'الطلبات')} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[13px] font-bold text-de9-ink">
                      {L('CA par sous-catégorie', 'رقم الأعمال حسب الفئة الفرعية')}
                    </p>
                    <BarRow label={L('Nettoyage', 'التنظيف')} value={128000} max={128000} />
                    <BarRow label={L('Climatisation', 'التكييف')} value={96000} max={128000} />
                    <BarRow label={L('Plomberie', 'السباكة')} value={88000} max={128000} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Metric value="12" label={L('Offres postulées', 'العروض المقدَّمة')} />
                    <Metric value="7" label={L('Offres retenues', 'العروض المقبولة')} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Missions assignées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">{L('Missions assignées', 'المهام المسنَدة')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="avenir">
                <TabsList>
                  <TabsTrigger value="avenir">{L('À venir', 'قادمة')}</TabsTrigger>
                  <TabsTrigger value="passees">{L('Passées', 'سابقة')}</TabsTrigger>
                </TabsList>
                <TabsContent value="avenir" className="pt-3">
                  <EmptyState
                    title={L('Aucune mission à venir', 'لا توجد مهام قادمة')}
                    description={L('Les missions affectées apparaîtront ici.', 'ستظهر المهام المسنَدة هنا.')}
                  />
                </TabsContent>
                <TabsContent value="passees" className="pt-3">
                  <EmptyState
                    title={L('Aucune mission passée', 'لا توجد مهام سابقة')}
                    description={L('Les missions terminées apparaîtront ici.', 'ستظهر المهام المنتهية هنا.')}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function FieldEditor({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12.5px] text-de9-gray">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
      />
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-de9-row/60 px-2 py-3 text-center">
      <span className="text-[16px] font-extrabold text-de9-ink">{value}</span>
      <span className="text-[11.5px] font-medium text-de9-gray">{label}</span>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(6, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[12.5px] text-de9-gray">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-de9-teal-dark" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 shrink-0 text-end text-[12px] font-bold text-de9-ink">
        {value.toLocaleString('fr-FR')}
      </span>
    </div>
  );
}
