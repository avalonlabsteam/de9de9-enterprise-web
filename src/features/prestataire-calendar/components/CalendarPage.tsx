import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useL } from "@/lib/i18n";
import { MONTHS_FR, MONTHS_AR, WEEKDAYS_FR, WEEKDAYS_AR } from "@/lib/dateLabels";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { WorkerAvatar } from "@/components/common/WorkerAvatar";
import { useCalendar, useCalendarWorkers } from "../api/calendar";
import type { CalendarEvent } from "../schemas/calendar";

type Tab = "agenda" | "historique";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 0, m ?? 0, d ?? 1);
}
function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")} : ${String(d.getMinutes()).padStart(2, "0")}`;
}
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function CalendarPage() {
  const L = useL();
  const navigate = useNavigate();
  const { data, isPending, isError } = useCalendar();
  const { data: workers } = useCalendarWorkers();

  const [tab, setTab] = useState<Tab>("agenda");
  /** `null` = follow the most recent event; set once the user picks a day. */
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState<{ y: number; m: number } | null>(
    null,
  );

  /** Pinned at mount so render stays pure across re-renders. */
  const [now] = useState(() => new Date());

  const events = useMemo(() => data ?? [], [data]);
  const eventDayKeys = useMemo(
    () => new Set(events.map((e) => dayKey(new Date(e.start)))),
    [events],
  );
  const activeWorkers = (workers ?? []).filter((w) => w.status === "active");
  const workerOf = (id?: string) =>
    activeWorkers.find((w) => w.id === id) ?? workers?.find((w) => w.id === id);

  /** Default day = the latest event (matches the reference), else today. */
  const defaultDay = useMemo(() => {
    if (!events.length) return now;
    const latest = [...events].sort((a, b) =>
      b.start.localeCompare(a.start),
    )[0]!;
    return new Date(latest.start);
  }, [events, now]);

  const selected = selectedKey ? keyToDate(selectedKey) : defaultDay;
  const view = viewMonth ?? {
    y: selected.getFullYear(),
    m: selected.getMonth(),
  };
  const selKey = dayKey(selected);
  const todayKey = dayKey(now);

  /** Leading blanks + the days of the viewed month. */
  const cells = useMemo(() => {
    const startPad = new Date(view.y, view.m, 1).getDay();
    const total = new Date(view.y, view.m + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: startPad }, () => null);
    for (let d = 1; d <= total; d++) out.push(new Date(view.y, view.m, d));
    return out;
  }, [view.y, view.m]);

  const shiftMonth = (delta: number) =>
    setViewMonth({ y: view.y, m: view.m + delta });

  const listed = useMemo(() => {
    const cutoff = now.getTime();
    return events
      .filter((e) =>
        tab === "historique"
          ? new Date(e.start).getTime() < cutoff
          : dayKey(new Date(e.start)) === selKey,
      )
      .sort((a, b) =>
        tab === "historique"
          ? b.start.localeCompare(a.start)
          : a.start.localeCompare(b.start),
      );
  }, [events, tab, selKey, now]);

  const longSelected = L(
    `${selected.getDate()} ${(MONTHS_FR[selected.getMonth()] ?? "").toLowerCase()} ${selected.getFullYear()}`,
    `${selected.getDate()} ${MONTHS_AR[selected.getMonth()] ?? ""} ${selected.getFullYear()}`,
  );

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5">
      {/* <header className="flex items-start justify-between gap-4">
        <h1 className="text-[22px] font-black text-de9-ink">{L('Calendrier', 'التقويم')}</h1>
        <Button variant="outline" size="sm" onClick={() => uiActions.openSupport()}>
          <HelpCircle className="size-4" />
          {L('Aide', 'مساعدة')}
        </Button>
      </header> */}

      {/* Agenda / Historique tabs */}
      <div className="flex gap-4">
        {(["agenda", "historique"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "h-10 w-[132px] rounded-lg text-[13px] font-semibold transition-all",
              tab === key
                ? "bg-de9-teal text-white shadow-glow"
                : "bg-card text-de9-teal shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border",
            )}
          >
            {key === "agenda"
              ? L("Agenda", "الجدول")
              : L("Historique", "السجل")}
          </button>
        ))}
      </div>

      {/* source pills */}
      {/* <div className="inline-flex w-fit gap-2">
        {sourcePills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setSource(p.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all",
              source === p.key
                ? "bg-de9-teal text-white shadow-glow"
                : "bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border",
            )}
          >
            {p.label}
          </button>
        ))}
      </div> */}

      {/* employee filter chips */}
      {/* <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setWorkerId("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all",
            workerId === "all"
              ? "bg-de9-teal text-white shadow-glow"
              : "bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border",
          )}
        >
          {L("Tous", "الكل")}
        </button>
        {activeWorkers.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setWorkerId(w.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full py-1 ps-1 pe-3 text-[13px] font-semibold transition-all",
              workerId === w.id
                ? "bg-de9-teal text-white shadow-glow"
                : "bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border",
            )}
          >
            <WorkerAvatar
              worker={{ name: w.name, colorHex: w.colorHex }}
              size={22}
            />
            {w.name}
          </button>
        ))}
      </div> */}

      {/* ===== month grid (left) + agenda (right) ===== */}
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <Card className="w-full flex-none lg:w-[300px]">
          <CardContent className="p-[18px]">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-de9-teal">
                {L(MONTHS_FR[view.m] ?? "", MONTHS_AR[view.m] ?? "")} {view.y}
              </span>
              <span className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="grid size-6 place-items-center rounded-lg text-de9-teal hover:bg-de9-teal-tint"
                  aria-label={L("Mois précédent", "الشهر السابق")}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="grid size-6 place-items-center rounded-lg text-de9-teal hover:bg-de9-teal-tint"
                  aria-label={L("Mois suivant", "الشهر التالي")}
                >
                  <ChevronRight className="size-4" />
                </button>
              </span>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center">
              {WEEKDAYS_FR.map((d, i) => (
                <span
                  key={d}
                  className="pb-1.5 text-[9px] font-semibold text-de9-gray"
                >
                  {L(d, WEEKDAYS_AR[i] ?? "")}
                </span>
              ))}
              {cells.map((d, i) => {
                if (!d) return <span key={`pad-${i}`} className="h-[34px]" />;
                const key = dayKey(d);
                const isSelected = key === selKey;
                const isToday = key === todayKey;
                const has = eventDayKeys.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedKey(key);
                      setTab("agenda");
                    }}
                    className={cn(
                      "relative grid h-[34px] cursor-pointer place-items-center rounded-full text-[13px] font-medium transition-colors",
                      isSelected
                        ? "bg-de9-teal font-semibold text-white"
                        : isToday
                          ? "bg-de9-blue-tint text-de9-blue"
                          : "text-de9-ink hover:bg-secondary",
                    )}
                  >
                    {d.getDate()}
                    {has && (
                      <span
                        className={cn(
                          "absolute bottom-[3px] size-1 rounded-full",
                          isSelected ? "bg-white" : "bg-de9-red",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <section className="min-w-0 flex-1">
          <h2 className="mb-5 text-[16px] font-bold text-de9-ink">
            {tab === "historique"
              ? L("Historique des services", "سجل الخدمات")
              : `${L("Services du", "خدمات يوم")} ${longSelected}`}
          </h2>

          {isPending && (
            <div className="flex flex-col gap-5">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-lg bg-secondary"
                />
              ))}
            </div>
          )}

          {isError && (
            <EmptyState
              title={L(
                "Impossible de charger le calendrier",
                "تعذّر تحميل التقويم",
              )}
              description={L("Réessayez plus tard.", "أعد المحاولة لاحقًا.")}
            />
          )}

          {data && listed.length === 0 && (
            <EmptyState
              title={L(
                "Aucun service pour ce jour",
                "لا توجد خدمة في هذا اليوم",
              )}
              description={L(
                "Ajustez les filtres ou choisissez une autre date.",
                "عدّل عوامل التصفية أو اختر تاريخًا آخر.",
              )}
              icon={<CalendarDays className="size-6" />}
            />
          )}

          {data && listed.length > 0 && (
            <div className="flex flex-col gap-5">
              {listed.map((e) => (
                <ServiceCard
                  key={e.id}
                  event={e}
                  worker={workerOf(e.assignedWorkerId)}
                  onMore={() =>
                    navigate(
                      e.source === "b2b"
                        ? "/prestataire/b2b"
                        : "/prestataire/b2c",
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** Deg Deg agenda card: avatar + title, teal category line, meta row, assignee. */
function ServiceCard({
  event,
  worker,
  onMore,
}: {
  event: CalendarEvent;
  worker: { name: string; colorHex?: string } | undefined;
  onMore: () => void;
}) {
  const L = useL();
  return (
    <Card>
      <CardContent className="px-[18px] py-4">
        <div className="flex items-center gap-3">
          <WorkerAvatar
            worker={{
              name: worker?.name ?? event.title,
              colorHex: worker?.colorHex,
            }}
            size={36}
          />
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold text-de9-ink">
              {event.title}
            </p>
            <p className="text-xs font-semibold text-de9-teal">
              {event.source === "b2c" ? "B2C" : "B2B"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-[22px] gap-y-1.5 text-xs font-medium text-de9-ink">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-de9-teal" />
            {shortDate(event.start)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4 text-de9-teal" />
            {timeLabel(event.start)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-de9-teal" />
            {event.wilaya}
          </span>
        </div>

        {worker && (
          <p className="mt-2.5 text-xs text-de9-gray">
            {L("Affecté à", "مُسند إلى")}{" "}
            <b className="font-semibold text-de9-teal-dark">{worker.name}</b>
          </p>
        )}

        <button
          type="button"
          onClick={onMore}
          className="mt-2.5 block w-full text-end text-[11px] text-de9-teal underline"
        >
          {L("Afficher plus", "عرض المزيد")}
        </button>
      </CardContent>
    </Card>
  );
}
