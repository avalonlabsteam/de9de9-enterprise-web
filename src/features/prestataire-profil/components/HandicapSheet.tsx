import { useState } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useL } from '@/lib/i18n';
import { useHandicapJoin } from '../api/profil';

export function HandicapSheet({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}) {
  const L = useL();
  const join = useHandicapJoin();

  const [contact, setContact] = useState('');
  const [poste, setPoste] = useState('');
  const [zone, setZone] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [commentaire, setCommentaire] = useState('');

  function reset() {
    setContact('');
    setPoste('');
    setZone('');
    setNombre('');
    setEmail('');
    setCommentaire('');
  }

  function submit() {
    if (!contact || !poste || !zone) {
      toast(L('Renseignez contact, poste et zone', 'أدخل جهة الاتصال والمنصب والمنطقة'));
      return;
    }
    join.mutate(
      { contact, poste, zone, nombre, email, commentaire },
      {
        onSuccess: () => {
          onOpenChange(false);
          reset();
          onSent();
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[90vh] max-w-[560px] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {L('Contracter des personnes en situation de handicap', 'توظيف أشخاص من ذوي الاحتياجات الخاصة')}
          </SheetTitle>
          <SheetDescription>
            {L('Rejoignez la liste — de9de9 vous recontacte', 'انضم إلى القائمة — سيتواصل معك de9de9')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">{L('Contact', 'جهة الاتصال')}</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">{L('Poste', 'المنصب')}</Label>
            <Input value={poste} onChange={(e) => setPoste(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">{L('Zone', 'المنطقة')}</Label>
            <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Alger" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">
              {L('Nombre (optionnel)', 'العدد (اختياري)')}
            </Label>
            <Input type="number" min={1} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">
              {L('Email (optionnel)', 'البريد الإلكتروني (اختياري)')}
            </Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">
              {L('Commentaire (optionnel)', 'تعليق (اختياري)')}
            </Label>
            <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} />
          </div>
        </div>

        <SheetFooter>
          <Button className="w-full" onClick={submit} disabled={join.isPending}>
            {L('Envoyer la demande', 'إرسال الطلب')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
