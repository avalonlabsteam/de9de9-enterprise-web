import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { b2cKeys, fetchJob, refreshB2c, sendJobAction } from '../api/b2c';
import { legacyErrorMessage, LegacyRefusal } from '../api/legacy';
import type { JobDetails } from '../schemas/b2c';
import { actionsFor, type JobAction } from './jobs';

type L = (fr: string, ar: string) => string;

function successMessage(action: JobAction, job: JobDetails, answer: unknown, L: L): string {
  const offer = job.type === 'offer';
  switch (action) {
    case 'accept':
      return L('Réservation acceptée — ajoutée à vos services confirmés', 'تم قبول الحجز — أُضيف إلى خدماتك المؤكّدة');
    case 'decline':
      return L('Réservation refusée', 'تم رفض الحجز');
    case 'acceptModification':
      return offer
        ? L('Offre retenue — ajoutée à vos services confirmés', 'تم قبول العرض — أُضيف إلى خدماتك المؤكّدة')
        : L('Modification acceptée — réservation confirmée', 'تم قبول التعديل — الحجز مؤكَّد');
    case 'modify':
      return job.status === 2
        ? L('Modification envoyée — en attente de la réponse du client', 'تم إرسال التعديل — في انتظار رد العميل')
        : L('Contre-proposition envoyée', 'تم إرسال الاقتراح المضاد');
    case 'cancel':
      if (!offer) return L('Réservation annulée', 'تم إلغاء الحجز');
      return job.status === 0 ? L('Offre retirée', 'تم سحب العرض') : L('Service annulé', 'تم إلغاء الخدمة');
    case 'terminate': {
      // `globalStatus == 7`, never `isFullyTerminated`: on bookings that flag is always false (blocker B17).
      const done = (answer as { globalStatus?: unknown } | null)?.globalStatus === 7;
      return done
        ? L('Prestation terminée', 'انتهت الخدمة')
        : L('Terminé de votre côté — en attente du client', 'منتهٍ من جهتك — في انتظار العميل');
    }
  }
}

/**
 * One press on a booking or an offer. Every seat of the company shares one
 * de9de9 account and the de9de9 app guards almost no state (blocker B16), so
 * the job is fetched again just before acting: if a colleague got there first,
 * the press is dropped and the screen reloaded. Whatever the answer, every
 * list, the detail and the counters reload.
 */
export function useJobAction() {
  const L = useL();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (id: string, action: JobAction, body?: unknown): Promise<boolean> => {
    setBusy(`${id}:${action}`);
    try {
      const job = await queryClient.fetchQuery({ queryKey: b2cKeys.job(id), queryFn: () => fetchJob(id), staleTime: 0 });
      if (!actionsFor(job).includes(action)) {
        toast.info(L('Déjà traitée par un collègue. La liste est à jour.', 'عالجها زميل بالفعل. تم تحديث القائمة.'));
        return false;
      }
      const answer = await sendJobAction(id, job.type, action, body);
      toast.success(successMessage(action, job, answer, L));
      return true;
    } catch (error) {
      // The third round of a negotiation: the booking is unchanged, the talk moves to the messages.
      if (error instanceof LegacyRefusal && error.data['negotiationFailed'] === true) {
        toast.info(L('Négociez directement avec le client', 'تفاوض مباشرة مع العميل'), {
          description: L(
            "Une nouvelle contre-proposition n'est plus possible ici : discutez dans les messages de l'app de9de9. Vous pouvez toujours accepter ou refuser.",
            'لم يعد ممكنًا تقديم اقتراح مضاد هنا: تحدّث عبر رسائل تطبيق de9de9. ما زال بإمكانك القبول أو الرفض.',
          ),
          duration: 10_000,
        });
        return false;
      }
      const message = legacyErrorMessage(error, L);
      if (message) toast.error(message);
      return false;
    } finally {
      setBusy(null);
      refreshB2c(queryClient);
    }
  };

  return { run, busy, isBusy: (id: string, action?: JobAction) => (action ? busy === `${id}:${action}` : !!busy?.startsWith(`${id}:`)) };
}
