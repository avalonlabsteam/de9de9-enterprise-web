import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Loader2, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { useT, useL } from '@/lib/i18n';
import { personColour } from '@/lib/personColour';
import { proLoadError } from '@/lib/proErrors';
import { toProblem } from '@/api/problem';
import { useAddMember, useRemoveMember, useTeam } from '../api/workers';
import { addMemberSchema, type AddMemberInput, type TeamMember } from '../schemas/worker';

/**
 * « Mon effectif » — the company's active members (`GET /companies/{companyId}/equipe`,
 * guide 15), newest first. A member is added with a name, a phone and skills;
 * « Supprimer » deactivates them.
 */
export function EffectifPage() {
  const t = useT();
  const L = useL();
  const { data, isPending, isError, error, refetch } = useTeam();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <header>
        <h1 className="text-[20px] font-extrabold text-de9-ink">{t('effectifTitle')}</h1>
        {data && (
          <p className="mt-0.5 text-[13px] text-de9-gray">
            {L(`${data.length} membre(s) actif(s)`, `${data.length} عضو نشط`)}
          </p>
        )}
      </header>

      {isError && (
        <EmptyState
          title={L("Impossible de charger l'effectif", 'تعذّر تحميل فريق العمل')}
          description={proLoadError(toProblem(error), L)}
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {L('Réessayer', 'إعادة المحاولة')}
            </Button>
          }
        />
      )}

      {isPending && !isError && (
        <div className="grid animate-pulse gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
          ))}
        </div>
      )}

      {data && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((m) => (
            <MemberCard key={m.id} m={m} onRemove={() => setRemoving(m)} />
          ))}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-de9-teal/50 bg-card p-4 text-center shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
          >
            <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-de9-teal-soft text-de9-teal-dark">
              <UserPlus className="size-5" />
            </span>
            <span className="text-[13px] font-semibold text-de9-teal-dark">{L('Ajouter un membre', 'إضافة عضو')}</span>
          </button>
        </div>
      )}

      {adding && <AddMemberDialog onClose={() => setAdding(false)} />}
      {removing && <RemoveDialog member={removing} onClose={() => setRemoving(null)} />}
    </div>
  );
}

function MemberCard({ m, onRemove }: { m: TeamMember; onRemove: () => void }) {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const salarie = m.kind === 'contractuel_de9de9';
  const skill = m.skill ?? L('Ouvrier', 'عامل');
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-soft dark:ring-1 dark:ring-border">
      <div className="flex items-center gap-3">
        <WorkerAvatar worker={{ name: m.fullName, colorHex: personColour(m.id) }} size={34} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-de9-ink">{m.fullName}</span>
            {salarie && <BadgeCheck className="size-4 shrink-0 text-de9-blue" />}
          </div>
          <p className="truncate text-[11px] font-medium text-de9-gray">
            {salarie ? L(`${skill} · Salarié de9de9`, `${skill} · موظّف de9de9`) : skill}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-full bg-de9-teal-tint text-de9-teal-dark hover:bg-de9-teal-soft"
          onClick={() => navigate(`/prestataire/effectif/${encodeURIComponent(m.id)}`)}
        >
          {t('voirPlus')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1.5 rounded-full bg-de9-red-soft text-de9-red hover:bg-de9-red-soft/80"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
          {t('supprimer')}
        </Button>
      </div>
    </div>
  );
}

/** « Ajouter un membre » — a name, and optionally a phone and skills. */
function AddMemberDialog({ onClose }: { onClose: () => void }) {
  const L = useL();
  const add = useAddMember();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { fullName: '', phone: '', skill: '' },
  });

  const onSubmit = (values: AddMemberInput) => {
    setServerError(null);
    add.mutate(values, {
      onSuccess: (member) => {
        toast.success(L(`${member.fullName} a rejoint l'équipe`, `انضم ${member.fullName} إلى الفريق`));
        onClose();
      },
      onError: (e) =>
        setServerError(toProblem(e).detail ?? L("Le membre n'a pas pu être ajouté. Réessayez.", 'تعذّرت إضافة العضو. أعد المحاولة.')),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !add.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{L('Ajouter un membre', 'إضافة عضو')}</DialogTitle>
          <DialogDescription>
            {L(
              'Il pourra être affecté à une visite dès maintenant.',
              'يمكن تعيينه في زيارة ابتداءً من الآن.',
            )}
          </DialogDescription>
        </DialogHeader>
        <form id="add-member" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label={L('Nom complet', 'الاسم الكامل')} required error={errors.fullName && L('Indiquez le nom (256 caractères au plus).', 'أدخل الاسم (256 حرفًا كحد أقصى).')}>
            <Input autoFocus maxLength={256} {...register('fullName')} placeholder="Nadia Saadi" />
          </Field>
          <Field label={L('Téléphone', 'الهاتف')} error={errors.phone && L('32 caractères au plus.', '32 حرفًا كحد أقصى.')}>
            <Input type="tel" maxLength={32} dir="ltr" {...register('phone')} placeholder="0550 11 22 33" />
          </Field>
          <Field
            label={L('Compétences', 'المهارات')}
            hint={L('Séparez-les par « · »', 'افصل بينها بـ « · »')}
            error={errors.skill && L('128 caractères au plus.', '128 حرفًا كحد أقصى.')}
          >
            <Input maxLength={128} {...register('skill')} placeholder="Vitrerie · Sols" />
          </Field>
          {serverError && <p className="text-[12.5px] font-semibold text-de9-red">{serverError}</p>}
        </form>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={add.isPending}>
            {L('Annuler', 'إلغاء')}
          </Button>
          <Button type="submit" form="add-member" disabled={add.isPending}>
            {add.isPending && <Loader2 className="size-4 animate-spin" />}
            {L('Ajouter', 'إضافة')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** « Supprimer » after a confirmation: the member is deactivated, their past visits keep them. */
function RemoveDialog({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const L = useL();
  const remove = useRemoveMember();
  const confirm = () =>
    remove.mutate(member.id, {
      onSuccess: () => {
        toast.success(L(`${member.fullName} a été retiré de l'équipe`, `أُزيل ${member.fullName} من الفريق`));
        onClose();
      },
      onError: (e) =>
        toast.error(toProblem(e).detail ?? L("Le membre n'a pas pu être retiré. Réessayez.", 'تعذّرت إزالة العضو. أعد المحاولة.')),
    });

  return (
    <Dialog open onOpenChange={(open) => !open && !remove.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{L(`Retirer ${member.fullName} ?`, `إزالة ${member.fullName}؟`)}</DialogTitle>
          <DialogDescription>
            {L(
              "Il n'apparaîtra plus dans votre effectif et ne pourra plus être affecté. Il reste sur les visites qu'il a déjà réalisées.",
              'لن يظهر بعد الآن في فريقك ولا يمكن تعيينه. يبقى في الزيارات التي أنجزها.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={remove.isPending}>
            {L('Annuler', 'إلغاء')}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={remove.isPending}>
            {remove.isPending && <Loader2 className="size-4 animate-spin" />}
            {L('Retirer', 'إزالة')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string | false;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12.5px] text-de9-gray">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <span className="text-[11.5px] text-de9-red">{error}</span>
      ) : (
        hint && <span className="text-[11.5px] text-de9-gray">{hint}</span>
      )}
    </div>
  );
}
