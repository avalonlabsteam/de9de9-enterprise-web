import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'

/** Reusable facture-upload modal — enter an amount + attach a file (mock). */
export function FactureUploadDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (amountDzd: number) => void
}) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    onConfirm(Number(amount.replace(/\s/g, '')) || 0)
    setAmount('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('prestataire.facture.title')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-7 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
        >
          <Upload className="h-6 w-6" />
          {t('prestataire.facture.attach')}
        </button>
        <Field label={t('prestataire.facture.amount')} htmlFor="amount">
          <Input
            id="amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="ex. 18 000"
            required
          />
        </Field>
        <Button type="submit">{t('prestataire.facture.send')}</Button>
      </form>
    </Dialog>
  )
}
