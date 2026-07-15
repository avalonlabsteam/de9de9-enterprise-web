import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Headset } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProjectionBadge, StatusBadge } from '@/components/common/StatusBadge';
import { Stepper } from '@/components/common/Stepper';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { AffecterModal } from '@/components/common/AffecterModal';
import { DocViewer } from '@/components/common/DocViewer';
import { uiActions } from '@/stores/uiStore';
import type { B2bJob } from '../schemas/b2b';
import { useB2bAction, useB2bJob, useB2bWorkers } from '../api/b2b';
import { factureBadge } from './factureBadge';
import { UploadFactureSheet } from './UploadFactureSheet';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-[13px] text-de9-gray">{label}</span>
      <span className="text-end text-[13px] font-medium text-de9-ink">{value}</span>
    </div>
  );
}

/** Primary CTA driven by the mission status. */
function primaryFor(status: B2bJob['status']): { fr: string; ar: string; kind: 'affect' | 'upload' } | null {
  switch (status) {
    case 'confirmed':
      return { fr: 'Affecter un ouvrier', ar: 'إسناد عامل', kind: 'affect' };
    case 'doneNoInvoice':
      return { fr: 'Téléverser la facture', ar: 'رفع الفاتورة', kind: 'upload' };
    case 'doneDisputed':
      return { fr: 'Re-téléverser la facture corrigée', ar: 'إعادة رفع الفاتورة المصححة', kind: 'upload' };
    default:
      return null;
  }
}

export function B2bDetailPage() {
  const L = useL();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: job, isPending, isError } = useB2bJob(id);
  const { data: workers } = useB2bWorkers();
  const action = useB2bAction();

  const [affectMode, setAffectMode] = useState<'affect' | 'changer' | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="h-64 animate-pulse rounded-2xl border border-de9-line bg-card/60" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <EmptyState
          title={L('Mission introuvable', 'المهمة غير موجودة')}
          description={L('Cette mission n’existe pas ou a été retirée.', 'هذه المهمة غير موجودة أو تمت إزالتها.')}
          action={
            <Button variant="outline" onClick={() => navigate('/prestataire/b2b')}>
              {L('Retour aux missions', 'العودة إلى المهام')}
            </Button>
          }
        />
      </div>
    );
  }

  const fb = factureBadge(job);
  const worker = workers?.find((w) => w.id === job.assignedWorkerId);
  const primary = primaryFor(job.status);
  const hasFacture = job.factureStatus !== 'none';

  const docStatus: 'waiting' | 'approved' | 'contested' | undefined =
    job.factureStatus === 'approuvee'
      ? 'approved'
      : job.factureStatus === 'contestee'
        ? 'contested'
        : hasFacture
          ? 'waiting'
          : undefined;

  const runAffect = (ids: string[], mode: 'affect' | 'changer') => {
    action.mutate({ id: job.id, action: mode, workerIds: ids });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-24">
      <button
        type="button"
        onClick={() => navigate('/prestataire/b2b')}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-de9-gray hover:text-de9-ink"
      >
        <ArrowLeft className="size-4" />
        {L('Missions B2B', 'مهام B2B')}
      </button>

      {/* Header card */}
      <Card className="mb-4">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2 text-[13px] font-bold text-de9-gray">
            <Building2 className="size-4 flex-none" />
            <span className="truncate">{job.clientEntreprise}</span>
          </div>
          <CardTitle className="text-[18px]">{job.serviceName}</CardTitle>
          <p className="text-[13px] text-de9-gray">
            {job.occurrenceLabel} · {job.dateLabel}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ProjectionBadge code={job.status} projection="pro" />
            <StatusBadge label={L(fb.fr, fb.ar)} kind={fb.kind} />
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => uiActions.openSupport()}>
            <Headset className="size-4" />
            {L('Contacter de9de9', 'اتصل بـ de9de9')}
          </Button>
        </CardContent>
      </Card>

      {/* Affecté à */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-[15px]">{L('Affecté à', 'مُسند إلى')}</CardTitle>
        </CardHeader>
        <CardContent>
          {job.assignedWorkerId ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-de9-line bg-secondary py-1 ps-1 pe-3 text-[13px] font-bold text-de9-ink">
              <WorkerAvatar worker={{ name: worker?.name ?? '—', colorHex: worker?.colorHex }} size={24} />
              <span>{worker?.name ?? job.assignedWorkerId}</span>
            </div>
          ) : (
            <p className="text-[13px] text-de9-gray">{L('Aucun ouvrier affecté', 'لا يوجد عامل مُسند')}</p>
          )}
        </CardContent>
      </Card>

      {/* Progression */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <Stepper status={job.status} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mb-4 space-y-2">
        {primary && (
          <Button
            className="w-full"
            disabled={action.isPending}
            onClick={() => {
              if (primary.kind === 'affect') setAffectMode('affect');
              else setUploadOpen(true);
            }}
          >
            {L(primary.fr, primary.ar)}
          </Button>
        )}
        {job.assignedWorkerId && (
          <Button variant="outline" className="w-full" onClick={() => setAffectMode('changer')}>
            {L("Changer l'ouvrier", 'تغيير العامل')}
          </Button>
        )}
        {hasFacture && (
          <Button variant="outline" className="w-full" onClick={() => setDocOpen(true)}>
            {L('Voir la facture', 'عرض الفاتورة')}
          </Button>
        )}
      </div>

      {/* Détails de l'occurrence */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-[15px]">{L("Détails de l'occurrence", 'تفاصيل التكرار')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            <DetailRow label={L('Adresse', 'العنوان')} value={job.addr ?? '—'} />
            <DetailRow label={L('Date / heure', 'التاريخ / الوقت')} value={job.dateLabel} />
            <DetailRow label={L('Fréquence', 'التكرار')} value={job.freq ?? '—'} />
            <DetailRow label={L('Instructions', 'التعليمات')} value={job.instr ?? '—'} />
          </div>
        </CardContent>
      </Card>

      {/* Historique des occurrences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">{L('Historique des occurrences', 'سجل التكرارات')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {job.history && job.history.length > 0 ? (
            <div className="space-y-3">
              {job.history.map((h, i) => (
                <div key={`${h.label}-${i}`}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold text-de9-ink">{h.label}</p>
                      <p className="text-[12px] text-de9-gray">{h.date}</p>
                    </div>
                    <ProjectionBadge code={h.status} projection="pro" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-de9-gray">{L('Aucun historique', 'لا يوجد سجل')}</p>
          )}
        </CardContent>
      </Card>

      <AffecterModal
        open={affectMode != null}
        onOpenChange={(o) => !o && setAffectMode(null)}
        assignedIds={job.assignedWorkerId ? [job.assignedWorkerId] : []}
        title={affectMode === 'changer' ? L("Changer l'ouvrier", 'تغيير العامل') : undefined}
        onConfirm={(ids) => runAffect(ids, affectMode ?? 'affect')}
      />

      <UploadFactureSheet open={uploadOpen} onOpenChange={setUploadOpen} job={job} />

      <DocViewer
        open={docOpen}
        onOpenChange={setDocOpen}
        doc={{
          montant: job.factureAmountDzd != null ? `${job.factureAmountDzd.toLocaleString('fr-DZ')} DZD` : undefined,
          emetteur: job.clientEntreprise,
          date: job.dateLabel,
          statut: L(fb.fr, fb.ar),
          status: docStatus,
        }}
      />
    </div>
  );
}
