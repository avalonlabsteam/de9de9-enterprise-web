import { BadgeCheck, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { dirOf, useLangStore } from '@/stores/langStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useJobDetails } from '../api/b2c';
import { legacyErrorMessage } from '../api/legacy';
import type { JobDetails } from '../schemas/b2c';
import { bookingPill, dzd, offerPill, slotLabel, wallClock } from '../lib/jobs';
import { ClientAvatar, JobActions, Rating, Row, StatePill } from './parts';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[11px] font-extrabold tracking-[0.1em] text-de9-gray uppercase">{title}</h3>
      {children}
    </section>
  );
}

function JobBody({ job, onGoConfirmes }: { job: JobDetails; onGoConfirmes: () => void }) {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const offer = job.type === 'offer';
  // The consumer's phone and street address come back before acceptance:
  // shown only once the job is accepted (blocker B30).
  const accepted = job.status === 2;
  const pill = offer ? offerPill(job) : bookingPill(job);

  // Printed as they come — `dueDateTime` is never converted (blocker B26).
  const cut = wallClock(job.dueDateTime ?? job.dueAt);
  const when = slotLabel({
    day: lang === 'ar' ? job.dueDayAr : job.dueDayFr,
    date: job.dueDateFormatted ?? cut.date,
    time: job.dueTimeFormatted ?? cut.time,
  });
  const commune = offer ? job.clientPost?.commune : job.location?.commune;
  const address = offer ? job.clientPost?.address : job.location?.address;
  const phone = job.client?.clientPhoneNumber;
  const photos = job.clientPost?.mediaUrls ?? [];

  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-de9-slate">
          {offer ? L('Offre', 'عرض') : L('Réservation', 'حجز')}
        </span>
        <StatePill pill={pill} />
        {pill.sub && <span className="basis-full text-xs text-de9-slate">{L(...pill.sub)}</span>}
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-de9-row px-3 py-3">
        <ClientAvatar name={job.client?.fullName ?? ''} photo={job.client?.clientPhotoUrl} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[14px] font-bold text-de9-ink">
            <span className="truncate">{job.client?.fullName ?? L('Particulier', 'عميل')}</span>
            {job.client?.clientIsVerified && <BadgeCheck className="size-4 flex-none text-de9-teal" />}
          </p>
          {accepted && phone ? (
            <a href={`tel:${phone}`} dir="ltr" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-de9-teal-dark">
              <Phone className="size-3.5" /> {phone}
            </a>
          ) : (
            <p className="text-xs text-de9-gray">{L('Téléphone communiqué après acceptation', 'يُعرض الهاتف بعد القبول')}</p>
          )}
        </div>
      </div>

      <dl className="divide-y divide-border">
        {commune && <Row label={L('Lieu', 'المكان')}>{commune}</Row>}
        <Row label={L('Adresse', 'العنوان')}>
          {accepted
            ? (address ?? L('Non précisée', 'غير محدد'))
            : L('Communiquée après acceptation', 'يُعرض بعد القبول')}
        </Row>
        {when && (
          <Row label={offer ? L('Intervention proposée', 'موعد التدخل المقترح') : L('Date', 'التاريخ')}>
            <span dir="ltr">{when}</span>
          </Row>
        )}
        <Row label={offer ? L('Votre prix', 'سعرك') : L('Prix', 'السعر')}>{dzd(job.total ?? job.price)}</Row>
      </dl>

      {/* An offer: whose turn it is. The current price and date are already the last proposal's. */}
      {offer && job.status === 0 && job.lastModifiedBy === 0 && (
        <p className="rounded-lg bg-de9-orange/15 px-3 py-2.5 text-[13px] text-de9-orange-deep">
          {L(
            'Le client a contre-proposé : le prix et la date ci-dessus sont les siens. Acceptez, contre-proposez ou retirez votre offre.',
            'العميل قدّم اقتراحًا مضادًا: السعر والتاريخ أعلاه هما اقتراحه. اقبل، اقترح أو اسحب عرضك.',
          )}
        </p>
      )}
      {offer && job.status === 0 && job.lastModifiedBy === 1 && (job.negotiationCount ?? 0) >= 2 && (
        <p className="rounded-lg bg-de9-blue-tint px-3 py-2.5 text-[13px] text-de9-blue">
          {L(
            "Le client ne peut plus contre-proposer ici : il peut accepter ou refuser. Pour ajuster, discutez dans les messages de l'app de9de9.",
            'لا يمكن للعميل تقديم اقتراح مضاد هنا: يمكنه القبول أو الرفض. للتعديل، تحدّث عبر رسائل تطبيق de9de9.',
          )}
        </p>
      )}

      {!offer && (job.details.length > 0 || job.otherTasks.length > 0) && (
        <Section title={L('Prestations', 'الخدمات')}>
          <ul className="divide-y divide-border rounded-xl bg-card px-3 shadow-soft dark:ring-1 dark:ring-border">
            {job.details.map((d) => (
              <li key={d.detailId} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span className="min-w-0 break-words text-de9-ink">{d.serviceTaskName ?? d.categoryServiceName ?? '—'}</span>
                <span className="flex-none font-semibold tabular-nums">{dzd(d.price)}</span>
              </li>
            ))}
            {job.otherTasks.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span className="min-w-0 break-words text-de9-ink">{o.description ?? '—'}</span>
                <span className="flex-none font-semibold tabular-nums">{dzd(o.price)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {offer && (job.clientPost?.postDescription || photos.length > 0) && (
        <Section title={L('La demande du client', 'طلب العميل')}>
          {job.clientPost?.postDescription && (
            <p className="text-[13px] whitespace-pre-line text-de9-slate">{job.clientPost.postDescription}</p>
          )}
          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="flex-none">
                  <img src={url} alt={L(`Photo ${i + 1}`, `صورة ${i + 1}`)} className="size-20 rounded-lg object-cover" />
                </a>
              ))}
            </div>
          )}
        </Section>
      )}

      {job.description && (
        <Section title={offer ? L('Votre message', 'رسالتك') : L('Message du client', 'رسالة العميل')}>
          <p className="text-[13px] whitespace-pre-line text-de9-slate">{job.description}</p>
        </Section>
      )}

      {job.status === 7 && (
        <Section title={L('Avis du client', 'تقييم العميل')}>
          {job.evaluation ? (
            <Rating value={job.evaluation} comment={job.comment} />
          ) : (
            <p className="text-[13px] text-de9-gray">{L("Le client n'a pas encore noté cette prestation.", 'لم يقيّم العميل هذه الخدمة بعد.')}</p>
          )}
        </Section>
      )}

      {/* Nothing closes a job the consumer never confirms. */}
      {job.status === 2 && job.statusPro === 4 && (
        <p className="text-xs text-de9-gray">
          {L(
            'En attente de la confirmation du client. Sans réponse de sa part, contactez de9de9.',
            'في انتظار تأكيد العميل. في حال عدم رده، اتصل بـ de9de9.',
          )}
        </p>
      )}

      <JobActions id={job.id} state={job} />
      {offer && accepted && (
        <Button variant="outline" size="sm" onClick={onGoConfirmes}>
          {L('Voir dans Services confirmés', 'عرض في الخدمات المؤكّدة')}
        </Button>
      )}
    </div>
  );
}

