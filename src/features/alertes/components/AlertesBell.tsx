import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { dirOf, useLangStore, type Lang } from '@/stores/langStore';
import { fetchCompteurs, loadVue } from '../api/alertes';
import { badgeCount, CATEGORIE_LABEL, depuisLabel, tonTile } from '../lib/libelles';
import { marquerToutLu, openAlerte } from '../open';
import { CATEGORIES, type Alerte, type Categorie } from '../schemas/alerte';
import { alertesActions, alertesGeneration, rowsOf, useAlertesStore, vueKey, type Onglet } from '../stores/alertesStore';
import { AlerteIcone } from './AlerteIcone';

/** One alert (common guide §1.1): bold while unread, a chevron when it opens something. */
function AlerteRow({ a, lang }: { a: Alerte; lang: Lang }) {
  const tappable = !!a.cible.chemin && a.cible.ecran !== 'aucun';
  const body = (
    <>
      <span className={cn('mt-0.5 flex size-9 flex-none items-center justify-center rounded-[10px]', tonTile(a.ton))}>
        <AlerteIcone icone={a.icone} className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[13.5px] text-de9-ink', a.lu ? 'font-medium' : 'font-bold')}>{a.titre}</span>
        {a.texte && <span className="mt-0.5 line-clamp-2 block text-[12.5px] text-de9-slate">{a.texte}</span>}
        <span className="mt-1 block text-[11.5px] text-de9-gray">{depuisLabel(a.creeLe, lang)}</span>
      </span>
      <span className="flex flex-none flex-col items-center gap-2 self-stretch pt-1">
        {!a.lu && <span className="size-2 rounded-full bg-de9-blue" aria-hidden />}
        {tappable && <ChevronRight className="mt-auto size-4 text-de9-gray rtl:rotate-180" />}
      </span>
    </>
  );
  const cls = 'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-start';
  // An unread row that only informs still marks read on a tap.
  if (!tappable && a.lu) return <li className={cls}>{body}</li>;
  return (
    <li>
      <button
        type="button"
        onClick={() => void openAlerte(a)}
        className={cn(cls, 'cursor-pointer transition-colors hover:bg-secondary', !a.lu && 'bg-de9-blue-tint/40')}
      >
        {body}
      </button>
    </li>
  );
}

function Chip({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        'inline-flex flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold transition-all',
        selected
          ? 'bg-de9-teal text-white shadow-glow'
          : 'bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
        !selected && count === 0 && 'opacity-55',
      )}
    >
      {label}
      {count != null && count > 0 && (
        <span
          className={cn(
            'min-w-5 rounded-full px-1.5 text-center text-[11px] tabular-nums',
            selected ? 'bg-white/25 text-white' : 'bg-de9-teal-soft text-de9-teal-dark',
          )}
        >
          {badgeCount(count)}
        </span>
      )}
    </button>
  );
}

