import { ChevronRight, Star } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Commande, Occurrence, SuiviAction } from '../../schemas/suivi';
import { toneText } from '@/lib/tones';
import { ActionButton, TonePill } from './parts';
import { ApiIcon } from '@/components/common/ApiIcon';

const keyOf = (a: SuiviAction) => `${a.method}:${a.href}`;

/**
 * The commande the demande became: its section (« Récurrence », « Visite » or
 * « Facture »), one row per visit with its invoice, the review card under its
 * anchor row, and « + Ajouter une récurrence ».
 */
export function CommandeSection({
  commande,
  highlightId,
  busyKey,
  onPress,
}: {
  commande: Commande;
  /** `prochaineAction.occurrenceId` — the row the block above is about. */
  highlightId?: string | null;
  busyKey: string | null;
  onPress: (action: SuiviAction) => void;
}) {
  const L = useL();
  const { section, occurrences, ajouterOccurrence, avis } = commande;

  const avisCard = avis && (
    <AvisCard avis={avis} busy={!!avis.action && busyKey === keyOf(avis.action)} onPress={onPress} />
  );
  const anchored = avis?.ancreOccurrenceId && occurrences.some((o) => o.id === avis.ancreOccurrenceId);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ApiIcon code={section.icone} className="size-5 text-de9-teal" />
        <h2 className="text-[16px] font-bold text-de9-ink">{section.titre}</h2>
        {section.motif && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[12px] font-semibold text-de9-teal-dark">
            {section.motif}
          </span>
        )}
        {commande.reference && <span className="ms-auto text-[12px] text-de9-gray" dir="ltr">{commande.reference}</span>}
      </div>

      {occurrences.length === 0 ? (
        <p className="rounded-xl bg-secondary/60 px-4 py-6 text-center text-[13px] text-de9-slate">
          {section.vide ?? L('Aucune visite planifiée', 'لا توجد زيارة مبرمجة')}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {occurrences.map((occurrence) => (
            <li key={occurrence.id} className="flex flex-col gap-3">
              <OccurrenceRow
                occurrence={occurrence}
                highlighted={occurrence.id === highlightId}
                busyKey={busyKey}
                onPress={onPress}
              />
              {anchored && avis?.ancreOccurrenceId === occurrence.id && avisCard}
            </li>
          ))}
        </ul>
      )}
      {!anchored && avisCard}

      {ajouterOccurrence &&
        (ajouterOccurrence.href ? (
          <ActionButton
            action={ajouterOccurrence}
            busy={busyKey === keyOf(ajouterOccurrence)}
            onPress={onPress}
            className="h-11 w-full"
          />
        ) : (
          // Greyed out: the reason is printed under it.
          <div className="flex flex-col gap-1.5">
            <ActionButton action={ajouterOccurrence} onPress={onPress} className="h-11 w-full" />
            {ajouterOccurrence.indisponible && (
              <p className="text-center text-[12px] text-de9-gray">{ajouterOccurrence.indisponible}</p>
            )}
          </div>
        ))}
    </section>
  );
}

function OccurrenceRow({
  occurrence,
  highlighted,
  busyKey,
  onPress,
}: {
  occurrence: Occurrence;
  highlighted: boolean;
  busyKey: string | null;
  onPress: (action: SuiviAction) => void;
}) {
  const L = useL();
  const facture = occurrence.facture;

  return (
    <div
      id={`occurrence-${occurrence.id}`}
      className={cn(
        'flex flex-col gap-3 rounded-xl bg-card p-4 shadow-soft dark:ring-1 dark:ring-border',
        highlighted && 'ring-2 ring-de9-teal dark:ring-2 dark:ring-de9-teal',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-de9-ink">
            {occurrence.dateLabel ?? L('Date à fixer', 'تاريخ سيُحدَّد')}
            {occurrence.heureLabel && <span className="font-semibold text-de9-slate"> · {occurrence.heureLabel}</span>}
          </p>
          {occurrence.demandeeParLeClient && (
            <p className="text-[12px] text-de9-gray">{L('Demandée par vous', 'طلبتَها أنت')}</p>
          )}
        </div>
        <TonePill tag={occurrence.statut} />
      </div>

      {occurrence.info && (
        <p className={cn('flex items-start gap-1.5 text-[12.5px] font-medium', toneText(occurrence.info.ton))}>
          <ApiIcon code={occurrence.info.icone} className="mt-0.5 size-3.5 flex-none" />
          {occurrence.info.texte}
        </p>
      )}

      {facture && (
        <div className="flex flex-col gap-2.5 rounded-lg bg-secondary/60 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TonePill tag={facture.statut} />
            {facture.montantLabel && (
              <span className="text-[15px] font-extrabold tabular-nums text-de9-ink">{facture.montantLabel}</span>
            )}
          </div>
          {facture.credits && (
            <p className="flex items-center gap-1.5 text-[12.5px] text-de9-slate">
              <ApiIcon code={facture.credits.icone} className="size-3.5 flex-none" />
              {facture.credits.label}
            </p>
          )}
          {facture.fichier && (
            <button
              type="button"
              onClick={() => facture.fichier && onPress(facture.fichier)}
              className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-de9-teal-dark hover:underline"
            >
              <ApiIcon code={facture.fichier.icone} className="size-4" />
              {facture.fichier.label}
            </button>
          )}
          {facture.actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {facture.actions.map((action) => (
                <ActionButton key={action.code} action={action} busy={busyKey === keyOf(action)} onPress={onPress} />
              ))}
            </div>
          )}
        </div>
      )}

      {occurrence.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {occurrence.actions.map((action) => (
            <ActionButton key={action.code} action={action} busy={busyKey === keyOf(action)} onPress={onPress} />
          ))}
        </div>
      )}
    </div>
  );
}

/** « ★ Laisser un avis » — or « Avis envoyé » with its note once sent. */
function AvisCard({
  avis,
  busy,
  onPress,
}: {
  avis: NonNullable<Commande['avis']>;
  busy: boolean;
  onPress: (action: SuiviAction) => void;
}) {
  const L = useL();
  if (avis.etat === 'envoye') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-de9-teal-soft/60 px-4 py-3">
        <Star className="size-5 flex-none fill-amber-400 text-amber-400" />
        <p className="flex-1 text-[13.5px] font-bold text-de9-teal-dark">{avis.label ?? L('Avis envoyé', 'تم إرسال التقييم')}</p>
        {avis.note != null && (
          <span className="flex gap-0.5" aria-label={`${avis.note} / 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn('size-3.5', i < (avis.note ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-de9-gray')} />
            ))}
          </span>
        )}
      </div>
    );
  }
  if (!avis.action) return null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => avis.action && onPress(avis.action)}
      className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-start transition-shadow hover:shadow-lift disabled:opacity-60 dark:bg-amber-500/10"
    >
      <Star className="size-6 flex-none fill-amber-400 text-amber-400" />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-de9-ink">
          {avis.titre ?? avis.action.label ?? L('Laisser un avis', 'اترك تقييمًا')}
        </span>
        {avis.texte && <span className="block text-[12.5px] text-de9-slate">{avis.texte}</span>}
      </span>
      <ChevronRight className="size-5 flex-none text-de9-gray rtl:rotate-180" />
    </button>
  );
}
