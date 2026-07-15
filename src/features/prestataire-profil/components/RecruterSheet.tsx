import { useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATALOGUE, FAMILY_BY_ID } from '@/lib/catalogue';
import { useL } from '@/lib/i18n';
import { useRecruter } from '../api/profil';

export function RecruterSheet({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}) {
  const L = useL();
  const recruter = useRecruter();

  const [categorie, setCategorie] = useState('');
  const [sousCategorie, setSousCategorie] = useState('');
  const [zone, setZone] = useState('');
  const [nombre, setNombre] = useState('');
  const [note, setNote] = useState('');

  const subs = useMemo(
    () => (categorie ? (FAMILY_BY_ID[categorie]?.subs ?? []) : []),
    [categorie],
  );

  function reset() {
    setCategorie('');
    setSousCategorie('');
    setZone('');
    setNombre('');
    setNote('');
  }

  function submit() {
    if (!categorie || !sousCategorie) {
      toast(L('Choisissez catégorie et sous-catégorie', 'اختر الفئة والفئة الفرعية'));
      return;
    }
    recruter.mutate(
      { categorie, sousCategorie, zone, nombre, note },
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
          <SheetTitle>{L('Recruter des sous-traitants', 'توظيف مقاولين من الباطن')}</SheetTitle>
          <SheetDescription>
            {L("Renfort d'effectif · pros de9de9", 'تعزيز الفريق · محترفو de9de9')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">{L('Catégorie', 'الفئة')}</Label>
            <Select
              value={categorie}
              onValueChange={(v) => {
                setCategorie(v);
                setSousCategorie('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={L('Choisir une catégorie', 'اختر فئة')} />
              </SelectTrigger>
              <SelectContent>
                {CATALOGUE.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.icon} {L(f.name.fr, f.name.ar)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">{L('Sous-catégorie', 'الفئة الفرعية')}</Label>
            <Select value={sousCategorie} onValueChange={setSousCategorie} disabled={!categorie}>
              <SelectTrigger>
                <SelectValue placeholder={L('Choisir un service', 'اختر خدمة')} />
              </SelectTrigger>
              <SelectContent>
                {subs.map((s) => (
                  <SelectItem key={s.id} value={s.name.fr}>
                    {L(s.name.fr, s.name.ar)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">{L('Zone', 'المنطقة')}</Label>
            <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Alger" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">{L('Nombre', 'العدد')}</Label>
            <Input
              type="number"
              min={1}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] text-de9-gray">{L('Note', 'ملاحظة')}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>

        <SheetFooter>
          <Button className="w-full" onClick={submit} disabled={recruter.isPending}>
            {L('Envoyer la demande', 'إرسال الطلب')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
