import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, UserPlus, Upload, FileCheck } from 'lucide-react'
import { usePrestataireStore, workerById } from '@/stores/prestataireStore'
import type { B2bJob, FactureStatus } from '@/types/prestataire'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AffecterDialog } from './AffecterDialog'
import { FactureUploadDialog } from './FactureUploadDialog'
import { WorkerAvatar } from './WorkerAvatar'
import { formatDzd } from '@/lib/format'

const FACTURE_COLOR: Record<FactureStatus, string> = {
  none: '#9AA4B2',
  envoyee: '#2F9BE0',
  recue: '#7C5CFC',
  approuvee: '#3FB36B',
  contestee: '#E7464E',
}

export function B2bScreen() {
  const { t } = useTranslation()
  const jobs = usePrestataireStore((s) => s.b2bJobs)
  const workers = usePrestataireStore((s) => s.workers)
  const assign = usePrestataireStore((s) => s.assignJobWorker)
  const upload = usePrestataireStore((s) => s.uploadFacture)
  const [affecting, setAffecting] = useState<B2bJob | null>(null)
  const [facturing, setFacturing] = useState<B2bJob | null>(null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t('prestataire.b2b.title')}
      </h1>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          {t('prestataire.b2b.empty')}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const worker = workerById(workers, job.assignedWorkerId)
            const color = FACTURE_COLOR[job.factureStatus]
            return (
              <Card key={job.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                        <Building2 className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">{job.id}</span>
                        </p>
                        <h3 className="truncate font-semibold leading-tight">{job.serviceName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {job.clientEntreprise} · {job.occurrenceLabel} · {job.dateLabel}
                        </p>
                      </div>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: `${color}1f`, color }}
                    >
                      {t(`prestataire.factureStatus.${job.factureStatus}`)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAffecting(job)}>
                      {worker ? <WorkerAvatar worker={worker} size="sm" /> : <UserPlus className="h-4 w-4" />}
                      {worker ? worker.name : t('prestataire.b2b.noWorker')}
                    </Button>

                    {job.factureStatus === 'none' ? (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setFacturing(job)}>
                        <Upload className="h-4 w-4" />
                        {t('prestataire.b2b.uploadFacture')}
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <FileCheck className="h-4 w-4" />
                        {job.factureAmountDzd ? formatDzd(job.factureAmountDzd) : t('prestataire.b2b.factureSent')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AffecterDialog
        open={!!affecting}
        onClose={() => setAffecting(null)}
        currentWorkerId={affecting?.assignedWorkerId}
        onConfirm={(wid) => affecting && assign(affecting.id, wid)}
      />
      <FactureUploadDialog
        open={!!facturing}
        onClose={() => setFacturing(null)}
        onConfirm={(amount) => facturing && upload(facturing.id, amount)}
      />
    </div>
  )
}
