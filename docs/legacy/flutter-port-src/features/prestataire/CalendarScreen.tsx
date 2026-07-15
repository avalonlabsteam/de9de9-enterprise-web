import { useMemo, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePrestataireStore, workerById } from '@/stores/prestataireStore'
import type { BookingSource, CalendarEvent } from '@/types/prestataire'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Filter = 'all' | BookingSource
type View = 'week' | 'day'

// Visible time window + row height (Google-style hourly grid).
const HOUR_START = 7
const HOUR_END = 20 // last hour label
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)
const HOUR_H = 56

// App "today" — the mock data lives in June 2026, so anchor the calendar there
// to keep the Today button and the now-indicator coherent with the seed events.
const APP_TODAY = new Date(2026, 5, 28)

function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - x.getDay()) // Sunday start
  return x
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function hourLabel(h: number, lang: string): string {
  if (lang === 'ar') return `${h}:00`
  const ap = h < 12 ? 'AM' : 'PM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh} ${ap}`
}

export function CalendarScreen() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'fr'
  const loc = lang === 'ar' ? 'ar-DZ' : 'fr-DZ'
  const events = usePrestataireStore((s) => s.events)
  const workers = usePrestataireStore((s) => s.workers)
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<View>('week')

  // Default to the earliest seeded event so data is visible at once.
  const earliest = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start))
    return sorted[0] ? new Date(sorted[0].start) : APP_TODAY
  }, [events])
  // `cursor` = any reference date; the visible range derives from it + view.
  const [cursor, setCursor] = useState(() => earliest)

  const days = useMemo(() => {
    if (view === 'day') return [cursor]
    const ws = startOfWeek(cursor)
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  }, [cursor, view])

  const visible = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.source === filter)),
    [events, filter],
  )

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: t('prestataire.calendar.filterAll') },
    { key: 'b2c', label: t('prestataire.calendar.filterB2c') },
    { key: 'b2b', label: t('prestataire.calendar.filterB2b') },
  ]

  // Header label: week → month(s) + year; day → full localized date.
  const rangeLabel = useMemo(() => {
    if (view === 'day') {
      return cap(
        cursor.toLocaleDateString(loc, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      )
    }
    const first = days[0]
    const last = days[6]
    const mf = (d: Date) => cap(d.toLocaleDateString(loc, { month: 'long' }))
    return first.getMonth() === last.getMonth()
      ? `${mf(first)} ${first.getFullYear()}`
      : `${mf(first)} – ${mf(last)} ${last.getFullYear()}`
  }, [days, view, cursor, loc])

  function navigate(dir: -1 | 1) {
    setCursor((c) => addDays(c, dir * (view === 'week' ? 7 : 1)))
  }
  function openDay(day: Date) {
    setCursor(day)
    setView('day')
  }

  // Auto-scroll the grid to ~business hours on mount / view change.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = (8 - HOUR_START) * HOUR_H
  }, [view])

  // Now-indicator position (real time-of-day), shown only on APP_TODAY's column.
  const now = new Date()
  const nowTop = (now.getHours() + now.getMinutes() / 60 - HOUR_START) * HOUR_H

  const gutterW = 56
  const minDayW = view === 'day' ? 0 : 92
  const innerMinW = view === 'day' ? 0 : 760

  return (
    <div className="mx-auto flex h-[calc(100dvh-2rem)] max-w-6xl flex-col px-4 py-6 sm:px-6 lg:py-8">
      {/* Nav bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t('prestataire.calendar.title')}
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setCursor(APP_TODAY)}>
            {t('prestataire.calendar.today')}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)} aria-label="prev">
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(1)} aria-label="next">
            <ChevronRight className="h-5 w-5 rtl:rotate-180" />
          </Button>
        </div>
        <span className="text-lg font-semibold">{rangeLabel}</span>

        <div className="ms-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {(['day', 'week'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  view === v ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`prestataire.calendar.${v}`)}
              </button>
            ))}
          </div>
          {/* Source filter */}
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  filter === f.key
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar grid — scrolls both axes; header + time gutter stay pinned. */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card"
      >
        <div style={{ minWidth: innerMinW || undefined }}>
          {/* Day header row — clickable to drill into a single day. */}
          <div className="sticky top-0 z-20 flex border-b border-border bg-card/95 backdrop-blur">
            <div className="sticky start-0 z-10 shrink-0 bg-card/95" style={{ width: gutterW }} />
            {days.map((d) => {
              const isToday = dateKey(d) === dateKey(APP_TODAY)
              return (
                <button
                  key={dateKey(d)}
                  onClick={() => openDay(d)}
                  title={t('prestataire.calendar.day')}
                  className="flex flex-1 flex-col items-center gap-1 py-2 transition-colors hover:bg-secondary/50"
                  style={{ minWidth: minDayW || undefined }}
                >
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                    {d.toLocaleDateString(loc, { weekday: 'short' })}
                  </span>
                  <span
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-full text-lg font-bold tabular-nums',
                      isToday && 'bg-brand text-brand-foreground',
                    )}
                  >
                    {d.getDate()}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Body: time gutter + day columns */}
          <div className="flex">
            <div className="sticky start-0 z-10 shrink-0 bg-card" style={{ width: gutterW }}>
              {HOURS.map((h) => (
                <div key={h} className="relative" style={{ height: HOUR_H }}>
                  <span className="absolute -top-2 end-1.5 text-[10px] font-medium text-muted-foreground">
                    {hourLabel(h, lang)}
                  </span>
                </div>
              ))}
            </div>

            {days.map((day) => {
              const isToday = dateKey(day) === dateKey(APP_TODAY)
              const dayEvents = visible.filter((e) => dateKey(new Date(e.start)) === dateKey(day))
              return (
                <div
                  key={dateKey(day)}
                  className="relative flex-1 border-s border-border"
                  style={{ minWidth: minDayW || undefined }}
                >
                  {HOURS.map((h) => (
                    <div key={h} className="border-t border-border/60" style={{ height: HOUR_H }} />
                  ))}

                  {isToday && nowTop > 0 && nowTop < HOURS.length * HOUR_H && (
                    <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowTop }}>
                      <div className="relative">
                        <span className="absolute -start-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive" />
                        <span className="block h-px bg-destructive" />
                      </div>
                    </div>
                  )}

                  {dayEvents.map((e) => (
                    <EventBlock key={e.id} event={e} workerColor={workerColor(workers, e)} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function workerColor(
  workers: ReturnType<typeof usePrestataireStore.getState>['workers'],
  e: CalendarEvent,
) {
  return workerById(workers, e.assignedWorkerId)?.colorHex ?? '#2F9BE0'
}

function EventBlock({ event, workerColor }: { event: CalendarEvent; workerColor: string }) {
  const dt = new Date(event.start)
  const hour = dt.getHours() + dt.getMinutes() / 60
  const top = (hour - HOUR_START) * HOUR_H
  const height = HOUR_H - 4 // 1h default, small gap

  return (
    <div
      title={event.title}
      className="absolute inset-x-1 z-[5] overflow-hidden rounded-lg p-1.5 text-start shadow-sm"
      style={{
        top: top + 2,
        height,
        backgroundColor: `${workerColor}22`,
        borderInlineStart: `3px solid ${workerColor}`,
      }}
    >
      <p className="text-[11px] font-bold leading-tight tabular-nums" style={{ color: workerColor }}>
        {event.start.slice(11, 16)}
      </p>
      <p className="truncate text-xs font-semibold leading-tight text-foreground">{event.title}</p>
      <p className="truncate text-[10px] text-muted-foreground">
        {event.wilaya} · {event.source.toUpperCase()}
      </p>
    </div>
  )
}
