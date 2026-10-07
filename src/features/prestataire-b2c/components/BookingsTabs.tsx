import { useL } from '@/lib/i18n';
import { useLangStore } from '@/stores/langStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useHistorique, useSolicitations } from '../api/b2c';
import type { Historique, Solicitation } from '../schemas/b2c';
import { ageLabel, bookingPill, dzd, frDate, slotLabel, wallClock, type JobState } from '../lib/jobs';
import { useJobFlow } from '../lib/jobFlow';
import { CardSkeletons, ClientAvatar, Facts, JobActions, LoadError, MoreButton, Rating, StatePill } from './parts';

/** What a job card prints, whichever list the row came from. */
interface CardModel {
  id: string;
  state: JobState;
  client: string;
  photo?: string;
  service: string;
  sub?: string;
  tag?: string;
  lieu: string;
  date: string;
  prix: string;
  age?: string;
  evaluation?: number;
  comment?: string;
}

function JobCard({ job, readOnly }: { job: CardModel; readOnly?: boolean }) {
  const L = useL();
  const flow = useJobFlow();
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          <ClientAvatar name={job.client} photo={job.photo} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-de9-teal-dark">{job.service}</p>
            <p className="truncate text-[15px] font-bold text-de9-ink">{job.client}</p>
            {job.sub && <p className="truncate text-xs text-de9-gray">{job.sub}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {job.tag && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-de9-slate">{job.tag}</span>
          )}
          <StatePill pill={bookingPill(job.state)} />
          {job.age && <span className="ms-auto text-[11px] text-de9-gray">{job.age}</span>}
        </div>
        <Facts lieu={job.lieu} date={job.date} prix={job.prix} />
        {job.state.status === 7 && <Rating value={job.evaluation} comment={job.comment} />}
        <div className="mt-auto flex flex-col gap-2">
          {!readOnly && <JobActions id={job.id} state={job.state} />}
          <Button variant="outline" size="sm" className="w-full" onClick={() => flow.openDetail(job.id)}>
            {L('Voir les détails', 'عرض التفاصيل')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** « Commandes reçues » — the bookings still new or under negotiation (guide 16a §1-2). */
export function RecuesTab() {
  const L = useL();
  const query = useSolicitations();
  const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];

  if (query.isPending) return <CardSkeletons />;
  if (query.isError && rows.length === 0) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title={L('Aucune commande reçue', 'لا توجد طلبات مستلمة')}
        description={L(
          'Les réservations des particuliers sur l’app de9de9 arrivent ici.',
          'حجوزات الأفراد على تطبيق de9de9 تظهر هنا.',
        )}
      />
    );
  }

  const toCard = (r: Solicitation): CardModel => {
    // No wilaya on a booking, only its commune. Old rows have no `dueDate` / `dueTime`.
    const cut = wallClock(r.dueDateTime);
    const age = ageLabel(r, L);
    return {
      id: r.id,
      state: { type: 'order', status: r.status, statusPro: r.statusPro, statusClient: r.statusClient },
      client: r.clientFullName ?? L('Particulier', 'عميل'),
      photo: r.clientPhoto,
      service: r.category ?? L('Service', 'خدمة'),
      sub: r.details.map((d) => d.serviceTask).filter(Boolean).join(' · ') || undefined,
      lieu: r.commune ?? L('Adresse non précisée', 'العنوان غير محدد'),
      date: slotLabel({ date: frDate(r.dueDate) || cut.date, time: r.dueTime ?? cut.time }),
      prix: dzd(r.total ?? r.price),
      age: age ? L(`reçue ${age}`, `استُلم ${age}`) : undefined,
    };
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <JobCard key={r.id} job={toCard(r)} />
        ))}
      </div>
      <MoreButton query={query} />
    </>
  );
}

/**
 * « Services confirmés » (`status 2`) and the history (`5`, `6`, `7`) — the
 * same list on the de9de9 app: bookings and accepted offers, tagged `type`.
 */
export function HistoriqueTab({ view }: { view: 'confirmes' | 'historique' }) {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const query = useHistorique(view);
  const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];

  if (query.isPending) return <CardSkeletons />;
  if (query.isError && rows.length === 0) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title={view === 'confirmes' ? L('Aucun service confirmé', 'لا توجد خدمات مؤكدة') : L('Aucun historique', 'لا يوجد سجل')}
        description={
          view === 'confirmes'
            ? L('Vos réservations acceptées et vos offres retenues arrivent ici.', 'حجوزاتك المقبولة وعروضك المقبولة تظهر هنا.')
            : L('Les prestations terminées, annulées ou refusées arrivent ici.', 'الخدمات المنتهية أو الملغاة أو المرفوضة تظهر هنا.')
        }
      />
    );
  }

  const toCard = (r: Historique): CardModel => {
    const offer = r.type === 'offer';
    const cut = wallClock(r.dueDateTime);
    return {
      id: r.id,
      state: { type: r.type, status: r.status, statusPro: r.statusPro, statusClient: r.statusClient },
      client: [r.firstName, r.lastName].filter(Boolean).join(' ') || L('Particulier', 'عميل'),
      photo: r.photoUrl,
      service: r.categoryName ?? L('Service', 'خدمة'),
      sub: (offer ? r.categoryServiceName : r.tasks.map((t) => t.taskName).filter(Boolean).join(' · ')) || undefined,
      tag: offer ? L('Offre retenue', 'عرض مقبول') : L('Réservation', 'حجز'),
      lieu: r.commune ?? L('Adresse non précisée', 'العنوان غير محدد'),
      // Already « dd/MM/yyyy » here; printed as it comes, with the day name.
      date: slotLabel({ day: lang === 'ar' ? r.dueDayAr : r.dueDayFr, date: r.dueDate ?? cut.date, time: r.dueTime ?? cut.time }),
      prix: dzd(r.totalPrice ?? r.price),
      evaluation: r.evaluation,
      comment: r.comment,
    };
  };

  // The server lists the latest slot first; a confirmed list reads better next intervention first.
  const ordered =
    view === 'confirmes'
      ? [...rows].sort((a, b) => (a.dueDateTime ?? '').localeCompare(b.dueDateTime ?? ''))
      : rows;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {ordered.map((r) => (
          <JobCard key={r.id} job={toCard(r)} readOnly={view === 'historique'} />
        ))}
      </div>
      <MoreButton query={query} />
    </>
  );
}
