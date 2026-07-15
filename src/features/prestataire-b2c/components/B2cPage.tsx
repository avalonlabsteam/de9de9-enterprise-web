import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT, useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { AffecterModal } from '@/components/common/AffecterModal';
import type { BadgeKind } from '@/lib/statusModel';
import {
  useAffecterB2c,
  useB2cWorkers,
  useOpenOffers,
  useReservations,
  useSentOffers,
} from '../api/b2c';
import type { OpenOffer, Reservation, SentOffer } from '../schemas/b2c';
import { useB2cStore } from '../stores/b2cStore';
import { PostulerSheet } from './PostulerSheet';

const CATEGORIES = ['Nettoyage', 'Plomberie', 'Climatisation', 'Gardiennage'];
const ZONES = ['Alger', 'Oran', 'Blida'];

const SENT_STATUS: Record<SentOffer['status'], { key: 'stAttente' | 'stRetenue' | 'stRefusee'; kind: BadgeKind }> = {
  enAttente: { key: 'stAttente', kind: 'wait' },
  retenue: { key: 'stRetenue', kind: 'done' },
  refusee: { key: 'stRefusee', kind: 'cancelled' },
};

function Loading({ label }: { label: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl border border-de9-line bg-card/60" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

function ErrorState({ title, description }: { title: string; description: string }) {
  return <EmptyState title={title} description={description} />;
}

function priceLine(r: Reservation, L: (fr: string, ar: string) => string): string {
  return r.priceDzd != null ? `${r.priceDzd.toLocaleString('fr-DZ')} DZD` : L('Prix à convenir', 'السعر عند الاتفاق');
}

/* ------------------------------- Commandes reçues ------------------------------- */

function RecuesTab() {
  const t = useT();
  const L = useL();
  const { data, isPending, isError } = useReservations();
  const affecter = useAffecterB2c();
  const [affectId, setAffectId] = useState<string | null>(null);

  if (isPending) return <Loading label={t('loading')} />;
  if (isError) return <ErrorState title={t('errorTitle')} description={t('retry')} />;

  const items = data.filter((r) => r.status === 'recue');
  if (items.length === 0) {
    return <EmptyState title={L('Aucune commande reçue', 'لا توجد طلبات مستلمة')} />;
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((r) => (
          <Card key={r.id}>
            <CardHeader className="gap-1">
              <CardTitle className="text-[15px]">{r.serviceName}</CardTitle>
              <p className="text-[13px] text-de9-gray">{r.clientName}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-de9-gray">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {r.wilaya}
                </span>
                <span>{r.dateLabel}</span>
                <span className="font-bold text-de9-ink">{priceLine(r, L)}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setAffectId(r.id)}>
                {L('Voir les détails', 'عرض التفاصيل')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AffecterModal
        open={affectId != null}
        onOpenChange={(o) => !o && setAffectId(null)}
        onConfirm={(ids) => {
          if (affectId) affecter.mutate({ id: affectId, workerIds: ids });
        }}
      />
    </>
  );
}

/* ------------------------------- Explorer ------------------------------- */

function chipCls(active: boolean): string {
  return cn(
    'rounded-full border px-3 py-1 text-[12px] font-bold transition-colors',
    active
      ? 'border-de9-teal bg-de9-teal text-white'
      : 'border-de9-line bg-card text-de9-gray hover:text-de9-ink',
  );
}

function VoirOffres() {
  const t = useT();
  const L = useL();
  const { data, isPending, isError } = useOpenOffers();
  const [query, setQuery] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [postuler, setPostuler] = useState<OpenOffer | null>(null);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.filter((o) => {
      const hay = `${o.title} ${o.description}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (cats.length && !cats.some((c) => hay.includes(c.toLowerCase()))) return false;
      if (zones.length && !zones.includes(o.wilaya)) return false;
      return true;
    });
  }, [data, query, cats, zones]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-de9-gray" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={L('Rechercher une offre…', 'ابحث عن عرض…')}
          className="ps-9"
        />
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-bold text-de9-ink">{L('Categories :', 'الفئات :')}</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className={chipCls(cats.includes(c))} onClick={() => toggle(cats, setCats, c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-bold text-de9-ink">{L('Zones :', 'المناطق :')}</p>
        <div className="flex flex-wrap gap-2">
          {ZONES.map((z) => (
            <button key={z} type="button" className={chipCls(zones.includes(z))} onClick={() => toggle(zones, setZones, z)}>
              {z}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <Loading label={t('loading')} />
      ) : isError ? (
        <ErrorState title={t('errorTitle')} description={t('retry')} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('emptyGeneric')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((o) => (
            <Card key={o.id}>
              <CardHeader className="gap-1">
                <CardTitle className="text-[15px]">{o.title}</CardTitle>
                <p className="text-[13px] text-de9-gray">{o.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-de9-gray">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {o.wilaya}
                  </span>
                  <span>{o.delai}</span>
                  <span className="font-bold text-de9-ink">{o.priceLabel}</span>
                </div>
                <Button className="w-full" onClick={() => setPostuler(o)}>
                  {t('postuler')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PostulerSheet open={postuler != null} onOpenChange={(o) => !o && setPostuler(null)} offer={postuler} />
    </div>
  );
}

function OffresEnvoyees() {
  const t = useT();
  const L = useL();
  const { data, isPending, isError } = useSentOffers();

  if (isPending) return <Loading label={t('loading')} />;
  if (isError) return <ErrorState title={t('errorTitle')} description={t('retry')} />;
  if (data.length === 0) return <EmptyState title={t('emptyGeneric')} />;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.map((o) => {
        const s = SENT_STATUS[o.status];
        return (
          <Card key={o.id}>
            <CardHeader className="flex-row items-start justify-between gap-2">
              <CardTitle className="text-[15px]">{o.title}</CardTitle>
              <StatusBadge label={t(s.key)} kind={s.kind} />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-de9-gray">
                <span className="font-bold text-de9-ink">{o.prixDzd.toLocaleString('fr-DZ')} DZD</span>
                <span>{o.delai}</span>
              </div>
              {o.message && <p className="text-[13px] text-de9-gray">{L('« ', '« ')}{o.message}{L(' »', ' »')}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ExplorerTab() {
  const t = useT();
  const { explorerPill, setExplorerPill } = useB2cStore();
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-full border border-de9-line bg-secondary p-1">
        <button
          type="button"
          onClick={() => setExplorerPill('voirOffres')}
          className={cn(
            'rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors',
            explorerPill === 'voirOffres' ? 'bg-card text-de9-ink shadow-sm' : 'text-de9-gray',
          )}
        >
          {t('voirOffres')}
        </button>
        <button
          type="button"
          onClick={() => setExplorerPill('offresEnvoyees')}
          className={cn(
            'rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors',
            explorerPill === 'offresEnvoyees' ? 'bg-card text-de9-ink shadow-sm' : 'text-de9-gray',
          )}
        >
          {t('offresEnvoyees')}
        </button>
      </div>

      {explorerPill === 'voirOffres' ? <VoirOffres /> : <OffresEnvoyees />}
    </div>
  );
}

/* ------------------------------- Services confirmés ------------------------------- */

function ConfirmesTab() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const { data, isPending, isError } = useReservations();
  const { data: workers } = useB2cWorkers();
  const affecter = useAffecterB2c();
  const [affect, setAffect] = useState<Reservation | null>(null);

  if (isPending) return <Loading label={t('loading')} />;
  if (isError) return <ErrorState title={t('errorTitle')} description={t('retry')} />;

  const items = data.filter((r) => r.status === 'confirmee');
  if (items.length === 0) {
    return <EmptyState title={L('Aucun service confirmé', 'لا توجد خدمات مؤكدة')} />;
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((r) => {
          const w = workers?.find((x) => x.id === r.assignedWorkerId);
          return (
            <Card key={r.id}>
              <CardHeader className="gap-1">
                <CardTitle className="text-[15px]">{r.serviceName}</CardTitle>
                <p className="text-[13px] text-de9-gray">{r.clientName}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-de9-gray">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {r.wilaya}
                  </span>
                  <span>{r.dateLabel}</span>
                  <span className="font-bold text-de9-ink">{priceLine(r, L)}</span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[12px] font-bold text-de9-gray">{L('Affecté à', 'مُسند إلى')}</p>
                  {r.assignedWorkerId ? (
                    <button
                      type="button"
                      onClick={() => navigate('/prestataire/worker/' + r.assignedWorkerId)}
                      className="inline-flex items-center gap-2 rounded-full border border-de9-line bg-secondary py-1 ps-1 pe-3 text-[13px] font-bold text-de9-ink transition-colors hover:bg-card"
                    >
                      <WorkerAvatar worker={{ name: w?.name ?? '—', colorHex: w?.colorHex }} size={24} />
                      <span>{w?.name ?? r.assignedWorkerId}</span>
                    </button>
                  ) : (
                    <p className="text-[13px] text-de9-gray">—</p>
                  )}
                </div>

                <Button variant="outline" className="w-full" onClick={() => setAffect(r)}>
                  {L("Modifier l'affectation", 'تعديل الإسناد')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AffecterModal
        open={affect != null}
        onOpenChange={(o) => !o && setAffect(null)}
        assignedIds={affect?.assignedWorkerId ? [affect.assignedWorkerId] : []}
        onConfirm={(ids) => {
          if (affect) affecter.mutate({ id: affect.id, workerIds: ids });
        }}
      />
    </>
  );
}

/* ------------------------------- Page ------------------------------- */

export function B2cPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const { tab, setTab } = useB2cStore();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 pb-24">
      <header className="mb-5">
        <h1 className="text-[22px] font-black text-de9-ink">{t('b2cTitle')}</h1>
        <p className="mt-1 text-[14px] text-de9-gray">
          {L('Clients particuliers — le de9de9 normal', 'العملاء الأفراد — de9de9 العادي')}
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="recues">{t('recues')}</TabsTrigger>
          <TabsTrigger value="explorer">{t('explorer')}</TabsTrigger>
          <TabsTrigger value="confirmes">{t('confirmes')}</TabsTrigger>
        </TabsList>

        <TabsContent value="recues">
          <RecuesTab />
        </TabsContent>
        <TabsContent value="explorer">
          <ExplorerTab />
        </TabsContent>
        <TabsContent value="confirmes">
          <ConfirmesTab />
        </TabsContent>
      </Tabs>

      <button
        type="button"
        aria-label={L('Créer une annonce B2C', 'إنشاء إعلان B2C')}
        onClick={() => navigate('/prestataire/annonce/create?type=b2c')}
        className="fixed bottom-24 end-6 z-30 inline-flex size-14 items-center justify-center rounded-full bg-de9-teal text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