/** The drawer (common guide §7.2): two tabs, the ten chips, the rows, « Tout marquer comme lu ». */
function AlertesDrawer() {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const vue = useAlertesStore((s) => s.vue);
  const key = vueKey(vue);
  const byId = useAlertesStore((s) => s.byId);
  const pages = useAlertesStore((s) => s.pages[key]);
  const compteurs = useAlertesStore((s) => s.compteurs);
  const rows = useMemo(() => rowsOf(byId, vue, pages), [byId, vue, pages]);

  const [failed, setFailed] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // On opening, and on each tab or chip: its first page — which also brings
  // what other seats read meanwhile.
  useEffect(() => {
    loadVue(vue, 'first').catch(() => setFailed(vueKey(vue)));
  }, [vue]);

  // And the chips' numbers, fresh.
  useEffect(() => {
    const gen = alertesGeneration();
    fetchCompteurs()
      .then((c) => {
        if (alertesGeneration() === gen) alertesActions.setCompteurs(c);
      })
      .catch(() => undefined);
  }, []);

  // Infinite scroll: the next page when the end of the list shows.
  const more = !!pages && !pages.fin && failed !== key;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more || loadingMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      setLoadingMore(true);
      loadVue(vue, 'next')
        .catch(() => setFailed(vueKey(vue)))
        .finally(() => setLoadingMore(false));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [more, loadingMore, vue]);

  const select = (next: { onglet?: Onglet; categorie?: Categorie | null }) => {
    setFailed(null);
    alertesActions.setVue({ ...vue, ...next });
  };

  const unread = vue.categorie ? (compteurs?.parCategorie[vue.categorie] ?? 0) : (compteurs?.nonLues ?? 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-4 pb-3 pt-4">
        <div className="flex min-h-7 items-center gap-2 pe-9">
          <SheetTitle className="flex-1 text-[17px] font-extrabold text-de9-ink">{L('Notifications', 'الإشعارات')}</SheetTitle>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void marquerToutLu(vue.categorie)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[12px] font-bold text-de9-teal-dark hover:bg-de9-teal-soft"
            >
              <CheckCheck className="size-3.5" />
              {L('Tout marquer comme lu', 'تعليم الكل كمقروء')}
            </button>
          )}
        </div>
        <div role="tablist" className="flex gap-1 rounded-full bg-secondary p-1">
          {(
            [
              ['toutes', L('Toutes', 'الكل')],
              ['non_lues', L('Non lues', 'غير المقروءة')],
            ] as const
          ).map(([code, label]) => (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={vue.onglet === code}
              onClick={() => select({ onglet: code })}
              className={cn(
                'flex-1 cursor-pointer rounded-full py-1.5 text-[12.5px] font-bold transition-colors',
                vue.onglet === code ? 'bg-card text-de9-ink shadow-soft' : 'text-de9-gray hover:text-de9-ink',
              )}
            >
              {label}
              {code === 'non_lues' && (compteurs?.nonLues ?? 0) > 0 && ` · ${badgeCount(compteurs?.nonLues ?? 0)}`}
            </button>
          ))}
        </div>
        <div role="tablist" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Chip label={L('Tout', 'الكل')} selected={vue.categorie === null} onClick={() => select({ categorie: null })} />
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={L(...CATEGORIE_LABEL[c])}
              count={compteurs?.parCategorie[c] ?? 0}
              selected={vue.categorie === c}
              onClick={() => select({ categorie: c })}
            />
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {!pages && failed !== key && (
          <div className="flex flex-col gap-2 px-2 py-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[74px] animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        )}
        {pages && rows.length === 0 && (
          <EmptyState icon={<Bell className="size-6" />} title={L('Aucune notification', 'لا توجد إشعارات')} />
        )}
        {rows.length > 0 && (
          <ul className="flex flex-col gap-1">
            {rows.map((a) => (
              <AlerteRow key={a.id} a={a} lang={lang} />
            ))}
          </ul>
        )}
        {failed === key && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-[13px] text-de9-gray">{L('Impossible de charger les notifications.', 'تعذّر تحميل الإشعارات.')}</p>
            <button
              type="button"
              onClick={() => {
                setFailed(null);
                loadVue(vue, pages ? 'next' : 'first').catch(() => setFailed(key));
              }}
              className="cursor-pointer rounded-full border border-de9-teal px-3.5 py-1.5 text-[12px] font-bold text-de9-teal-dark hover:bg-de9-teal-soft"
            >
              {L('Réessayer', 'إعادة المحاولة')}
            </button>
          </div>
        )}
        {more && <div ref={sentinel} className="h-8" aria-hidden />}
        {loadingMore && <div className="mx-2 my-1 h-[74px] animate-pulse rounded-xl bg-secondary" />}
      </div>
    </div>
  );
}

/**
 * The topbar bell: the badge is `compteurs.nonLues` (« 99+ », hidden at 0),
 * never a count of the list. It opens the drawer — full screen on a phone.
 */
export function AlertesBell({ className }: { className?: string }) {
  const L = useL();
  const open = useAlertesStore((s) => s.drawerOpen);
  const nonLues = useAlertesStore((s) => s.compteurs?.nonLues ?? 0);
  const lang = useLangStore((s) => s.lang);
  const label = nonLues > 0 ? L(`Notifications (${nonLues} non lues)`, `الإشعارات (${nonLues} غير مقروءة)`) : L('Notifications', 'الإشعارات');

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? alertesActions.openDrawer() : alertesActions.closeDrawer())}>
      <SheetTrigger asChild>
        <button type="button" className={cn('relative', className)} aria-label={label} title={label}>
          <Bell className="size-[18px]" />
          {nonLues > 0 && (
            <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-de9-red px-1 text-[10px] font-bold text-white tabular-nums ring-2 ring-card">
              {badgeCount(nonLues)}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side={dirOf(lang) === 'rtl' ? 'left' : 'right'}
        aria-describedby={undefined}
        className="gap-0 bg-background p-0 data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-[420px] data-[side=right]:sm:max-w-[420px]"
      >
        <AlertesDrawer />
      </SheetContent>
    </Sheet>
  );
}
