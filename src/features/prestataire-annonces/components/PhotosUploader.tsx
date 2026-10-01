import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { ajouterPhotos, ordonnerPhotos, supprimerPhoto } from '../api/annonces';
import { annonceErreur } from '../lib/erreurs';
import type { Photo } from '../schemas/annonces';

const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * The photos of an annonce, for both kinds: add, reorder (the first one is the
 * cover), remove. Each call carries the annonce's version and answers the list
 * and the new version. Photos need an annonce: on a new form `ensureDraft`
 * saves the draft first.
 */
export function PhotosUploader({
  annonce,
  photos,
  max,
  maxOctets,
  disabled,
  ensureDraft,
  onChange,
  onBusyChange,
  onStale,
}: {
  annonce: { id: string; version: number } | null;
  photos: Photo[];
  max: number;
  maxOctets: number;
  disabled?: boolean;
  /** Saves the draft when there is none yet; null when it could not (the form says why). */
  ensureDraft: () => Promise<{ id: string; version: number } | null>;
  /** The answer of a photo call, with the id of the annonce it was made on (a new form's draft is born here). */
  onChange: (next: { id: string; version: number; photos: Photo[] }) => void;
  /**
   * A photo call (or the silent save before it) is in flight. It carries the
   * annonce's version: the form must not save or submit until it has answered.
   */
  onBusyChange?: (busy: boolean) => void;
  /** The version held is stale: the annonce is to be read again. */
  onStale: () => void;
}) {
  const L = useL();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);

  const run = async (call: (a: { id: string; version: number }) => Promise<{ version: number; photos: Photo[] }>) => {
    setBusy(true);
    onBusyChange?.(true);
    setErreur(null);
    try {
      const cible = annonce ?? (await ensureDraft());
      if (!cible) return;
      onChange({ id: cible.id, ...(await call(cible)) });
    } catch (error) {
      const { message, problem } = annonceErreur(error, L);
      setErreur(message);
      if (problem.code === 'concurrency_conflict' || problem.code === 'annonce_etat_invalide' || problem.code === 'annonce_not_found') onStale();
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  const ajouter = (files: File[]) => {
    if (files.length === 0) return;
    // The same limits and sentences as the server's, said before the bytes leave.
    if (files.some((f) => !TYPES.includes(f.type))) {
      setErreur(L("L'image doit être au format PNG, JPEG ou WebP.", 'يجب أن تكون الصورة بصيغة PNG أو JPEG أو WebP.'));
      return;
    }
    if (files.some((f) => f.size > maxOctets)) {
      setErreur(L(`L'image ne doit pas dépasser ${Math.round(maxOctets / 1_048_576)} Mo.`, `يجب ألا تتجاوز الصورة ${Math.round(maxOctets / 1_048_576)} ميغابايت.`));
      return;
    }
    if (photos.length + files.length > max) {
      setErreur(L(`${max} photos au plus par annonce.`, `${max} صور كحد أقصى لكل إعلان.`));
      return;
    }
    void run((a) => ajouterPhotos(a.id, a.version, files));
  };

  const deplacer = (id: string, vers: number) => {
    const ids = photos.map((p) => p.id);
    const from = ids.indexOf(id);
    if (from < 0 || vers < 0 || vers >= ids.length || vers === from) return;
    ids.splice(vers, 0, ...ids.splice(from, 1));
    void run((a) => ordonnerPhotos(a.id, a.version, ids));
  };

  const fige = disabled || busy;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            draggable={!fige}
            onDragStart={() => setDragged(photo.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragged) deplacer(dragged, index);
              setDragged(null);
            }}
            className={cn('group relative aspect-square overflow-hidden rounded-xl bg-secondary', dragged === photo.id && 'opacity-50')}
          >
            <img src={photo.url} alt="" className="size-full object-cover" draggable={false} />
            {index === 0 && (
              <span className="absolute start-1.5 top-1.5 rounded-full bg-de9-ink/80 px-2 py-0.5 text-[10px] font-bold text-white">
                {L('Couverture', 'الغلاف')}
              </span>
            )}
            {!fige && (
              <>
                <button
                  type="button"
                  onClick={() => void run((a) => supprimerPhoto(a.id, photo.id, a.version))}
                  aria-label={L('Supprimer la photo', 'حذف الصورة')}
                  className="absolute end-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-de9-red text-white shadow-soft"
                >
                  <X className="size-3.5" />
                </button>
                {/* Drag to reorder — or these two, which a touch screen can press. */}
                <span className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => deplacer(photo.id, index - 1)}
                    aria-label={L('Avancer', 'تقديم')}
                    className="grid size-6 place-items-center rounded-full bg-card/90 text-de9-ink shadow-soft disabled:opacity-0"
                  >
                    <ChevronLeft className="size-3.5 rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    disabled={index === photos.length - 1}
                    onClick={() => deplacer(photo.id, index + 1)}
                    aria-label={L('Reculer', 'تأخير')}
                    className="grid size-6 place-items-center rounded-full bg-card/90 text-de9-ink shadow-soft disabled:opacity-0"
                  >
                    <ChevronRight className="size-3.5 rtl:rotate-180" />
                  </button>
                </span>
              </>
            )}
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            disabled={fige}
            onClick={() => input.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-de9-teal/60 text-de9-teal-dark transition-colors hover:bg-de9-teal-soft disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span className="text-[12px] font-bold">{L('Ajouter', 'إضافة')}</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={TYPES.join(',')}
        multiple
        hidden
        onChange={(e) => {
          ajouter([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      <p className="text-[12px] text-de9-gray">
        {L(
          `PNG, JPEG ou WebP · ${Math.round(maxOctets / 1_048_576)} Mo au plus · ${max} photos au plus. La première est la couverture.`,
          `PNG أو JPEG أو WebP · ${Math.round(maxOctets / 1_048_576)} ميغابايت كحد أقصى · ${max} صور كحد أقصى. الأولى هي الغلاف.`,
        )}
      </p>
      {erreur && <p className="text-[12px] text-de9-red">{erreur}</p>}
    </div>
  );
}
