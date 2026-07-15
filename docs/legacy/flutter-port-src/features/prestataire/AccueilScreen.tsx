import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Inbox, Building2, User, Briefcase, Users, BarChart3, ChevronRight } from 'lucide-react'
import { usePrestataireStore } from '@/stores/prestataireStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function AccueilScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [chooseOpen, setChooseOpen] = useState(false)
  const reservations = usePrestataireStore((s) => s.reservations)
  const b2bJobs = usePrestataireStore((s) => s.b2bJobs)
  const annonces = usePrestataireStore((s) => s.annonces)

  const recues = reservations.filter((r) => r.status === 'recue').length

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{t('prestataire.accueil.greeting')}</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t('prestataire.accueil.company')}
        </h1>
      </header>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Kpi icon={<Inbox className="h-5 w-5" />} label={t('prestataire.accueil.kpiRecues')} value={recues} />
        <Kpi icon={<Building2 className="h-5 w-5" />} label={t('prestataire.accueil.kpiB2b')} value={b2bJobs.length} />
      </div>

      <Button className="w-full gap-2" size="lg" onClick={() => setChooseOpen(true)}>
        <Plus className="h-5 w-5" />
        {t('prestataire.accueil.createAnnonce')}
      </Button>

      {/* Quick links */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <QuickLink to="/app/prestataire/effectif" icon={<Users className="h-5 w-5" />} label={t('prestataire.accueil.effectif')} />
        <QuickLink to="/app/prestataire/stats" icon={<BarChart3 className="h-5 w-5" />} label={t('prestataire.accueil.stats')} />
      </div>

      {/* My annonces */}
      <h2 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t('prestataire.accueil.myAnnonces')}
      </h2>
      {annonces.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t('prestataire.accueil.noAnnonces')}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {annonces.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-3 pt-5">
                <span
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                    a.type === 'b2b' ? 'bg-brand/10 text-brand' : 'bg-emerald-500/15 text-emerald-500',
                  )}
                >
                  {a.type === 'b2b' ? <Briefcase className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.serviceName}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                    a.active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {a.type}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Choose annonce type */}
      <Dialog open={chooseOpen} onClose={() => setChooseOpen(false)} title={t('prestataire.accueil.chooseAnnonce')}>
        <div className="flex flex-col gap-2.5">
          <ChoiceTile
            icon={<User className="h-5 w-5" />}
            title={t('prestataire.accueil.annonceB2c')}
            desc={t('prestataire.accueil.annonceB2cDesc')}
            onClick={() => navigate('/app/prestataire/annonce/new?type=b2c')}
          />
          <ChoiceTile
            icon={<Briefcase className="h-5 w-5" />}
            title={t('prestataire.accueil.annonceB2b')}
            desc={t('prestataire.accueil.annonceB2bDesc')}
            onClick={() => navigate('/app/prestataire/annonce/new?type=b2b')}
          />
        </div>
      </Dialog>
    </div>
  )
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">{icon}</span>
      <p className="mt-3 text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-4 text-sm font-semibold shadow-sm transition-colors hover:bg-secondary/40"
    >
      <span className="text-brand">{icon}</span>
      {label}
    </Link>
  )
}

function ChoiceTile({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border p-4 text-start transition-colors hover:border-brand/40 hover:bg-secondary/60"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
    </button>
  )
}
