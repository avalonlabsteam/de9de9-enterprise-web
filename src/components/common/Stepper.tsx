import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VisiteCode } from '@/lib/statusModel';

/** Visible progression (NEVER the S/V numbers): Confirmée → Réalisée → Facturée → Payé. */
const STEPS = ['Confirmée', 'Réalisée', 'Facturée', 'Payé'] as const;

/** Maps a visite status to how many steps are complete (0–4). */
function reachedStep(code: VisiteCode): number {
  switch (code) {
    case 'added':
    case 'toConfirm':
      return 0;
    case 'confirmed':
    case 'confirmedAssigned':
      return 1;
    case 'doneNoInvoice':
      return 2;
    case 'doneInvoiced':
    case 'doneDisputed':
      return 3;
    case 'doneApproved':
    case 'paid':
      return 4;
    case 'cancelled':
      return 0;
  }
}

export function Stepper({ status, className }: { status: VisiteCode; className?: string }) {
  const reached = reachedStep(status);
  return (
    <div className={cn('flex items-center', className)}>
      {STEPS.map((label, i) => {
        const done = i < reached;
        const current = i === reached;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border-2 text-[11px] font-extrabold',
                  done && 'border-de9-teal-dark bg-de9-teal-dark text-white',
                  current && 'border-de9-teal-dark bg-[#E5F7F4] text-de9-teal-dark dark:bg-[#14322E]',
                  !done && !current && 'border-de9-line bg-card text-de9-gray',
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[11px] font-bold whitespace-nowrap',
                  done || current ? 'text-de9-slate' : 'text-de9-gray',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-1.5 h-0.5 flex-1 rounded-full', i < reached ? 'bg-de9-teal-dark' : 'bg-de9-line')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
