import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, Megaphone, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT, useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { useAnnonces, useProMissions, useProsWithJobs } from '../api/annonces';
import type { ProMission } from '../schemas/annonces';

const NOW = new Date('2026-07-13T00:00:00');

function SourceChip({ source }: { source: 'b2c' | 'b2b' }) {
  return (
    <StatusBadge
      label={source === 'b2c' ? 'B2C' : 'B2B'}
      kind={source === 'b2c' ? 'info' : 'setup'}
    />
  );
}

/* ------------------------------- Mes annonces ------------------------------- */

function MesAnnoncesTab() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const { data, isPending, isError } = useAnnonces();

  return (
    <div className="flex flex-col gap-4">
      <Button className="w-full sm:w-fit" onClick={() => navigate('/prestataire/annonce/create?type=b2c')}>
        <Plus className="size-4" />
        {L('+ Créer une annonce', '+ إنشاء إعلان')}
      </Button>

      {isPending && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-de9-line bg-card/60" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title={L('Impossible de charger les annonces', 'تعذّر تحميل الإعلانات')}
          description={L('Réessayez plus tard.', 'أعد المحاولة لاحقًا.')}
        />
      )}

      {data && data.length === 0 && (
        <EmptyState
          title={L('Aucune annonce', 'لا يوجد إعلان')}
          description={L('Créez votre première annonce.', 'أنشئ إعلانك الأول.')}
          icon={<Megaphone className="size-6" />}
        />
      )}

      {data && data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <CardTitle className="text-[15px]">{a.title}</CardTitle>
                <SourceChip source={a.type} />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[13px] text-de9-gray">{a.serviceName}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    {L('Modifier', 'تعديل')}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    {t('supprimer')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Missions des pros ------------------------------- */

function MissionList({ title, missions }: { title: string; missions: ProMission[] }) {
  const L = useL();
  if (missions.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] font-bold text-de9-gray">{title}</p>
      {missions.map((m) => {
        const d = new Date(m.start);
        const upcoming = d >= NOW;
        return (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl border border-de9-line bg-de9-row px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-de9-ink">{m.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[12px] text-de9-gray">
                <MapPin className="size-3.5" />
                {m.wilaya} · {d.toLocaleDateString('fr-DZ')}
              </p>
            </div>
            <SourceChip source={m.source} />
            <StatusBadge
              label={upcoming ? L('À venir', 'قادمة') : L('Terminé', 'منتهية')}
              kind={upcoming ? 'wait' : 'done'}
            />
          </div>
        );
      })}
    </div>
  );
}

function MissionsProsTab() {
  const L = useL();
  const pros = useProsWithJobs();
  const missions = useProMissions();
  const [openId, setOpenId] = useState<string | null>(null);

  const byWorker = useMemo(() => {
    const map = new Map<string, ProMission[]>();
    for (const m of missions.data ?? []) {
      if (!m.assignedWorkerId) continue;
      const list = map.get(m.assignedWorkerId) ?? [];
      list.push(m);
      map.set(m.assignedWorkerId, list);
    }
    return map;
  }, [missions.data]);

  if (pros.isPending) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    );
  }
  if (pros.isError) {
    return (
      <EmptyState
        title={L('Impossible de charger les professionnels', 'تعذّر تحميل المحترفين')}
        description={L('Réessayez plus tard.', 'أعد المحاولة لاحقًا.')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-de9-gray">
        {L('Missions assignées à chaque salarié par de9de9', 'المهام المسندة لكل موظف من طرف de9de9')}
      </p>

      {pros.data && pros.data.length === 0 ? (
        <EmptyState title={L('Aucun professionnel', 'لا يوجد محترف')} />
      ) : (
        <div className="flex flex-col gap-2">
          {pros.data?.map((p) => {
            const list = (byWorker.get(p.id) ?? []).slice().sort((a, b) => a.start.localeCompare(b.start));
            const upcoming = list.filter((m) => new Date(m.start) >= NOW);
            const past = list.filter((m) => new Date(m.start) < NOW);
            const open = openId === p.id;
            return (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-de9-line bg-card">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : p.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-de9-row"
                  aria-expanded={open}
                >
                  <WorkerAvatar worker={{ name: p.name }} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-de9-ink">{p.name}</p>
                    <p className="truncate text-[12px] text-de9-gray">{p.role}</p>
                  </div>
                  <span className="flex-none text-[12px] font-bold text-de9-gray tabular-nums">
                    {list.length}
                  </span>
                  <ChevronDown
                    className={cn('size-5 flex-none text-de9-gray transition-transform', open && 'rotate-180')}
                  />
                </button>
                {open && (
                  <div className="border-t border-de9-line px-4 py-3">
                    {list.length === 0 ? (
                      <p className="py-2 text-center text-[13px] text-de9-gray">
                        {L('Aucune mission assignée', 'لا توجد مهمة مسندة')}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <MissionList title={L('Missions à venir', 'المهام القادمة')} missions={upcoming} />
                        <MissionList title={L('Missions passées', 'المهام السابقة')} missions={past} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Page ------------------------------- */

export function AnnoncesPage() {
  const t = useT();
  const L = useL();
  const [tab, setTab] = useState('mes');

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-black text-de9-ink">{L('Annonces', 'الإعلانات')}</h1>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="mes">{t('mesAnnonces')}</TabsTrigger>
          <TabsTrigger value="pros">{L('Missions des pros', 'مهام المحترفين')}</TabsTrigger>
        </TabsList>

        <TabsContent value="mes">
          <MesAnnoncesTab />
        </TabsContent>
        <TabsContent value="pros">
          <MissionsProsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