/**
 * « Voir les détails » — one booking or one offer (`job-details`), with the
 * buttons its state offers.
 */
export function JobSheet({
  id,
  onClose,
  onGoConfirmes,
}: {
  id: string | null;
  onClose: () => void;
  onGoConfirmes: () => void;
}) {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const query = useJobDetails(id);
  const job = query.data;
  const title = job
    ? job.type === 'offer'
      ? [job.clientPost?.categoryName, job.clientPost?.categoryServiceName].filter(Boolean).join(' · ')
      : job.service?.categoryName
    : undefined;

  return (
    <Sheet open={id != null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={dirOf(lang) === 'rtl' ? 'left' : 'right'}
        className="gap-0 overflow-y-auto bg-background data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-md data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="pe-12">
          <SheetTitle className="text-[17px] font-extrabold text-de9-ink">
            {title || L('Détails', 'التفاصيل')}
          </SheetTitle>
          <SheetDescription className="sr-only">{L('Détails de la prestation', 'تفاصيل الخدمة')}</SheetDescription>
        </SheetHeader>

        {query.isPending && (
          <div className="flex flex-col gap-3 px-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn('animate-pulse rounded-xl bg-secondary', i === 0 ? 'h-16' : 'h-28')} />
            ))}
          </div>
        )}
        {query.isError && (
          <div className="flex flex-col items-start gap-3 px-4">
            <p className="text-[13px] text-de9-slate">{legacyErrorMessage(query.error, L)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                {L('Fermer', 'إغلاق')}
              </Button>
            </div>
          </div>
        )}
        {job && <JobBody job={job} onGoConfirmes={onGoConfirmes} />}
      </SheetContent>
    </Sheet>
  );
}
