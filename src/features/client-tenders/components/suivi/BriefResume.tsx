import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/api/hostUrl';
import { openAuthedFile } from '@/lib/authedFile';
import { Card, CardContent } from '@/components/ui/card';
import type { Brief } from '../../schemas/suivi';

/** One fact of the demande. `long` is a text of several lines: under its label, not beside it. */
function Ligne({ label, long, children }: { label: string; long?: boolean; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1 py-3', !long && 'sm:flex-row sm:items-start sm:justify-between sm:gap-6')}>
      <dt className="flex-none text-[13px] text-de9-gray">{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-[13.5px] break-words text-de9-ink',
          long ? 'whitespace-pre-line' : 'font-semibold sm:text-end',
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/**
 * « Votre demande » — what the client asked for, read-only, from the `brief`
 * the edit form is filled with. The services (the title), the category, the
 * wilaya and the date stand in the header and are not said again; a field left
 * empty has no row.
 */
export function BriefResume({ brief }: { brief: Brief }) {
  const L = useL();

  const description = brief.description?.trim();
  const criteres = brief.criteresSelection?.trim();
  const delai = brief.delai?.label ?? brief.delai?.dateLabel;
  const budget =
    brief.budget?.label ?? (brief.budget?.maxDzd != null ? `${brief.budget.maxDzd.toLocaleString('fr-FR')} DA` : null);
  // The label of the value held; the options name it when the answer does not.
  const choisi = (champ: Brief['typeBesoin']) =>
    champ?.valeur == null && !champ?.code
      ? null
      : (champ.label ?? champ.options.find((o) => o.valeur === champ.valeur || o.code === champ.code)?.label);
  const type = choisi(brief.typeBesoin);
  const frequence = choisi(brief.frequence);
  const fichiers = brief.documents?.fichiers ?? [];

  if (!description && !criteres && !delai && !budget && !type && !frequence && fichiers.length === 0) return null;

  const ouvrir = async (url: string) => {
    try {
      await openAuthedFile(apiUrl(url));
    } catch {
      toast.error(L("Impossible d'ouvrir le document.", 'تعذّر فتح المستند.'));
    }
  };

  return (
    <Card>
      <CardContent className="py-5">
        <h2 className="text-[15px] font-bold text-de9-ink">{L('Votre demande', 'طلبك')}</h2>
        <dl className="mt-1 divide-y divide-border">
          {description && (
            <Ligne long label={L('Description du besoin', 'وصف الحاجة')}>
              {description}
            </Ligne>
          )}
          {delai && <Ligne label={L('Délai souhaité', 'الأجل المطلوب')}>{delai}</Ligne>}
          {budget && <Ligne label={L('Budget estimatif', 'الميزانية التقديرية')}>{budget}</Ligne>}
          {type && <Ligne label={L('Type de besoin', 'نوع الحاجة')}>{type}</Ligne>}
          {frequence && <Ligne label={L('Fréquence', 'التواتر')}>{frequence}</Ligne>}
          {criteres && (
            <Ligne long label={L('Critères de sélection prioritaires', 'معايير الاختيار ذات الأولوية')}>
              {criteres}
            </Ligne>
          )}
          {fichiers.length > 0 && (
            <Ligne long label={L('Documents joints', 'المستندات المرفقة')}>
              <ul className="flex flex-col gap-1.5">
                {fichiers.map((f) => (
                  <li key={f.id ?? f.nom} className="flex min-w-0 items-center gap-2">
                    <FileText className="size-4 flex-none text-de9-teal-dark" />
                    {f.url ? (
                      <button
                        type="button"
                        onClick={() => void ouvrir(f.url as string)}
                        className="min-w-0 truncate text-start font-semibold text-de9-teal-dark hover:underline"
                      >
                        {f.nom}
                      </button>
                    ) : (
                      <span className="min-w-0 truncate">{f.nom}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Ligne>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
