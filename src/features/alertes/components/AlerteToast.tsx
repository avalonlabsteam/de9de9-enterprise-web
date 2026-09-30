import { Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import type { Alerte } from '../schemas/alerte';
import { tonEdge, tonTile } from '../lib/libelles';
import { AlerteIcone } from './AlerteIcone';

const shell =
  'relative flex w-[356px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-xl border border-s-4 border-border bg-popover p-3.5 pe-9 text-start text-popover-foreground shadow-lift';

function CloseButton({ onClose }: { onClose: () => void }) {
  const L = useL();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="absolute end-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded-full text-de9-gray hover:bg-secondary hover:text-de9-ink"
      aria-label={L('Fermer', 'إغلاق')}
    >
      <X className="size-3.5" />
    </button>
  );
}

/**
 * A new live alert (common guide §7.1). A tap is a tap on its row; closing it
 * does not mark it read. `action` rows carry the primary « Ouvrir ».
 */
export function AlerteToast({ alerte, onOpen, onClose }: { alerte: Alerte; onOpen: () => void; onClose: () => void }) {
  const L = useL();
  const tappable = !!alerte.cible.chemin && alerte.cible.ecran !== 'aucun';
  const compact = alerte.ton === 'info';
  return (
    <div
      role={tappable ? 'button' : 'status'}
      tabIndex={tappable ? 0 : undefined}
      onClick={tappable ? onOpen : undefined}
      onKeyDown={
        tappable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
      className={cn(shell, tonEdge(alerte.ton), tappable && 'cursor-pointer', compact && 'py-2.5')}
    >
      <span className={cn('flex flex-none items-center justify-center rounded-[10px]', compact ? 'size-7' : 'size-9', tonTile(alerte.ton))}>
        <AlerteIcone icone={alerte.icone} className={compact ? 'size-3.5' : 'size-[18px]'} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-de9-ink">{alerte.titre}</p>
        {alerte.texte && !compact && <p className="mt-0.5 line-clamp-2 text-[12.5px] text-de9-slate">{alerte.texte}</p>}
        {alerte.ton === 'action' && tappable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="mt-2 inline-flex h-8 cursor-pointer items-center rounded-full bg-de9-teal px-3.5 text-[12px] font-bold text-white shadow-glow hover:bg-de9-teal-dark"
          >
            {L('Ouvrir', 'فتح')}
          </button>
        )}
      </div>
      <CloseButton onClose={onClose} />
    </div>
  );
}

/** « {n} nouvelles alertes » — a burst, or what a catch-up brought. Opens the drawer. */
export function ResumeToast({ count, onOpen, onClose }: { count: number; onOpen: () => void; onClose: () => void }) {
  const L = useL();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(shell, 'cursor-pointer items-center border-s-de9-teal')}
    >
      <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-de9-teal-soft text-de9-teal-dark">
        <Bell className="size-[18px]" />
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] font-bold text-de9-ink">
        {count === 1
          ? L('1 nouvelle alerte', 'تنبيه جديد واحد')
          : L(`${count} nouvelles alertes`, `${count} تنبيهات جديدة`)}
      </p>
      <CloseButton onClose={onClose} />
    </div>
  );
}
