import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Check, X, UserPlus, Trophy } from 'lucide-react'
import { usePrestataireStore, workerById } from '@/stores/prestataireStore'
import type { OpenOffer, Reservation, SentOffer } from '@/types/prestataire'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input, Field } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AffecterDialog } from '../AffecterDialog'
import { WorkerAvatar } from '../WorkerAvatar'
import { formatDzd } from '@/lib/format'
import { cn } from '@/lib/utils'

type Tab = 'recues' | 'offres' | 'confirmes'

export function B2cScreen() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('recues')

  const TABS: { key: Tab; label: string }[] = [
    { key: 'recues', label: t('prestataire.b2c.tabRecues') },
    { key: 'offres', label: t('prestataire.b2c.tabOffres') },
    { key: 'confirmes', label: t('prestataire.b2c.tabConfirmes') },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t('prestataire.b2c.title')}
      </h1>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map((x) => (
          <button
            key={x.key}
            onClick={() => setTab(x.key)}
            className={cn(
              'flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm',
              tab === x.key ? 'bg-brand text-brand-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'recues' && <RecuesTab />}
      {tab === 'offres' && <OffresTab />}
      {tab === 'confirmes' && <ConfirmesTab />}
    </div>
  )
}

function RecuesTab() {
  const { t } = useTranslation()
  const reservations = usePrestataireStore((s) => s.reservations)
  const accept = usePrestataireStore((s) => s.acceptReservation)
  const refuse = usePrestataireStore((s) => s.refuseReservation)
  const assign = usePrestataireStore((s) => s.assignReservationWorker)
  const workers = usePrestataireStore((s) => s.workers)
  const [affecting, setAffecting] = useState<Reservation | null>(null)

  const recues = reservations.filter((r) => r.status === 'recue')
  if (recues.length === 0) return <Empty text={t('prestataire.b2c.emptyRecues')} />

  return (
    <div className="flex flex-col gap-3">
      {recues.map((r) => {
        const worker = workerById(workers, r.assignedWorkerId)
        return (
          <Card key={r.id}>
            <CardContent className="pt-5">
              <ReservationHead r={r} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" className="gap-1.5" onClick={() => accept(r.id)}>
                  <Check className="h-4 w-4" />
                  {t('prestataire.b2c.accept')}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => refuse(r.id)}>
                  <X className="h-4 w-4" />
                  {t('prestataire.b2c.refuse')}
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAffecting(r)}>
                  {worker ? <WorkerAvatar worker={worker} size="sm" /> : <UserPlus className="h-4 w-4" />}
                  {worker ? worker.name : t('prestataire.affecter.title')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
      <AffecterDialog
        open={!!affecting}
        onClose={() => setAffecting(null)}
        currentWorkerId={affecting?.assignedWorkerId}
        onConfirm={(wid) => affecting && assign(affecting.id, wid)}
      />
    </div>
  )
}

function ConfirmesTab() {
  const { t } = useTranslation()
  const reservations = usePrestataireStore((s) => s.reservations)
  const workers = usePrestataireStore((s) => s.workers)
  const confirmes = reservations.filter((r) => r.status === 'confirmee')
  if (confirmes.length === 0) return <Empty text={t('prestataire.b2c.emptyConfirmes')} />

  return (
    <div className="flex flex-col gap-3">
      {confirmes.map((r) => {
        const worker = workerById(workers, r.assignedWorkerId)
        return (
          <Card key={r.id}>
            <CardContent className="pt-5">
              <ReservationHead r={r} />
              <div className="mt-3 flex items-center gap-2">
                {worker && (
                  <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                    <WorkerAvatar worker={worker} size="sm" />
                    {worker.name}
                  </span>
                )}
                {r.fromWonBid && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-bold text-amber-500">
                    <Trophy className="h-3 w-3" />
                    {t('prestataire.b2c.fromBid')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function OffresTab() {
  const { t } = useTranslation()
  const [sub, setSub] = useState<'voir' | 'envoyees'>('voir')
  const openOffers = usePrestataireStore((s) => s.openOffers)
  const sentOffers = usePrestataireStore((s) => s.sentOffers)
  const [bidding, setBidding] = useState<OpenOffer | null>(null)

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <SubChip active={sub === 'voir'} onClick={() => setSub('voir')}>
          {t('prestataire.b2c.subVoir')}
        </SubChip>
        <SubChip active={sub === 'envoyees'} onClick={() => setSub('envoyees')}>
          {t('prestataire.b2c.subEnvoyees')}
        </SubChip>
      </div>

      {sub === 'voir' ? (
        openOffers.length === 0 ? (
          <Empty text={t('prestataire.b2c.emptyOffres')} />
        ) : (
          <div className="flex flex-col gap-3">
            {openOffers.map((o) => (
              <Card key={o.id}>
                <CardContent className="pt-5">
                  <h3 className="font-semibold leading-tight">{o.serviceName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{o.besoin}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.wilaya}</span>
                    <span>· {o.budgetLabel}</span>
                    <span>· {o.delai}</span>
                  </div>
                  <Button size="sm" className="mt-3" onClick={() => setBidding(o)}>
                    {t('prestataire.b2c.bid')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : sentOffers.length === 0 ? (
        <Empty text={t('prestataire.b2c.emptyEnvoyees')} />
      ) : (
        <div className="flex flex-col gap-3">
          {sentOffers.map((s) => (
            <SentOfferCard key={s.id} offer={s} />
          ))}
        </div>
      )}

      <BidDialog offer={bidding} onClose={() => setBidding(null)} />
    </div>
  )
}

function SentOfferCard({ offer }: { offer: SentOffer }) {
  const { t } = useTranslation()
  const color =
    offer.status === 'retenue' ? '#3FB36B' : offer.status === 'refusee' ? '#E7464E' : '#9AA4B2'
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-5">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight">{offer.serviceName}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{offer.message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDzd(offer.prixDzd)} · {offer.delai}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          {t(`prestataire.sentStatus.${offer.status}`)}
        </span>
      </CardContent>
    </Card>
  )
}

function BidDialog({ offer, onClose }: { offer: OpenOffer | null; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Dialog open={!!offer} onClose={onClose} title={offer?.serviceName ?? ''}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onClose()
        }}
        className="flex flex-col gap-4"
      >
        <Field label={t('prestataire.b2c.yourPrice')}>
          <Input inputMode="numeric" placeholder="ex. 45 000" />
        </Field>
        <Field label={t('prestataire.b2c.yourDelai')}>
          <Input placeholder="ex. 5 jours" />
        </Field>
        <Field label={t('prestataire.b2c.yourMessage')}>
          <Textarea placeholder="…" />
        </Field>
        <Button type="submit">{t('prestataire.b2c.sendBid')}</Button>
      </form>
    </Dialog>
  )
}

function ReservationHead({ r }: { r: Reservation }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">{r.id}</span>
        </div>
        <h3 className="mt-0.5 font-semibold leading-tight">{r.serviceName}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {r.clientName} · {r.dateLabel} · {r.wilaya}
        </p>
      </div>
      {r.priceDzd != null && (
        <span className="shrink-0 text-sm font-extrabold">{formatDzd(r.priceDzd)}</span>
      )}
    </div>
  )
}

function SubChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
        active ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
