import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useL } from '@/lib/i18n';
import { useAgrandir } from '../api/workers';
import { agrandirSchema, type AgrandirInput } from '../schemas/worker';
import { AgrandirSentModal } from './AgrandirSentModal';

export function AgrandirPage() {
  const L = useL();
  const navigate = useNavigate();
  const agrandir = useAgrandir();
  const [sentOpen, setSentOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgrandirInput>({
    resolver: zodResolver(agrandirSchema),
    defaultValues: { societe: 'PlombEx', phone: '', email: '', proActuels: '5', proDesires: '8' },
  });

  const onSubmit = (values: AgrandirInput) => {
    agrandir.mutate(values, { onSuccess: () => setSentOpen(true) });
  };

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate('/prestataire/effectif')}
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-de9-gray hover:text-de9-ink"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {L('Retour', 'رجوع')}
      </button>

      <h1 className="text-[20px] font-extrabold text-de9-ink">
        {L('Agrandir la société', 'توسيع الشركة')}
      </h1>

      <div className="flex items-start gap-3 rounded-2xl border border-de9-teal/30 bg-de9-teal/10 p-4">
        <Rocket className="mt-0.5 size-5 flex-none text-de9-teal-dark" />
        <p className="text-[13px] text-de9-ink">
          {L(
            'Besoin de plus de slots professionnels ? Envoyez-nous votre demande et notre équipe vous accompagne.',
            'تحتاج إلى المزيد من الفتحات للمحترفين؟ أرسل لنا طلبك وسيرافقك فريقنا.',
          )}
        </p>
      </div>

      <Card>
        <CardContent className="py-5">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field label={L('Nom de la société', 'اسم الشركة')} error={errors.societe?.message}>
              <Input {...register('societe')} />
            </Field>
            <Field label={L('Numéro de téléphone', 'رقم الهاتف')} error={errors.phone?.message}>
              <Input type="tel" {...register('phone')} placeholder="0560 00 00 00" />
            </Field>
            <Field label={L('Email', 'البريد الإلكتروني')} error={errors.email?.message}>
              <Input type="email" {...register('email')} placeholder="contact@plombex.dz" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={L('Pro actuels', 'المحترفون الحاليون')} error={errors.proActuels?.message}>
                <Input type="number" min={0} {...register('proActuels')} />
              </Field>
              <Field label={L('Pro désirés', 'المحترفون المطلوبون')} error={errors.proDesires?.message}>
                <Input type="number" min={0} {...register('proDesires')} />
              </Field>
            </div>

            <Button type="submit" className="h-11 w-full" disabled={agrandir.isPending}>
              {L('Envoyer la demande', 'إرسال الطلب')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AgrandirSentModal open={sentOpen} onOpenChange={setSentOpen} />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12.5px] text-de9-gray">{label}</Label>
      {children}
      {error && <span className="text-[11.5px] text-de9-red">{error}</span>}
    </div>
  );
}
