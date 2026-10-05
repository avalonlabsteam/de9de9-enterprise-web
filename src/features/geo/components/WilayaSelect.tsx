import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useL } from '@/lib/i18n';
import { useWilayas } from '../api/geo';

/**
 * A wilaya picked by its name, listed with its official number (« 16 - Alger »)
 * — the 58 of `GET /geo/wilayas`. A name the list does not hold (an older
 * demande, or the list not loaded yet) is still offered, bare, so the value
 * on screen is never lost.
 */
export function WilayaSelect({
  value,
  onChange,
  seulement,
}: {
  value: string;
  onChange: (nom: string) => void;
  /** Only these wilayas, by name; empty or absent = all of them. */
  seulement?: string[];
}) {
  const L = useL();
  const wilayas = useWilayas();
  const parNom = new Map((wilayas.data ?? []).map((w) => [w.nom, w]));
  const proposes = seulement && seulement.length > 0 ? seulement : [...parNom.keys()];
  const noms = value && !proposes.includes(value) ? [value, ...proposes] : proposes;

  return (
    <>
      <Select value={value} onValueChange={onChange} disabled={noms.length === 0}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={L('Choisir une wilaya', 'اختر ولاية')} />
        </SelectTrigger>
        <SelectContent>
          {noms.map((nom) => {
            const w = parNom.get(nom);
            return (
              <SelectItem key={nom} value={nom}>
                {w ? `${String(w.code).padStart(2, '0')} - ${L(w.nom, w.nomAr ?? w.nom)}` : nom}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {wilayas.isError && (
        <button
          type="button"
          className="mt-1 text-[12px] font-semibold text-de9-teal-dark underline"
          onClick={() => void wilayas.refetch()}
        >
          {L('Wilayas indisponibles — réessayer', 'تعذّر تحميل الولايات — أعد المحاولة')}
        </button>
      )}
    </>
  );
}
