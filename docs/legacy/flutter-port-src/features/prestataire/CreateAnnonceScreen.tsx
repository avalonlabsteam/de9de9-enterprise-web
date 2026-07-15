import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { usePrestataireStore } from '@/stores/prestataireStore'
import type { AnnonceType } from '@/types/prestataire'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'

export function CreateAnnonceScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const type: AnnonceType = params.get('type') === 'b2b' ? 'b2b' : 'b2c'
  const addAnnonce = usePrestataireStore((s) => s.addAnnonce)

  const [title, setTitle] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [done, setDone] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    addAnnonce({ title, serviceName, type })
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-extrabold">{t('prestataire.createAnnonce.success')}</h1>
          <Button className="mt-5 w-full" onClick={() => navigate('/app/prestataire')}>
            {t('common.continue')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 lg:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/prestataire')}
        className="mb-4 -ms-2 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </Button>

      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {type === 'b2b'
            ? t('prestataire.createAnnonce.titleB2b')
            : t('prestataire.createAnnonce.titleB2c')}
        </h1>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold uppercase text-brand">
          {type}
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label={t('prestataire.createAnnonce.name')} htmlFor="title">
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('prestataire.createAnnonce.namePlaceholder')}
            required
          />
        </Field>
        <Field label={t('prestataire.createAnnonce.service')} htmlFor="service">
          <Input
            id="service"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder={t('prestataire.createAnnonce.servicePlaceholder')}
            required
          />
        </Field>
        <Button type="submit" size="lg" className="mt-2">
          {t('prestataire.createAnnonce.submit')}
        </Button>
      </form>
    </div>
  )
}
