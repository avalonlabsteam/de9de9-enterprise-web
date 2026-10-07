import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, ImagePlus, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { tailleLabel } from '@/lib/fichiers';
import { ajouterDocuments, ajouterPhotos, ordonnerPhotos, supprimerDocument, supprimerPhoto } from '../api/annonces';
import { annonceErreur } from '../lib/erreurs';
import type { AnnonceDocument, Photo } from '../schemas/annonces';

const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const mo = (octets: number) => Math.round(octets / 1_048_576);

/** The codes after which what is on screen is no longer what the server holds. */
const PERIMES = ['concurrency_conflict', 'annonce_etat_invalide', 'annonce_not_found', 'document_not_found'];

/**
 * The photos of an annonce, for both kinds: add, reorder (the first one is the
 * cover), remove. Each call carries the annonce's version and answers the list
 * and the new version. Photos need an annonce: on a new form `ensureDraft`
 * saves the draft first.
 *
 * With `documents` (a B2B annonce) the same « Ajouter » takes PDFs too: each
 * kind goes to its own route and has its own list — they are never mixed.
 */
export function PhotosUploader({
  annonce,
  photos,
  max,
  maxOctets,
  disabled,
  documents,
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
  /** B2B only: the annonce's PDFs, their limits, and where the answer of a document call goes. */
  documents?: {
    items: AnnonceDocument[];
    max: number;
    maxOctets: number;
    /** `application/pdf` */
    types: string[];
    onChange: (next: { id: string; version: number; documents: AnnonceDocument[] }) => void;
  };
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

  /** One piece of work on the annonce — born first when the form is new — and what a refusal of it says. */
  const run = async (work: (a: { id: string; version: number }) => Promise<void>) => {
    setBusy(true);
    onBusyChange?.(true);
    setErreur(null);
    try {
      const cible = annonce ?? (await ensureDraft());
      if (!cible) return;
      await work(cible);
    } catch (error) {
      const { message, problem } = annonceErreur(error, L);
      setErreur(message);
      if (PERIMES.includes(problem.code)) onStale();
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  /** A photo call: it answers the list and the new version. */
  const photosCall = (call: (a: { id: string; version: number }) => Promise<{ version: number; photos: Photo[] }>) =>
    run(async (a) => onChange({ id: a.id, ...(await call(a)) }));

  const ajouter = (files: File[]) => {
    if (files.length === 0) return;
    const images = files.filter((f) => TYPES.includes(f.type));
    const pdfs = documents ? files.filter((f) => documents.types.includes(f.type)) : [];
    // The same limits and sentences as the server's, said before the bytes leave.
    if (images.length + pdfs.length < files.length) {
      setErreur(
        documents
          ? L('Le fichier doit être une image PNG, JPEG ou WebP, ou un document PDF.', 'يجب أن يكون الملف صورة PNG أو JPEG أو WebP، أو مستند PDF.')
          : L("L'image doit être au format PNG, JPEG ou WebP.", 'يجب أن تكون الصورة بصيغة PNG أو JPEG أو WebP.'),
      );
      return;
    }
    if (images.some((f) => f.size > maxOctets)) {
      setErreur(L(`L'image ne doit pas dépasser ${mo(maxOctets)} Mo.`, `يجب ألا تتجاوز الصورة ${mo(maxOctets)} ميغابايت.`));
      return;
    }
    if (photos.length + images.length > max) {
      setErreur(L(`${max} photos au plus par annonce.`, `${max} صور كحد أقصى لكل إعلان.`));
      return;
    }
    if (documents && pdfs.some((f) => f.size > documents.maxOctets)) {
      setErreur(L(`Le document ne doit pas dépasser ${mo(documents.maxOctets)} Mo.`, `يجب ألا يتجاوز المستند ${mo(documents.maxOctets)} ميغابايت.`));
      return;
    }
    if (documents && documents.items.length + pdfs.length > documents.max) {
      setErreur(L(`${documents.max} documents au plus par annonce.`, `${documents.max} مستندات كحد أقصى لكل إعلان.`));
      return;
    }
    void run(async (a) => {
      // Each kind to its own route, one after the other: both carry the annonce's version, and
      // the photos' answer gives the documents theirs.
      let version = a.version;
      if (images.length > 0) {
        const res = await ajouterPhotos(a.id, version, images);
        version = res.version;
        onChange({ id: a.id, ...res });
      }
      if (documents && pdfs.length > 0) {
        documents.onChange({ id: a.id, ...(await ajouterDocuments(a.id, version, pdfs)) });
      }
    });
  };

  const deplacer = (id: string, vers: number) => {
    const ids = photos.map((p) => p.id);
    const from = ids.indexOf(id);
    if (from < 0 || vers < 0 || vers >= ids.length || vers === from) return;
    ids.splice(vers, 0, ...ids.splice(from, 1));
    void photosCall((a) => ordonnerPhotos(a.id, a.version, ids));
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
                  onClick={() => void photosCall((a) => supprimerPhoto(a.id, photo.id, a.version))}
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
        {/* One « Ajouter » for both kinds: it stays while either list has room. */}
        {(photos.length < max || (documents && documents.items.length < documents.max)) && (
          <button
            type="button"
            disabled={fige}
            onClick={() => input.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-de9-teal/60 text-de9-teal-dark transition-colors hover:bg-de9-teal-soft disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : documents ? <Plus className="size-5" /> : <ImagePlus className="size-5" />}
            <span className="text-[12px] font-bold">{L('Ajouter', 'إضافة')}</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={[...TYPES, ...(documents?.types ?? [])].join(',')}
        multiple
        hidden
        onChange={(e) => {
          ajouter([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      {documents && documents.items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {documents.items.map((doc) => {
            const taille = tailleLabel(doc.tailleOctets, L);
            return (
              <li key={doc.id} className="flex items-center gap-2.5 rounded-xl bg-secondary/60 px-3 py-2">
                <FileText className="size-5 flex-none text-de9-red" />
                {/* Public, like a photo: a new tab, under its own file name. */}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-[13px] font-semibold text-de9-ink hover:underline"
                >
                  {doc.nom}
                </a>
                {taille && <span className="flex-none text-[12px] text-de9-gray tabular-nums">{taille}</span>}
                {!fige && (
                  <button
                    type="button"
                    onClick={() =>
                      void run(async (a) => documents.onChange({ id: a.id, ...(await supprimerDocument(a.id, doc.id, a.version)) }))
                    }
                    className="flex-none text-[12px] font-bold text-de9-red hover:underline"
                  >
                    {L('Retirer', 'إزالة')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {documents ? (
        <div className="flex flex-col gap-0.5 text-[12px] text-de9-gray">
          <p>
            {L(
              `Photos : PNG, JPEG ou WebP · ${mo(maxOctets)} Mo au plus · ${max} au plus. La première est la couverture.`,
              `الصور: PNG أو JPEG أو WebP · ${mo(maxOctets)} ميغابايت كحد أقصى · ${max} كحد أقصى. الأولى هي الغلاف.`,
            )}
          </p>
          <p>
            {L(
              `Documents : PDF · ${mo(documents.maxOctets)} Mo au plus · ${documents.max} au plus.`,
              `المستندات: PDF · ${mo(documents.maxOctets)} ميغابايت كحد أقصى · ${documents.max} كحد أقصى.`,
            )}
          </p>
        </div>
      ) : (
        <p className="text-[12px] text-de9-gray">
          {L(
            `PNG, JPEG ou WebP · ${mo(maxOctets)} Mo au plus · ${max} photos au plus. La première est la couverture.`,
            `PNG أو JPEG أو WebP · ${mo(maxOctets)} ميغابايت كحد أقصى · ${max} صور كحد أقصى. الأولى هي الغلاف.`,
          )}
        </p>
      )}
      {erreur && <p className="text-[12px] text-de9-red">{erreur}</p>}
    </div>
  );
}
