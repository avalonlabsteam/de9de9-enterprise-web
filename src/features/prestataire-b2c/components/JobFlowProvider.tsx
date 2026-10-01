import { useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { actionLabel, confirmFor, type JobAction, type JobState } from '../lib/jobs';
import { JobFlowContext, type JobFlow } from '../lib/jobFlow';
import { useJobAction } from '../lib/useJobAction';
import { JobSheet } from './JobSheet';
import { ModifySheet } from './ModifySheet';

interface Pending {
  id: string;
  action: JobAction;
  state: JobState;
}

/**
 * The one place a B2C button is pressed from. A press either opens the
 * modification sheet, asks for confirmation (refuse, cancel, withdraw, mark
 * done — the consumer is told each time), or sends at once. The detail sheet
 * lives here too, so any card on any tab can open it.
 */
export function JobFlowProvider({ children, onGoConfirmes }: { children: ReactNode; onGoConfirmes: () => void }) {
  const L = useL();
  const { run, isBusy } = useJobAction();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [modifyId, setModifyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Pending | null>(null);

  const flow: JobFlow = {
    openDetail: setDetailId,
    isBusy,
    press: (id, state, action) => {
      if (action === 'modify') setModifyId(id);
      else if (confirmFor(action, state)) setConfirm({ id, action, state });
      else void run(id, action);
    },
  };

  const question = confirm ? confirmFor(confirm.action, confirm.state) : null;
  const confirmBusy = confirm ? isBusy(confirm.id, confirm.action) : false;

  return (
    <JobFlowContext.Provider value={flow}>
      {children}

      <JobSheet
        id={detailId}
        onClose={() => setDetailId(null)}
        onGoConfirmes={() => {
          setDetailId(null);
          onGoConfirmes();
        }}
      />

      <ModifySheet
        id={modifyId}
        busy={modifyId ? isBusy(modifyId, 'modify') : false}
        onClose={() => setModifyId(null)}
        onSubmit={(body) => {
          if (!modifyId) return;
          // Closed whatever the answer: a refusal means the job moved on, and the lists reload.
          void run(modifyId, 'modify', body).then(() => setModifyId(null));
        }}
      />

      <Dialog open={confirm != null} onOpenChange={(open) => !open && !confirmBusy && setConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirm ? L(...actionLabel(confirm.action, confirm.state)) : ''}</DialogTitle>
            <DialogDescription>{question ? L(...question) : ''}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={confirmBusy} onClick={() => setConfirm(null)}>
              {L('Revenir', 'رجوع')}
            </Button>
            <Button
              variant={confirm?.action === 'terminate' ? 'default' : 'destructive'}
              disabled={confirmBusy}
              onClick={() => {
                if (confirm) void run(confirm.id, confirm.action).then(() => setConfirm(null));
              }}
            >
              {confirmBusy && <Loader2 className="size-4 animate-spin" />}
              {L('Confirmer', 'تأكيد')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </JobFlowContext.Provider>
  );
}
