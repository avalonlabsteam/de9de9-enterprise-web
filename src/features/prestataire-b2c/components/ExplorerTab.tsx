import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT, useL } from '@/lib/i18n';
import { useLangStore } from '@/stores/langStore';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useExploreTasks, useMyCategories, useMyOffers, useMyZones, type ExploreFilters } from '../api/b2c';
import type { ExploreTask, MyOffer } from '../schemas/b2c';
import { ageLabel, dzd, offerPill, offersLabel, slotLabel } from '../lib/jobs';
import { useJobFlow } from '../lib/jobFlow';
import { useB2cStore } from '../stores/b2cStore';
import { CardSkeletons, ClientAvatar, Facts, LoadError, MoreButton, StatePill } from './parts';
import { PostSheet } from './PostSheet';

function chipCls(active: boolean): string {
  return cn(
    'cursor-pointer rounded-full px-3 py-1 text-[12px] font-bold transition-all',
    active
      ? 'bg-de9-teal text-primary-foreground shadow-glow'
      : 'bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
  );
}

function Chips<T extends number>({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: { id: T; name: string }[];
  selected: T[];
  onToggle: (id: T) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-de9-gray">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected.includes(item.id)}
            className={chipCls(selected.includes(item.id))}
            onClick={() => onToggle(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, onOpen }: { post: ExploreTask; onOpen: () => void }) {
  const t = useT();
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const age = ageLabel(post, L);
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          <ClientAvatar name={post.fullNameClient ?? ''} photo={post.photoUrl} />
          <div className="min-w-0 flex-1">
            {/* A post has no title: its service names it. */}
            <p className="truncate text-xs font-semibold text-de9-teal">{post.category}</p>
            <p className="truncate text-[15px] font-bold text-de9-ink">{post.service ?? post.category ?? L('Demande', 'طلب')}</p>
            <p className="truncate text-xs text-de9-gray">{post.fullNameClient}</p>
          </div>
        </div>
        {post.description && <p className="line-clamp-3 text-[13px] text-de9-slate">{post.description}</p>}
        {post.mediaUrls.length > 0 && (
          <div className="flex gap-1.5 overflow-hidden">
            {post.mediaUrls.slice(0, 4).map((url) => (
              <img key={url} src={url} alt="" loading="lazy" className="size-12 flex-none rounded-md object-cover" />
            ))}
          </div>
        )}
        <Facts
          lieu={[post.commune, post.wilaya].filter(Boolean).join(', ') || undefined}
          date={
            post.hasDueDate
              ? slotLabel({ day: lang === 'ar' ? post.dueDayAr : post.dueDayFr, date: post.dueDateFormatted })
              : L('Date flexible', 'تاريخ مرن')
          }
        />
        <p className="text-[11px] text-de9-gray">
          {[offersLabel(post.countOffers, L), age && L(`publiée ${age}`, `نُشر ${age}`)].filter(Boolean).join(' · ')}
        </p>
        <Button className="mt-auto w-full" onClick={onOpen}>
          {t('postuler')}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * « Voir les offres » — the consumers' open posts. Search, category chips and
 * zone chips all filter on the server, and only the company's own categories
 * and wilayas can match, so the chips come from the de9de9 app too.
 */
function VoirOffres() {
  const L = useL();
  const flow = useJobFlow();
  const categories = useMyCategories();
  const zones = useMyZones();
  const [search, setSearch] = useState('');
  const searchWord = useDebouncedValue(search.trim(), 300);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [wilayaIds, setWilayaIds] = useState<number[]>([]);
  const [postId, setPostId] = useState<string | null>(null);

  const filters = useMemo<ExploreFilters>(
    () => ({ categoryIds, wilayaIds, searchWord }),
    [categoryIds, wilayaIds, searchWord],
  );
  // No de9de9 category yet: the catalogue is not synced, and explore would be empty anyway.
  const noCatalogue = categories.data?.length === 0;
  const query = useExploreTasks(filters, !!categories.data && !noCatalogue);
  const posts = query.data?.pages.flatMap((p) => p.rows) ?? [];
  const filtered = categoryIds.length > 0 || wilayaIds.length > 0 || searchWord !== '';

  const toggle = <T,>(list: T[], id: T): T[] => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  if (categories.isPending) return <CardSkeletons />;
  if (categories.isError) return <LoadError error={categories.error} onRetry={() => void categories.refetch()} />;
  if (noCatalogue) {
    return (
      <EmptyState
        title={L('Aucune catégorie de9de9', 'لا توجد فئة de9de9')}
        description={L(
          "Vos services sont en cours de configuration sur l'app de9de9. Les demandes des particuliers s'afficheront ici ensuite.",
          'خدماتك قيد الإعداد على تطبيق de9de9. ستظهر طلبات الأفراد هنا بعد ذلك.',
        )}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-de9-gray" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={L('Rechercher un client, un service, une ville…', 'ابحث عن عميل، خدمة، مدينة…')}
          className="ps-9"
        />
      </div>

      <Chips
        label={L('Catégories :', 'الفئات :')}
        items={(categories.data ?? []).map((c) => ({ id: c.categoryId, name: c.categoryName }))}
        selected={categoryIds}
        onToggle={(id) => setCategoryIds((list) => toggle(list, id))}
      />
      <Chips
        label={L('Zones :', 'المناطق :')}
        items={(zones.data ?? []).map((z) => ({ id: z.wilayaId, name: z.wilayaName }))}
        selected={wilayaIds}
        onToggle={(id) => setWilayaIds((list) => toggle(list, id))}
      />

      {query.isPending ? (
        <CardSkeletons />
      ) : query.isError && posts.length === 0 ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : posts.length === 0 ? (
        <EmptyState
          title={
            filtered
              ? L('Aucune demande ne correspond', 'لا يوجد طلب مطابق')
              : L('Aucune demande ouverte pour le moment', 'لا توجد طلبات مفتوحة حاليًا')
          }
          description={
            filtered
              ? L('Retirez un filtre pour élargir la recherche.', 'أزل فلترًا لتوسيع البحث.')
              : L(
                  "Les demandes des particuliers dans vos catégories et vos zones s'affichent ici. Si vos services viennent d'être configurés, leur synchronisation avec l'app de9de9 peut prendre un moment.",
                  'طلبات الأفراد في فئاتك ومناطقك تظهر هنا. إذا تم إعداد خدماتك للتو، فقد تستغرق مزامنتها مع تطبيق de9de9 بعض الوقت.',
                )
          }
        />
      ) : (
        <>
          <div className={cn('grid gap-3 sm:grid-cols-2', query.isPlaceholderData && 'opacity-60')}>
            {posts.map((post) => (
              <PostCard key={post.clientPostId} post={post} onOpen={() => setPostId(post.clientPostId)} />
            ))}
          </div>
          <MoreButton query={query} />
        </>
      )}

      <PostSheet id={postId} onClose={() => setPostId(null)} onOpenOffer={flow.openDetail} />
    </div>
  );
}

function OfferCard({ offer }: { offer: MyOffer }) {
  const L = useL();
  const flow = useJobFlow();
  // The row has no `lastModifiedBy`; `statusClient` tells whose counter it is (1 theirs, 8 ours).
  const pill = offerPill({ type: 'offer', status: offer.status, statusPro: offer.statusPro, statusClient: offer.statusClient });
  return (
    <button
      type="button"
      onClick={() => flow.openDetail(offer.id)}
      className="flex cursor-pointer flex-col gap-3 rounded-lg bg-card p-4 text-start shadow-soft transition-shadow hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:ring-1 dark:ring-border"
    >
      <div className="flex items-start gap-3">
        <ClientAvatar name={offer.clientFullName ?? ''} photo={offer.clientPhoto} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-de9-teal">{offer.category}</p>
          <p className="truncate text-[15px] font-bold text-de9-ink">
            {offer.categoryService ?? offer.category ?? L('Offre', 'عرض')}
          </p>
          <p className="truncate text-xs text-de9-gray">{offer.clientFullName}</p>
        </div>
        <StatePill pill={pill} className="flex-none" />
      </div>
      {pill.sub && <p className="text-xs font-semibold text-de9-slate">{L(...pill.sub)}</p>}
      <Facts
        lieu={offer.commune}
        date={slotLabel({ day: offer.dueDay, date: offer.dueDateFormatted, time: offer.duetime })}
        prix={dzd(offer.price)}
      />
      {offer.appliedDateFormatted && (
        <p className="text-[11px] text-de9-gray">
          {L('Envoyée le', 'أُرسل في')} <span dir="ltr">{offer.appliedDateFormatted}</span>
        </p>
      )}
    </button>
  );
}

/** « Offres envoyées » — every offer and its outcome; a row opens its detail, where the buttons are. */
function OffresEnvoyees() {
  const L = useL();
  const query = useMyOffers();
  const offers = query.data?.pages.flatMap((p) => p.rows) ?? [];

  if (query.isPending) return <CardSkeletons />;
  if (query.isError && offers.length === 0) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  if (offers.length === 0) {
    return (
      <EmptyState
        title={L('Aucune offre envoyée', 'لم ترسل أي عرض')}
        description={L('Postulez à une demande depuis « Voir les offres ».', 'قدّم على طلب من « عرض العروض ».')}
      />
    );
  }
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
      <MoreButton query={query} />
    </>
  );
}

/** « Explorer les offres » — the consumers' posts, and the company's offers on them (guide 16b). */
export function ExplorerTab({ pending }: { pending: number | null }) {
  const t = useT();
  const explorerPill = useB2cStore((s) => s.explorerPill);
  const setExplorerPill = useB2cStore((s) => s.setExplorerPill);
  const pillCls = (active: boolean) =>
    cn(
      'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors',
      active ? 'bg-de9-teal text-primary-foreground' : 'text-de9-teal-dark',
    );
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-full bg-card p-1 shadow-soft dark:ring-1 dark:ring-border">
        <button type="button" onClick={() => setExplorerPill('voirOffres')} className={pillCls(explorerPill === 'voirOffres')}>
          {t('voirOffres')}
        </button>
        <button type="button" onClick={() => setExplorerPill('offresEnvoyees')} className={pillCls(explorerPill === 'offresEnvoyees')}>
          {t('offresEnvoyees')}
          {pending != null && pending > 0 && (
            <span
              className={cn(
                'min-w-5 rounded-full px-1.5 text-center text-[11px] tabular-nums',
                explorerPill === 'offresEnvoyees' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-de9-teal-soft text-de9-teal-dark',
              )}
            >
              {pending}
            </span>
          )}
        </button>
      </div>

      {explorerPill === 'voirOffres' ? <VoirOffres /> : <OffresEnvoyees />}
    </div>
  );
}
