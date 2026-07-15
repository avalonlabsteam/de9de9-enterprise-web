import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ShieldCheck, FileBadge } from 'lucide-react'
import { useClientStore } from '@/stores/clientStore'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'

export function KycScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const kyc = useClientStore((s) => s.kyc)
  const submitKyc = useClientStore((s) => s.submitKyc)

  const [rc, setRc] = useState(kyc.rc)
  const [nif, setNif] = useState(kyc.nif)
  const [nis, setNis] = useState(kyc.nis)
  const [editing, setEditing] = useState(!kyc.validated)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    submitKyc(rc, nif, nis)
    setEditing(false)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 lg:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/profile')}
        className="mb-4 -ms-2 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </Button>

      <div className="mb-6 flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <FileBadge className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t('kyc.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('kyc.subtitle')}</p>
        </div>
      </div>

      {kyc.validated && !editing ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-500">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h2 className="text-lg font-extrabold">{t('kyc.validatedTitle')}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t('kyc.validatedBody')}</p>
          <dl className="mx-auto mt-5 max-w-xs space-y-2 text-start text-sm">
            <Detail label={t('kyc.rc')} value={kyc.rc} />
            <Detail label={t('kyc.nif')} value={kyc.nif} />
            <Detail label={t('kyc.nis')} value={kyc.nis} />
          </dl>
          <Button variant="secondary" className="mt-5" onClick={() => setEditing(true)}>
            {t('kyc.edit')}
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label={t('kyc.rc')} htmlFor="rc">
            <Input id="rc" value={rc} onChange={(e) => setRc(e.target.value)} placeholder="16/00-1234567 B 23" required />
          </Field>
          <Field label={t('kyc.nif')} htmlFor="nif">
            <Input id="nif" value={nif} onChange={(e) => setNif(e.target.value)} placeholder="0001 2345 6789 012" required />
          </Field>
          <Field label={t('kyc.nis')} htmlFor="nis">
            <Input id="nis" value={nis} onChange={(e) => setNis(e.target.value)} placeholder="0987 6543 2100 987" required />
          </Field>
          <Button type="submit" size="lg" className="mt-2">
            {t('kyc.submit')}
          </Button>
        </form>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-card/60 px-3 py-2">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm font-medium">{value}</dd>
    </div>
  )
}
