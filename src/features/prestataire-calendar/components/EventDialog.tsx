import { useNavigate } from 'react-router-dom';
import { Building2, Clock, MapPin, User } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { TonePill } from '@/components/actions/parts';
import { missionPath } from '@/features/prestataire-missions/lib/paths';
import type { Evenement } from '../schemas/calendar';
import { colourOf, heuresOf } from './eventStyle';

/** The event's popover: when, who, where, its status and crew — and the screen it belongs to. */
export function EventDialog({ e, onClose }: { e: Evenement; onClose: () => void }) {
  const L = useL();
  const navigate = useNavigate();
  const heures = heuresOf(e);
  const b2b = e.source === 'b2b';

  const open = () => {
    onClose();
    if (b2b && e.missionId) navigate(missionPath(e.missionId, e.occurrenceId));
    // The B2C booking screen is not in the web app yet: its list.
    else navigate('/prestataire/b2c');
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="size-3 flex-none rounded-full" style={{ backgroundColor: colourOf(e) }} aria-hidden />
            {e.sourceLabel && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-extrabold text-de9-slate">
                {e.sourceLabel}
              </span>
            )}
            {e.statutLabel && <TonePill tag={{ label: e.statutLabel, ton: e.ton }} />}
          </div>
          <DialogTitle className="text-start break-words">
            {e.icone && <span aria-hidden>{e.icone} </span>}
            {e.titre}
          </DialogTitle>
        </DialogHeader>

        <ul className="flex flex-col gap-2 text-[13.5px] text-de9-ink">
          <li className="flex items-start gap-2.5">
            <Clock className="mt-0.5 size-4 flex-none text-de9-teal" />
            <span>
              {e.jourLabel ?? e.date}
              {heures && (
                <span dir="ltr" className="tabular-nums">
                  {' · '}
                  {heures}
                </span>
              )}
            </span>
          </li>
          {e.client && (
            <li className="flex items-start gap-2.5">
              {b2b ? (
                <Building2 className="mt-0.5 size-4 flex-none text-de9-teal" />
              ) : (
                <User className="mt-0.5 size-4 flex-none text-de9-teal" />
              )}
              {e.client}
            </li>
          )}
          {(e.adresse ?? e.lieu) && (
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 flex-none text-de9-teal" />
              {e.adresse ?? e.lieu}
            </li>
          )}
        </ul>

        {e.equipe.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-[12px] font-bold text-de9-gray">{L('Équipe', 'الفريق')}</p>
            <ul className="flex flex-wrap gap-2">
              {e.equipe.map((p) => (
                <li
                  key={p.id}
                  className="inline-flex items-center gap-2 rounded-full bg-secondary py-1 ps-1 pe-3 text-[12.5px] font-semibold text-de9-ink"
                >
                  <WorkerAvatar
                    worker={{ name: p.nom, initials: p.initiales ?? undefined, colorHex: p.couleur ?? undefined }}
                    size={24}
                  />
                  {p.nom}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(b2b ? e.missionId : e.reservationId) && (
          <Button className="h-11 w-full rounded-full" onClick={open}>
            {b2b ? L('Voir la mission', 'عرض المهمة') : L('Voir la réservation', 'عرض الحجز')}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
