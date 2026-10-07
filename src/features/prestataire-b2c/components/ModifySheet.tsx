import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useJobDetails } from '../api/b2c';
import { legacyErrorMessage } from '../api/legacy';
import type { JobDetails } from '../schemas/b2c';
import { actionLabel, dzd, isoDate, slotError, todayIso, wallClock } from '../lib/jobs';

/** The slot the job holds now, as the two inputs write it. */
function slotOf(job: JobDetails): { dueDate: string; dueTime: string } {
  const cut = wallClock(job.dueDateTime ?? job.dueAt);
  return {
    dueDate: isoDate(job.dueDateFormatted ?? cut.date),
    dueTime: job.dueTimeFormatted ?? cut.time,
  };
}

const amount = (raw: string): number => Number(raw.replace(',', '.'));
const validAmount = (raw: string): boolean => raw.trim() !== '' && Number.isFinite(amount(raw)) && amount(raw) >= 0;

function SlotFields({
  dueDate,
  dueTime,
  error,
  onChange,
}: {
  dueDate: string;
  dueTime: string;
  error: 'dueDate' | 'dueTime' | null;
  onChange: (patch: { dueDate?: string; dueTime?: string }) => void;
}) {
  const L = useL();
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="b2c-date">{L("Date d'intervention", 'تاريخ التدخل')}</Label>
        <Input
          id="b2c-date"
          type="date"
          min={todayIso()}
          value={dueDate}
          aria-invalid={error === 'dueDate'}
          onChange={(e) => onChange({ dueDate: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b2c-time">{L('Heure', 'الوقت')}</Label>
        <Input
          id="b2c-time"
          type="time"
          value={dueTime}
          aria-invalid={error === 'dueTime'}
          onChange={(e) => onChange({ dueTime: e.target.value })}
        />
      </div>
      {error && (
        <p className="col-span-2 text-[12px] text-de9-red">
          {L('Choisissez une date et une heure à venir.', 'اختر تاريخًا ووقتًا في المستقبل.')}
        </p>
      )}
    </div>
  );
}

interface FormProps {
  job: JobDetails;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (body: unknown) => void;
}

interface OtherLine {
  /** null: added in this sheet. */
  id: string | null;
  description: string;
  price: string;
  removed: boolean;
}

/**
 * A booking's counter-proposal — `PATCH …/ProfessionalOrders/{id}/pro-modify`.
 * The de9de9 app recomputes the total from the lines; the body's `price` is
 * only quoted to the consumer, so it is the same sum.
 */
function OrderForm({ job, busy, onCancel, onSubmit }: FormProps) {
  const L = useL();
  const [slot, setSlot] = useState(() => slotOf(job));
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(job.details.map((d) => [d.detailId, String(d.price ?? 0)])),
  );
  const [others, setOthers] = useState<OtherLine[]>(() =>
    job.otherTasks.map((o) => ({ id: o.id, description: o.description ?? '', price: String(o.price ?? 0), removed: false })),
  );
  const [touched, setTouched] = useState(false);

  const kept = others.filter((o) => !o.removed);
  // A new line left blank is simply not sent.
  const blank = (o: OtherLine) => o.id === null && o.description.trim() === '' && o.price.trim() === '';
  const filled = kept.filter((o) => !blank(o));
  const linesOk =
    job.details.every((d) => validAmount(prices[d.detailId] ?? '')) &&
    filled.every((o) => o.description.trim() !== '' && validAmount(o.price) && amount(o.price) > 0);
  const total =
    job.details.reduce((sum, d) => sum + (amount(prices[d.detailId] ?? '0') || 0), 0) +
    filled.reduce((sum, o) => sum + (amount(o.price) || 0), 0);
  const slotErr = slotError(slot.dueDate, slot.dueTime);
  const ready = linesOk && total > 0 && !slotErr;

  const setOther = (index: number, patch: Partial<OtherLine>) =>
    setOthers((list) => list.map((o, i) => (i === index ? { ...o, ...patch } : o)));

  const submit = () => {
    setTouched(true);
    if (!ready) return;
    // Absent: the free lines stay untouched. Listed: updated, added (`id: null`),
    // or deleted — an existing line sent empty at 0.
    const otherTasks = [
      ...others.filter((o) => o.id !== null && o.removed).map((o) => ({ id: o.id, description: '', price: 0 })),
      ...filled.map((o) => ({ id: o.id, description: o.description.trim(), price: amount(o.price) })),
    ];
    onSubmit({
      price: total,
      dueDate: slot.dueDate,
      dueTime: slot.dueTime,
      details: job.details.map((d) => ({ id: d.detailId, price: amount(prices[d.detailId] ?? '0') })),
      ...(otherTasks.length > 0 ? { otherTasks } : {}),
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {job.status === 2 && (
          <p className="rounded-lg bg-de9-orange/15 px-3 py-2.5 text-[13px] text-de9-orange-deep">
            {L(
              'La réservation repassera en attente de la réponse du client.',
              'سيعود الحجز إلى انتظار رد العميل.',
            )}
          </p>
        )}
        <SlotFields
          {...slot}
          error={touched ? slotErr : null}
          onChange={(patch) => setSlot((s) => ({ ...s, ...patch }))}
        />

        {job.details.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>{L('Prestations (DZD)', 'الخدمات (دج)')}</Label>
            {job.details.map((d) => (
              <div key={d.detailId} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 text-[13px] break-words text-de9-ink">
                  {d.serviceTaskName ?? d.categoryServiceName ?? '—'}
                </span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="w-28 flex-none"
                  value={prices[d.detailId] ?? ''}
                  aria-invalid={touched && !validAmount(prices[d.detailId] ?? '')}
                  onChange={(e) => setPrices((p) => ({ ...p, [d.detailId]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label>{L('Lignes libres (DZD)', 'بنود إضافية (دج)')}</Label>
          {others.map((o, index) =>
            o.removed ? null : (
              <div key={o.id ?? `new-${index}`} className="flex items-center gap-2">
                <Input
                  className="min-w-0 flex-1"
                  placeholder={L('Ex. Déplacement', 'مثال: التنقل')}
                  value={o.description}
                  aria-invalid={touched && !blank(o) && o.description.trim() === ''}
                  onChange={(e) => setOther(index, { description: e.target.value })}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="w-28 flex-none"
                  placeholder="0"
                  value={o.price}
                  aria-invalid={touched && !blank(o) && !(validAmount(o.price) && amount(o.price) > 0)}
                  onChange={(e) => setOther(index, { price: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={L('Supprimer la ligne', 'حذف البند')}
                  onClick={() => setOther(index, { removed: true })}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setOthers((list) => [...list, { id: null, description: '', price: '', removed: false }])}
          >
            <Plus className="size-4" />
            {L('Ajouter une ligne', 'إضافة بند')}
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-de9-row px-3 py-2.5">
          <span className="text-[13px] font-semibold text-de9-slate">{L('Nouveau total', 'المجموع الجديد')}</span>
          <span className="text-[16px] font-extrabold text-de9-ink tabular-nums">{dzd(total)}</span>
        </div>
        {touched && (!linesOk || total <= 0) && (
          <p className="text-[12px] text-de9-red">
            {L('Vérifiez les montants : chaque ligne a un libellé et un prix, et le total est supérieur à 0.', 'تحقق من المبالغ: لكل بند وصف وسعر، والمجموع أكبر من 0.')}
          </p>
        )}
      </div>
      <Footer busy={busy} onCancel={onCancel} onSubmit={submit} />
    </>
  );
}

/** An offer's answer to the consumer's counter — `PATCH …/ClientPosts/{applicantId}/pro-modify`. */
function OfferForm({ job, busy, onCancel, onSubmit }: FormProps) {
  const L = useL();
  const [slot, setSlot] = useState(() => slotOf(job));
  const [price, setPrice] = useState(String(job.price ?? ''));
  const [touched, setTouched] = useState(false);

  const priceOk = validAmount(price) && amount(price) > 0;
  const slotErr = slotError(slot.dueDate, slot.dueTime);

  const submit = () => {
    setTouched(true);
    if (!priceOk || slotErr) return;
    onSubmit({ price: amount(price), dueDate: slot.dueDate, dueTime: slot.dueTime });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="b2c-price">{L('Prix proposé (DZD)', 'السعر المقترح (دج)')}</Label>
          <Input
            id="b2c-price"
            type="number"
            inputMode="numeric"
            min={1}
            value={price}
            aria-invalid={touched && !priceOk}
            onChange={(e) => setPrice(e.target.value)}
          />
          {touched && !priceOk && <p className="text-[12px] text-de9-red">{L('Indiquez un prix supérieur à 0.', 'أدخل سعرًا أكبر من 0.')}</p>}
        </div>
        <SlotFields
          {...slot}
          error={touched ? slotErr : null}
          onChange={(patch) => setSlot((s) => ({ ...s, ...patch }))}
        />
      </div>
      <Footer busy={busy} onCancel={onCancel} onSubmit={submit} />
    </>
  );
}

function Footer({ busy, onCancel, onSubmit }: { busy: boolean; onCancel: () => void; onSubmit: () => void }) {
  const L = useL();
  return (
    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={onCancel} disabled={busy}>
        {L('Revenir', 'رجوع')}
      </Button>
      <Button onClick={onSubmit} disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />}
        {L('Envoyer au client', 'إرسال إلى العميل')}
      </Button>
    </DialogFooter>
  );
}

/**
 * « Proposer une modification » · « Re-proposer » · « Modifier » on a booking,
 * « Contre-proposer » on an offer. It loads the job itself: the form needs the
 * detail's line ids, which no list carries.
 */
export function ModifySheet({
  id,
  busy,
  onClose,
  onSubmit,
}: {
  id: string | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (body: unknown) => void;
}) {
  const L = useL();
  const query = useJobDetails(id);
  const job = query.data;

  return (
    <Dialog open={id != null} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{job ? L(...actionLabel('modify', job)) : L('Modifier', 'تعديل')}</DialogTitle>
          <DialogDescription>
            {L(
              'Le client est prévenu et doit répondre à votre proposition.',
              'سيتم إعلام العميل وعليه الرد على اقتراحك.',
            )}
          </DialogDescription>
        </DialogHeader>
        {query.isPending && <div className="h-40 animate-pulse rounded-xl bg-secondary" />}
        {query.isError && <p className="text-[13px] text-de9-slate">{legacyErrorMessage(query.error, L)}</p>}
        {job &&
          (job.type === 'offer' ? (
            <OfferForm key={job.id} job={job} busy={busy} onCancel={onClose} onSubmit={onSubmit} />
          ) : (
            <OrderForm key={job.id} job={job} busy={busy} onCancel={onClose} onSubmit={onSubmit} />
          ))}
      </DialogContent>
    </Dialog>
  );
}
