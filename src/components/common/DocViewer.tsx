import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export interface DocViewerDoc {
  montant?: string | number;
  emetteur?: string;
  date?: string;
  creditsDeduits?: string | number;
  statut?: string;
  status?: 'waiting' | 'approved' | 'contested';
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function DocViewer({
  open,
  onOpenChange,
  doc,
  onApprove,
  onContest,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: DocViewerDoc;
  onApprove?: () => void;
  onContest?: () => void;
}) {
  const L = useL();
  const showActions = doc.status === 'waiting' && Boolean(onApprove) && Boolean(onContest);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{L('Document', 'المستند')}</SheetTitle>
          <SheetDescription>{L('Détails du document', 'تفاصيل المستند')}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="divide-y divide-border">
            {doc.montant != null && doc.montant !== '' && (
              <Row label={L('Montant', 'المبلغ')} value={doc.montant} />
            )}
            {doc.emetteur && <Row label={L('Émetteur', 'المُصدِر')} value={doc.emetteur} />}
            {doc.date && <Row label={L('Date', 'التاريخ')} value={doc.date} />}
            {doc.creditsDeduits != null && doc.creditsDeduits !== '' && (
              <Row label={L('Crédits déduits', 'الرصيد المخصوم')} value={doc.creditsDeduits} />
            )}
            {doc.statut && <Row label={L('Statut', 'الحالة')} value={doc.statut} />}
          </div>

          {showActions && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-col gap-2">
                <Button
                  className="bg-de9-teal-dark text-white hover:bg-de9-teal-dark/90"
                  onClick={() => {
                    onApprove?.();
                    onOpenChange(false);
                  }}
                >
                  {L('Approuver', 'الموافقة')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onContest?.();
                    onOpenChange(false);
                  }}
                >
                  {L('Contester', 'الاعتراض')}
                </Button>
              </div>
            </>
          )}
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => toast(L('Téléchargement simulé', 'تنزيل تجريبي'))}
          >
            {L('Télécharger', 'تنزيل')}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => toast(L('Partage simulé', 'مشاركة تجريبية'))}
          >
            {L('Partager', 'مشاركة')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
