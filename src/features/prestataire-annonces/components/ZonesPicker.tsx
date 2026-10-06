import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useCommunes, useWilayas, type Wilaya } from '@/features/geo/api/geo';
import type { ZoneInput } from '../api/annonces';

const chip = (active: boolean) =>
  cn(
    'rounded-full px-3 py-1 text-[12px] font-bold transition-all',
    active
      ? 'bg-de9-teal text-primary-foreground'
      : 'bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
  );

/** One chosen wilaya: the whole of it, or the communes picked inside it. */
function WilayaZones({
  wilaya,
  rows,
  disabled,
  onChange,
  onRemove,
}: {
  wilaya: Wilaya;
  rows: ZoneInput[];
  disabled?: boolean;
  onChange: (rows: ZoneInput[]) => void;
  onRemove: () => void;
}) {
  const L = useL();
  const entiere = rows.some((z) => z.communeCode === null);
  // The communes are only fetched once the wilaya is narrowed.
  const communes = useCommunes(entiere ? null : wilaya.code);
  const choisies = new Set(rows.map((z) => z.communeCode));

  return (
    <div className="rounded-xl bg-de9-row px-3.5 py-3">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-de9-ink">{L(wilaya.nom, wilaya.nomAr ?? wilaya.nom)}</p>
        <label className="flex flex-none items-center gap-2 text-[12px] font-semibold text-de9-slate">
          {L('Toute la wilaya', 'كامل الولاية')}
          <Switch
            checked={entiere}
            disabled={disabled}
            onCheckedChange={(on) => onChange(on ? [{ wilayaCode: wilaya.code, communeCode: null }] : [])}
          />
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={L(`Retirer ${wilaya.nom}`, `إزالة ${wilaya.nomAr ?? wilaya.nom}`)}
          className="grid size-7 flex-none place-items-center rounded-full text-de9-gray hover:bg-card hover:text-de9-ink"
        >
          <X className="size-4" />
        </button>
      </div>
      {!entiere && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {communes.isPending && <p className="text-[12px] text-de9-gray">{L('Chargement des communes…', 'جارٍ تحميل البلديات…')}</p>}
          {communes.isError && (
            <button type="button" className="text-[12px] font-semibold text-de9-teal-dark underline" onClick={() => void communes.refetch()}>
              {L('Communes indisponibles — réessayer', 'تعذّر تحميل البلديات — أعد المحاولة')}
            </button>
          )}
          {communes.data?.map((c) => (
            <button
              key={c.code}
              type="button"
              disabled={disabled}
              aria-pressed={choisies.has(c.code)}
              className={chip(choisies.has(c.code))}
              onClick={() =>
                onChange(
                  choisies.has(c.code)
                    ? rows.filter((z) => z.communeCode !== c.code)
                    : [...rows, { wilayaCode: wilaya.code, communeCode: c.code }],
                )
              }
            >
              {L(c.nom, c.nomAr ?? c.nom)}
            </button>
          ))}
          {communes.data && rows.length === 0 && (
            <p className="basis-full text-[12px] text-de9-orange-deep">{L('Choisissez au moins une commune.', 'اختر بلدية واحدة على الأقل.')}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Coverage zones, for both kinds: the 58 wilayas, then — optionally — the
 * communes inside one. A wilaya alone is ONE row (`communeCode: null`, the
 * whole wilaya); communes picked inside it are one row each.
 */
export function ZonesPicker({
  value,
  onChange,
  max,
  disabled,
}: {
  value: ZoneInput[];
  onChange: (zones: ZoneInput[]) => void;
  max: number;
  disabled?: boolean;
}) {
  const L = useL();
  const wilayas = useWilayas();
  const [recherche, setRecherche] = useState('');
  // Narrowed to communes but none ticked yet: such a wilaya has no row, yet stays on screen.
  const [ouvertes, setOuvertes] = useState<number[]>([]);

  const choisies = useMemo(() => [...new Set([...value.map((z) => z.wilayaCode), ...ouvertes])], [value, ouvertes]);
  const q = recherche.trim().toLowerCase();
  const visibles = (wilayas.data ?? []).filter(
    (w) => !q || w.nom.toLowerCase().includes(q) || (w.nomAr ?? '').includes(q) || String(w.code) === q,
  );
  const plein = value.length >= max;

  const setWilaya = (code: number, rows: ZoneInput[]) => {
    const next = [...value.filter((z) => z.wilayaCode !== code), ...rows];
    if (next.length > max && next.length > value.length) return; // the ceiling: nothing more is added
    onChange(next);
    setOuvertes((list) => (rows.length === 0 ? [...new Set([...list, code])] : list.filter((c) => c !== code)));
  };
  const toggle = (code: number) => {
    if (choisies.includes(code)) {
      onChange(value.filter((z) => z.wilayaCode !== code));
      setOuvertes((list) => list.filter((c) => c !== code));
    } else if (!plein) {
      onChange([...value, { wilayaCode: code, communeCode: null }]);
    }
  };

  if (wilayas.isPending) return <div className="h-24 animate-pulse rounded-xl bg-secondary" />;
  if (wilayas.isError) {
    return (
      <button type="button" className="text-[13px] font-semibold text-de9-teal-dark underline" onClick={() => void wilayas.refetch()}>
        {L('Wilayas indisponibles — réessayer', 'تعذّر تحميل الولايات — أعد المحاولة')}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-de9-gray" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={L('Rechercher une wilaya…', 'ابحث عن ولاية…')}
          className="ps-9"
        />
      </div>
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto p-0.5">
        {visibles.map((w) => (
          <button
            key={w.code}
            type="button"
            disabled={disabled || (plein && !choisies.includes(w.code))}
            aria-pressed={choisies.includes(w.code)}
            className={cn(chip(choisies.includes(w.code)), 'disabled:opacity-50')}
            onClick={() => toggle(w.code)}
          >
            {L(w.nom, w.nomAr ?? w.nom)}
          </button>
        ))}
      </div>
      {choisies.length > 0 && (
        <div className="flex flex-col gap-2">
          {choisies.map((code) => {
            const wilaya = wilayas.data.find((w) => w.code === code);
            if (!wilaya) return null;
            return (
              <WilayaZones
                key={code}
                wilaya={wilaya}
                rows={value.filter((z) => z.wilayaCode === code)}
                disabled={disabled}
                onChange={(rows) => setWilaya(code, rows)}
                onRemove={() => toggle(code)}
              />
            );
          })}
        </div>
      )}
      <p className={cn('text-[12px]', plein ? 'text-de9-orange-deep' : 'text-de9-gray')}>
        {L(`${value.length} zone(s) sur ${max} au plus — une wilaya entière compte pour une.`, `${value.length} منطقة من ${max} كحد أقصى — الولاية الكاملة تُحسب واحدة.`)}
      </p>
    </div>
  );
}
