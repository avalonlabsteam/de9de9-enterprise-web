import { useMemo, useState } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { buttonStyle, toneText } from '@/lib/tones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { TonePill } from '@/components/actions/parts';
import type { Candidat, Picker } from '../schemas/missions';

/** Lower-case, without accents: « Vitrerie » matches « vitr », « Hélène » matches « helene ». */
const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * « Affecter un ou plusieurs ouvriers » (guide 12 §7). The list is exactly who
 * the assign route accepts; the selection is the COMPLETE crew — it replaces
 * whoever was on the visit. Availability is advice only.
 */
export function WorkerPickerDialog({
  picker,
  busy,
  onClose,
  onSend,
}: {
  picker: Picker;
  busy: boolean;
  onClose: () => void;
  /** The selected rows' `valeur` objects, in `workers[]`. */
  onSend: (workers: Record<string, unknown>[]) => void;
}) {
  const L = useL();
  const [search, setSearch] = useState('');
  const everyone = useMemo(() => picker.groupes.flatMap((g) => g.intervenants), [picker]);
  // Pre-selected: the current crew, else the commande's default one — never a row that cannot be picked.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(everyone.filter((c) => c.selectionne && c.selectionnable).map((c) => c.id)),
  );

  const needle = fold(search.trim());
  const groupes = picker.groupes
    .map((g) => ({
      ...g,
      intervenants: needle
        ? g.intervenants.filter((c) => fold([c.nom, c.role, c.competences].filter(Boolean).join(' ')).includes(needle))
        : g.intervenants,
    }))
    .filter((g) => g.intervenants.length > 0);

  const toggle = (c: Candidat) => {
    if (!c.selectionnable) return;
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(c.id)) next.delete(c.id);
      else next.add(c.id);
      return next;
    });
  };

  const count = selected.size;
  const envoyer = picker.envoyer;
  const occ = picker.occurrence;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{picker.titre}</DialogTitle>
          {picker.sousTitre && <DialogDescription>{picker.sousTitre}</DialogDescription>}
          {occ?.jourLabel && (
            <p className="text-[12.5px] font-semibold text-de9-teal-dark">
              {occ.jourLabel}
              {occ.heureLabel && <span dir="ltr"> · {occ.heureLabel}</span>}
            </p>
          )}
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-de9-gray" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={picker.recherchePlaceholder ?? L('Rechercher', 'بحث')}
            className="ps-10"
          />
        </div>

        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">
          {groupes.length === 0 && (
            <p className="py-6 text-center text-[13px] text-de9-gray">
              {picker.vide ?? L('Aucun membre ne correspond', 'لا يوجد عضو مطابق')}
            </p>
          )}
          {groupes.map((g) => (
            <section key={g.code ?? g.label}>
              <h3 className="mb-2 text-[12px] font-extrabold tracking-wide text-de9-slate uppercase">{g.label}</h3>
              <ul className="flex flex-col gap-2">
                {g.intervenants.map((c) => (
                  <CandidatRow key={c.id} c={c} checked={selected.has(c.id)} onToggle={() => toggle(c)} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {L('Annuler', 'إلغاء')}
          </Button>
          <button
            type="button"
            disabled={busy || count < picker.selectionMin}
            onClick={() => onSend(everyone.filter((c) => selected.has(c.id)).map((c) => c.valeur))}
            className={cn(
              'inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold disabled:opacity-50',
              buttonStyle(envoyer.style ?? 'primaire'),
            )}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {envoyer.label.replace('{n}', String(count))}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CandidatRow({ c, checked, onToggle }: { c: Candidat; checked: boolean; onToggle: () => void }) {
  const dispo = c.disponibilite;
  const sub = [c.role, c.competences].filter(Boolean).join(' · ');
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-disabled={!c.selectionnable || undefined}
        onClick={onToggle}
        className={cn(
          'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-start transition-colors',
          !c.selectionnable
            ? 'cursor-not-allowed bg-secondary/50 opacity-60'
            : checked
              ? 'bg-accent ring-2 ring-de9-teal'
              : 'bg-secondary/60 hover:bg-secondary',
        )}
      >
        <WorkerAvatar worker={{ name: c.nom, initials: c.initiales ?? undefined, colorHex: c.couleur ?? undefined }} size={36} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[14px] font-bold text-de9-ink">{c.nom}</span>
            {c.badge && <TonePill tag={c.badge} className="px-2 py-0.5 text-[10px]" />}
          </span>
          {sub && <span className="block truncate text-[12px] text-de9-slate">{sub}</span>}
          {c.raison ? (
            <span className="block text-[12px] font-semibold text-de9-red">{c.raison}</span>
          ) : (
            dispo?.label && (
              <span className={cn('block text-[12px] font-semibold', toneText(dispo.ton))}>{dispo.label}</span>
            )
          )}
        </span>
        <span
          aria-hidden
          className={cn(
            'mt-1 grid size-5 flex-none place-items-center rounded-md border-2',
            checked ? 'border-de9-teal bg-de9-teal text-primary-foreground' : 'border-de9-gray/60 bg-card',
          )}
        >
          {checked && <Check className="size-3.5" />}
        </span>
      </button>
    </li>
  );
}
