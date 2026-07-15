import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, Copy, Check, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useTeam, useGenerateLink, useRemoveMember } from '../api/workers';
import type { Worker } from '../schemas/worker';

export function EffectifPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const { data, isPending, isError } = useTeam();
  const generateLink = useGenerateLink();
  const removeMember = useRemoveMember();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const workers = data ?? [];
  const slotWorkers = workers.filter((w) => w.type !== 'salarie');
  const used = slotWorkers.filter((w) => w.status === 'active').length;
  const total = slotWorkers.length;

  const active = workers.filter((w) => w.status === 'active');
  const pending = workers.filter((w) => w.status === 'pending');
  const empty = workers.filter((w) => w.status === 'empty');

  function copyLink(w: Worker) {
    const link = `de9de9.dz/join/${(w.token ?? '').split('/').pop() ?? ''}`;
    void navigator.clipboard?.writeText(link).catch(() => {});
    setCopiedId(w.id);
    window.setTimeout(() => setCopiedId((c) => (c === w.id ? null : c)), 1600);
  }

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <h1 className="text-[20px] font-extrabold text-de9-ink">{t('effectifTitle')}</h1>

      {isError && (
        <EmptyState
          title={L("Impossible de charger l'effectif", 'تعذّر تحميل فريق العمل')}
          description={L('Veuillez réessayer plus tard.', 'يرجى المحاولة لاحقًا.')}
        />
      )}

      {isPending && !isError && (
        <div className="flex animate-pulse flex-col gap-3">
          <div className="h-[72px] rounded-2xl border border-de9-line bg-card" />
          <div className="h-[68px] rounded-2xl border border-de9-line bg-card" />
          <div className="h-[68px] rounded-2xl border border-de9-line bg-card" />
        </div>
      )}

      {data && (
        <>
          {/* Slots card */}
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-de9-gray">
                  {L('Slots utilisés', 'الفتحات المستعملة')}
                </p>
                <p className="text-[22px] font-extrabold text-de9-ink">
                  {used}
                  <span className="text-de9-gray">/{total}</span>
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => navigate('/prestataire/agrandir')}
              >
                <Plus className="size-4" />
                {t('agrandir')}
              </Button>
            </CardContent>
          </Card>

          {/* Team list */}
          <div className="flex flex-col gap-3">
            {active.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3.5 rounded-2xl border border-de9-line bg-card p-4"
              >
                <WorkerAvatar worker={w} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[14px] font-bold text-de9-ink">{w.name}</span>
                    {w.type === 'salarie' && (
                      <span className="shrink-0 rounded-full bg-de9-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-de9-teal-dark">
                        🤝 de9de9
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[12.5px] text-de9-gray">
                    {w.type === 'salarie'
                      ? L(`${w.role} · Salarié de9de9`, `${w.role} · موظّف de9de9`)
                      : w.role}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-de9-teal-dark"
                    onClick={() => navigate(`/prestataire/effectif/${w.id}`)}
                  >
                    {t('voirPlus')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('supprimer')}
                    className="text-de9-red"
                    onClick={() => removeMember.mutate(w.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}

            {pending.map((w) => (
              <div
                key={w.id}
                className="flex flex-col gap-3 rounded-2xl border border-dashed border-de9-line bg-de9-row/50 p-4"
              >
                <div>
                  <p className="text-[14px] font-bold text-de9-ink">
                    {L('En attente de création…', 'في انتظار إنشاء الحساب…')}
                  </p>
                  <p className="text-[12.5px] text-de9-gray">
                    {L('Le professionnel doit créer son compte', 'يجب على المحترف إنشاء حسابه')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-secondary px-3 py-2 text-[12.5px] text-de9-ink">
                    de9de9.dz/join/{(w.token ?? '').split('/').pop() ?? ''}
                  </code>
                  <Button
                    variant={copiedId === w.id ? 'secondary' : 'outline'}
                    size="sm"
                    className={cn('gap-1.5', copiedId === w.id && 'text-de9-teal-dark')}
                    onClick={() => copyLink(w)}
                  >
                    {copiedId === w.id ? (
                      <>
                        <Check className="size-3.5" />
                        {t('copie')}
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        {t('copier')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {empty.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => generateLink.mutate()}
                disabled={generateLink.isPending}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-dashed border-de9-line bg-card p-4 text-start transition-colors hover:bg-de9-row disabled:opacity-60"
              >
                <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-secondary text-de9-teal-dark">
                  <UserPlus className="size-5" />
                </span>
                <span className="flex-1 text-[14px] font-bold text-de9-ink">{t('ajouterPro')}</span>
                <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
