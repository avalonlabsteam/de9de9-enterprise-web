import { Info, MessageCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiIcon } from '@/components/common/ApiIcon';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { FeuilleRecharge } from '../schemas/portefeuille';

function CanalIcon({ code }: { code?: string | null }) {
  return code === 'whatsapp' ? <MessageCircle className="size-4" /> : <Phone className="size-4" />;
}

/**
 * « Recharger mes crédits » — no payment in the app, nothing is sent: one
 * button per channel de9de9 configured (the principal one first-styled), and
 * the bank-transfer tile. de9de9 credits the wallet from its admin panel.
 */
export function RechargeSheet({ feuille, onClose }: { feuille: FeuilleRecharge; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{feuille.titre}</DialogTitle>
          {feuille.sousTitre && <DialogDescription>{feuille.sousTitre}</DialogDescription>}
        </DialogHeader>

        {feuille.info && (
          <p className="flex items-start gap-2 rounded-lg bg-secondary px-3.5 py-3 text-[13px] text-de9-slate">
            <Info className="mt-0.5 size-4 flex-none text-de9-blue" />
            {feuille.info}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {feuille.canaux.map((canal) => (
            <a
              key={canal.href}
              href={canal.href}
              target={canal.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-bold',
                canal.principal
                  ? 'bg-de9-teal text-white shadow-glow hover:bg-de9-teal-dark'
                  : 'bg-secondary text-de9-ink hover:bg-secondary/80',
              )}
            >
              <CanalIcon code={canal.code} />
              {canal.label}
            </a>
          ))}
        </div>

        {/* A tile, not a button: the RIB comes from the client's adviser. */}
        {feuille.virement && (
          <div className="flex items-start gap-3 rounded-lg bg-secondary/60 px-3.5 py-3">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-card text-de9-ink">
              <ApiIcon code={feuille.virement.icone ?? 'banque'} className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-de9-ink">{feuille.virement.titre}</p>
              {feuille.virement.texte && <p className="mt-0.5 text-[12.5px] text-de9-slate">{feuille.virement.texte}</p>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
