import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { dirOf, useLangStore } from '@/stores/langStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { applyToPost, refreshB2c, useClientPost } from '../api/b2c';
import { legacyErrorMessage, LegacyRefusal } from '../api/legacy';
import { bidFormSchema, type ClientPost } from '../schemas/b2c';
import { ageLabel, isoDate, offersLabel, slotError, slotLabel, todayIso } from '../lib/jobs';
import { ClientAvatar, Row } from './parts';

type BidInput = z.input<typeof bidFormSchema>;
type BidValues = z.output<typeof bidFormSchema>;

/**
 * The « Postuler » form. A de9de9 offer has no "delay" text: it carries an
 * absolute date and time of intervention, a price and a message. The de9de9
 * app validates none of it (blocker B19), so the form does.
 */
function BidForm({
  post,
  onDone,
  onBack,
  onOpenOffer,
}: {
  post: ClientPost;
  onDone: () => void;
  onBack: () => void;
  onOpenOffer: (applicantId: string) => void;
}) {
  const L = useL();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BidInput, unknown, BidValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      price: undefined,
      // The consumer's wish, as the answer formats it — never a conversion of `dueAt`.
      dueDate: post.hasDueDate ? isoDate(post.dueDateFormatted) : '',
      dueTime: post.hasDueDate ? (post.dueTimeFormatted ?? '') : '',
      message: '',
    },
  });

  const onSubmit = async (values: BidValues) => {
    const fault = slotError(values.dueDate, values.dueTime);
    if (fault) {
      setError(fault, { message: 'past' });
      return;
    }
    setSending(true);
    try {
      await applyToPost({
        clientPostId: post.clientPostId,
        price: values.price,
        dueDate: values.dueDate,
        dueTime: values.dueTime,
        description: values.message.trim(),
      });
      toast.success(L('Offre envoyée', 'تم إرسال العرض'));
      onDone();
    } catch (error) {
      if (error instanceof LegacyRefusal && error.code === 'already_applied') {
        const applicantId = error.data['applicantId'];
        toast.info(L('Vous avez déjà postulé à cette demande.', 'لقد قدّمت على هذا الطلب بالفعل.'), {
          action:
            typeof applicantId === 'string'
              ? { label: L('Voir mon offre', 'عرض عرضي'), onClick: () => onOpenOffer(applicantId) }
              : undefined,
        });
        onDone();
      } else if (error instanceof LegacyRefusal && error.message !== 'invalid_format') {
        // `post_unavailable`, the post is gone, own post…: the sheet has nothing left to offer.
        toast.error(
          error.code === 'post_unavailable'
            ? L("Cette demande n'est plus disponible.", 'هذا الطلب لم يعد متاحًا.')
            : legacyErrorMessage(error, L),
        );
        onDone();
      } else {
        // A bad format or a lost connection: the form stays, to correct or retry.
        const message = legacyErrorMessage(error, L);
        if (message) toast.error(message);
      }
    } finally {
      setSending(false);
      refreshB2c(queryClient);
    }
  };

  const slotFault = errors.dueDate ?? errors.dueTime;

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4 px-4 pb-6">
      <div className="space-y-1.5">
        <Label htmlFor="postuler-prix">{L('Prix proposé (DZD)', 'السعر المقترح (دج)')}</Label>
        <Input id="postuler-prix" type="number" inputMode="numeric" min={1} placeholder="0" aria-invalid={!!errors.price} {...register('price')} />
        {errors.price && <p className="text-[12px] text-de9-red">{L('Indiquez un prix supérieur à 0.', 'أدخل سعرًا أكبر من 0.')}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="postuler-date">{L("Date d'intervention", 'تاريخ التدخل')}</Label>
          <Input id="postuler-date" type="date" min={todayIso()} aria-invalid={!!errors.dueDate} {...register('dueDate')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postuler-heure">{L('Heure', 'الوقت')}</Label>
          <Input id="postuler-heure" type="time" aria-invalid={!!errors.dueTime} {...register('dueTime')} />
        </div>
        {slotFault && (
          <p className="col-span-2 text-[12px] text-de9-red">
            {L('Choisissez une date et une heure à venir.', 'اختر تاريخًا ووقتًا في المستقبل.')}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="postuler-message">{L('Message', 'رسالة')}</Label>
        <Textarea id="postuler-message" rows={4} placeholder={L('Présentez votre proposition…', 'قدّم عرضك…')} {...register('message')} />
      </div>

      <p className="text-xs text-de9-gray">
        {L(
          'Postuler est gratuit. Le prix se règle directement entre le particulier et votre entreprise.',
          'التقديم مجاني. يُدفع السعر مباشرة بين العميل وشركتك.',
        )}
      </p>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={sending}>
          {L('Revenir', 'رجوع')}
        </Button>
        <Button type="submit" className="flex-1" disabled={sending}>
          {sending && <Loader2 className="size-4 animate-spin" />}
          {L("Envoyer l'offre", 'إرسال العرض')}
        </Button>
      </div>
    </form>
  );
}

function PostBody({ post, onApply, onOpenOffer }: { post: ClientPost; onApply: () => void; onOpenOffer: (id: string) => void }) {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const mine = post.myApplication;
  // The company's latest offer whatever its status: a withdrawn (5) or declined (6) one leaves the post open again.
  const live = mine.hasApplied && mine.status !== 5 && mine.status !== 6;
  const lieu = [post.commune, post.wilaya].filter(Boolean).join(', ');
  const age = ageLabel(post, L);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
      <div className="flex items-center gap-3 rounded-xl bg-de9-row px-3 py-3">
        <ClientAvatar name={post.fullNameClient ?? ''} photo={post.photoUrl} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[14px] font-bold text-de9-ink">
            <span className="truncate">{post.fullNameClient ?? L('Particulier', 'عميل')}</span>
            {post.clientIsVerified && <BadgeCheck className="size-4 flex-none text-de9-teal" />}
          </p>
          <p className="text-xs text-de9-gray">
            {[age && L(`publiée ${age}`, `نُشر ${age}`), offersLabel(post.countOffers, L)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {post.description && <p className="text-[13.5px] whitespace-pre-line text-de9-slate">{post.description}</p>}

      {post.mediaUrls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {post.mediaUrls.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="flex-none">
              <img src={url} alt={L(`Photo ${i + 1}`, `صورة ${i + 1}`)} className="size-24 rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}

      <dl className="divide-y divide-border">
        {/* Commune and wilaya only: the street address stays hidden until the offer is accepted (blocker B30). */}
        {lieu && <Row label={L('Lieu', 'المكان')}>{lieu}</Row>}
        <Row label={L('Date souhaitée', 'التاريخ المطلوب')}>
          {post.hasDueDate ? (
            <span dir="ltr">
              {slotLabel({ day: lang === 'ar' ? post.dueDayAr : post.dueDayFr, date: post.dueDateFormatted, time: post.dueTimeFormatted })}
            </span>
          ) : (
            L('Date flexible', 'تاريخ مرن')
          )}
        </Row>
      </dl>

      {live && mine.applicantId ? (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-de9-teal-dark">{L('Déjà postulé', 'تم التقديم بالفعل')}</p>
          <Button variant="outline" onClick={() => onOpenOffer(mine.applicantId ?? '')}>
            {L('Voir mon offre', 'عرض عرضي')}
          </Button>
        </div>
      ) : (
        <Button onClick={onApply}>{L('Postuler', 'التقديم')}</Button>
      )}
    </div>
  );
}

/**
 * A consumer's post (`client-post/{clientPostId}`), then the « Postuler »
 * form. A post has no title: its service names it.
 */
export function PostSheet({
  id,
  onClose,
  onOpenOffer,
}: {
  id: string | null;
  onClose: () => void;
  onOpenOffer: (applicantId: string) => void;
}) {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const query = useClientPost(id);
  const post = query.data;
  // Which post the form is open for — so another post always opens on its detail.
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const applying = id != null && applyingTo === id;

  const close = () => {
    setApplyingTo(null);
    onClose();
  };
  const openOffer = (applicantId: string) => {
    close();
    onOpenOffer(applicantId);
  };

  return (
    <Sheet open={id != null} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side={dirOf(lang) === 'rtl' ? 'left' : 'right'}
        className="gap-0 overflow-y-auto bg-background data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-md data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="pe-12">
          <SheetTitle className="text-[17px] font-extrabold text-de9-ink">
            {applying ? L('Envoyer une offre', 'إرسال عرض') : (post?.service ?? L('Demande', 'طلب'))}
          </SheetTitle>
          <SheetDescription>
            {applying ? [post?.category, post?.service].filter(Boolean).join(' · ') : (post?.category ?? '')}
          </SheetDescription>
        </SheetHeader>

        {query.isPending && <div className="mx-4 h-48 animate-pulse rounded-xl bg-secondary" />}
        {query.isError && (
          <div className="flex flex-col items-start gap-3 px-4">
            <p className="text-[13px] text-de9-slate">{legacyErrorMessage(query.error, L)}</p>
            <Button variant="outline" size="sm" onClick={close}>
              {L('Fermer', 'إغلاق')}
            </Button>
          </div>
        )}
        {post &&
          (applying ? (
            <BidForm key={post.clientPostId} post={post} onDone={close} onBack={() => setApplyingTo(null)} onOpenOffer={openOffer} />
          ) : (
            <PostBody post={post} onApply={() => setApplyingTo(id)} onOpenOffer={openOffer} />
          ))}
      </SheetContent>
    </Sheet>
  );
}
