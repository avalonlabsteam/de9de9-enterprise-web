import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Lock, CheckCircle2, Paperclip } from 'lucide-react'
import { useClientStore } from '@/stores/clientStore'
import { MOCK_FAMILIES } from '@/data/mockCatalogue'
import { WILAYAS, DELAIS, RECURRENCES } from '@/data/mockClient'
import type { TenderType } from '@/types/client'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useLocalized } from '@/lib/useLocalized'
import { cn } from '@/lib/utils'

export function PublishTenderScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pick } = useLocalized()
  const [params] = useSearchParams()
  const kyc = useClientStore((s) => s.kyc)
  const addTender = useClientStore((s) => s.addTender)

  const [familyId, setFamilyId] = useState<number>(Number(params.get('family')) || 0)
  const [serviceName, setServiceName] = useState('')
  const [description, setDescription] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [delai, setDelai] = useState('')
  const [type, setType] = useState<TenderType>('ponctuel')
  const [recurrence, setRecurrence] = useState(RECURRENCES[1])
  const [budget, setBudget] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)

  const family = useMemo(
    () => MOCK_FAMILIES.find((f) => f.id === familyId),
    [familyId],
  )

  // KYC gate — publishing is locked until the dossier is validated.
  if (!kyc.validated) {
    return (
      <Centered>
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
            <Lock className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-extrabold">{t('publish.kycLockedTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('publish.kycLockedBody')}</p>
          <Link to="/app/profile/kyc" className="mt-5 block">
            <Button className="w-full">{t('publish.kycLockedCta')}</Button>
          </Link>
        </div>
      </Centered>
    )
  }

  if (createdId) {
    return (
      <Centered>
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-extrabold">{t('publish.successTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('publish.successBody', { id: createdId })}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={() => navigate('/app/tenders')}>{t('publish.viewTenders')}</Button>
            <Button variant="ghost" onClick={() => navigate('/app/catalogue')}>
              {t('common.back')}
            </Button>
          </div>
        </div>
      </Centered>
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!family) return
    const id = addTender({
      familyId: family.id,
      serviceName: serviceName || pick(family.subs[0].name),
      description,
      wilaya: wilaya || WILAYAS[0],
      delai: delai || DELAIS[0],
      type,
      recurrence: type === 'recurrent' ? recurrence : undefined,
      budgetDzd: budget ? Number(budget.replace(/\s/g, '')) : undefined,
    })
    setCreatedId(id)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4 -ms-2 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </Button>

      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('publish.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('publish.subtitle')}</p>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
        <Field label={t('publish.family')}>
          <Select
            value={familyId || ''}
            onChange={(e) => {
              setFamilyId(Number(e.target.value))
              setServiceName('')
            }}
            required
          >
            <option value="" disabled>
              {t('publish.selectFamily')}
            </option>
            {MOCK_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.icon} {pick(f.name)}
              </option>
            ))}
          </Select>
        </Field>

        {family && (
          <Field label={t('publish.service')}>
            <Select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
            >
              <option value="" disabled>
                {t('publish.selectService')}
              </option>
              {family.subs.map((s) => (
                <option key={s.id} value={pick(s.name)}>
                  {pick(s.name)}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label={t('publish.description')}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('publish.descriptionPlaceholder')}
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('publish.wilaya')}>
            <Select value={wilaya} onChange={(e) => setWilaya(e.target.value)} required>
              <option value="" disabled>
                {t('publish.wilaya')}
              </option>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('publish.delai')}>
            <Select value={delai} onChange={(e) => setDelai(e.target.value)} required>
              <option value="" disabled>
                {t('publish.delai')}
              </option>
              {DELAIS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Type toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('publish.type')}</span>
          <div className="grid grid-cols-2 gap-2.5">
            {(['ponctuel', 'recurrent'] as TenderType[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setType(opt)}
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all',
                  type === opt
                    ? 'border-brand bg-brand/5 text-brand ring-1 ring-brand'
                    : 'border-border hover:bg-secondary/60',
                )}
              >
                {t(`publish.${opt}`)}
              </button>
            ))}
          </div>
        </div>

        {type === 'recurrent' && (
          <Field label={t('publish.recurrence')}>
            <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              {RECURRENCES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label={t('publish.budget')}>
          <Input
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder={t('publish.budgetPlaceholder')}
          />
        </Field>

        {/* Attachment (mock) */}
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" />
          {t('publish.addAttachment')}
        </button>

        <Button type="submit" size="lg" className="mt-2" disabled={!family}>
          {t('publish.submit')}
        </Button>
      </form>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">{children}</div>
  )
}
