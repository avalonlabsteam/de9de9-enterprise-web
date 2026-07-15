import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { useL } from '@/lib/i18n';
import { useWorker } from '../api/workers';

export function WorkerProfilePage() {
  const L = useL();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isPending, isError } = useWorker(id);

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-de9-gray hover:text-de9-ink"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {L('Retour', 'رجوع')}
      </button>

      <h1 className="text-[20px] font-extrabold text-de9-ink">
        {L("Profil de l'ouvrier", 'ملف العامل')}
      </h1>

      {isError && (
        <EmptyState
          title={L('Ouvrier introuvable', 'العامل غير موجود')}
          description={L('Veuillez réessayer plus tard.', 'يرجى المحاولة لاحقًا.')}
        />
      )}

      {isPending && !isError && (
        <div className="h-40 animate-pulse rounded-2xl border border-de9-line bg-card" />
      )}

      {data && (
        <>
          {/* Identity card */}
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <WorkerAvatar worker={data} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-extrabold text-de9-ink">{data.name}</p>
                <p className="truncate text-[12.5px] text-de9-gray">{data.role}</p>
              </div>
              <div className="flex flex-none flex-col items-end gap-1.5">
                {typeof data.note === 'number' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF6E9] px-2 py-0.5 text-[11.5px] font-bold text-[#B9781A] dark:bg-[#33280F] dark:text-[#E0A82E]">
                    <Star className="size-3 fill-current" />
                    {data.note.toFixed(1)}
                  </span>
                )}
                <span
                  className={
                    data.available
                      ? 'rounded-full bg-de9-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-de9-teal-dark'
                      : 'rounded-full bg-[#FDECEC] px-2.5 py-0.5 text-[11px] font-bold text-de9-red dark:bg-[#331A1C] dark:text-[#FF7A80]'
                  }
                >
                  {data.avail ?? (data.available ? L('Disponible', 'متاح') : L('Occupé', 'مشغول'))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Compétences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">{L('Compétences', 'المهارات')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.skills && data.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-secondary px-3 py-1 text-[12.5px] font-medium text-de9-ink"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-de9-gray">
                  {L('Aucune compétence renseignée', 'لا توجد مهارات مسجّلة')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">{L('Contact', 'التواصل')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.phone && <p className="text-[13.5px] font-medium text-de9-ink">{data.phone}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5">
                  <Phone className="size-4" />
                  {L('Appeler', 'اتصال')}
                </Button>
                <Button variant="outline" className="flex-1 gap-1.5">
                  <MessageCircle className="size-4" />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Missions affectées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">{L('Missions affectées', 'المهام المسنَدة')}</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                title={L('Aucune mission affectée', 'لا توجد مهمة مسنَدة')}
                description={L('Les missions affectées à cet ouvrier apparaîtront ici.', 'ستظهر المهام المسنَدة لهذا العامل هنا.')}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
