import { useState } from 'react';
import { FileText, History, ShieldCheck } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { DemandeSuivi, SuiviAction } from '../../schemas/suivi';
import { ActionButton, PrestataireIdentity, TonePill } from './parts';

/**
 * « Assigné » — the devis de9de9 proposed, valid ones first. A card without
 * `choisir` (an expired offer) cannot be selected; the button stays disabled
 * until a valid card is. Pressing it is the selected card's `choisir` action.
 */
export function DevisBlock({
  devis,
  busyKey,
  onPress,
}: {
  devis: NonNullable<DemandeSuivi['devis']>;
  busyKey: string | null;
  onPress: (action: SuiviAction) => void;
}) {
  const L = useL();
  const [selected, setSelected] = useState<string | null>(null);
  const choice = devis.cartes.find((c) => c.devisId === selected && c.choisir)?.choisir ?? null;

  return (
    <section className="flex flex-col gap-3">
      {devis.consigne && <p className="text-[14px] font-bold text-de9-ink">{devis.consigne}</p>}

      <div role="radiogroup" className="flex flex-col gap-3">
        {devis.cartes.map((carte) => {
          const selectable = !!carte.choisir;
          const isSelected = selected === carte.devisId && selectable;
          return (
            <div
              key={carte.devisId}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={!selectable}
              tabIndex={selectable ? 0 : -1}
              onClick={() => selectable && setSelected(carte.devisId)}
              onKeyDown={(e) => {
                if (selectable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  setSelected(carte.devisId);
                }
              }}
              className={cn(
                'flex flex-col gap-3 rounded-xl bg-card p-4 shadow-soft transition-shadow dark:ring-1 dark:ring-border',
                selectable ? 'cursor-pointer hover:shadow-lift' : 'opacity-60',
                isSelected && 'ring-2 ring-de9-teal dark:ring-2 dark:ring-de9-teal',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <PrestataireIdentity p={carte.prestataire} />
                {carte.etat ? (
                  <TonePill tag={carte.etat} />
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1 size-5 flex-none rounded-full border-2',
                      isSelected ? 'border-de9-teal bg-de9-teal ring-4 ring-de9-teal/15' : 'border-de9-gray',
                    )}
                  />
                )}
              </div>

              {carte.certifications && (
                <p className="flex items-center gap-1.5 text-[12.5px] text-de9-slate">
                  <ShieldCheck className="size-3.5 flex-none text-de9-teal" />
                  {carte.certifications}
                </p>
              )}

              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  {carte.montantTitre && <p className="text-[12px] text-de9-gray">{carte.montantTitre}</p>}
                  {carte.montantLabel && (
                    <p className="text-xl font-extrabold tabular-nums text-de9-ink">{carte.montantLabel}</p>
                  )}
                </div>
                {carte.validiteLabel && <p className="text-[12px] text-de9-slate">{carte.validiteLabel}</p>}
              </div>

              {/* « Délai proposé »: always null today — the line is only drawn if it ever comes. */}
              {carte.delaiLabel && <p className="text-[12.5px] text-de9-slate">{carte.delaiLabel}</p>}
              {carte.note && <p className="rounded-lg bg-secondary px-3 py-2 text-[12.5px] text-de9-ink">{carte.note}</p>}
              {carte.anterieurAuBrief && carte.anterieurAuBriefLabel && (
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-de9-orange-deep">
                  <History className="size-3.5 flex-none" />
                  {carte.anterieurAuBriefLabel}
                </p>
              )}

              {carte.voir && (
                <button
                  type="button"
                  onClick={(e) => {
                    // Viewing a devis must not select its card.
                    e.stopPropagation();
                    if (carte.voir) onPress(carte.voir);
                  }}
                  className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-de9-teal-dark hover:underline"
                >
                  <FileText className="size-4" />
                  {carte.voir.label}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {choice ? (
        <ActionButton
          action={{ ...choice, label: devis.bouton.label }}
          busy={busyKey === `${choice.method}:${choice.href}`}
          onPress={() => onPress(choice)}
          className="h-11 w-full"
        />
      ) : (
        <button
          type="button"
          disabled
          className="h-11 w-full rounded-full bg-de9-teal/40 text-[13px] font-bold text-white"
          title={L('Sélectionnez une offre valable', 'اختر عرضًا ساريًا')}
        >
          {devis.bouton.label}
        </button>
      )}
    </section>
  );
}
