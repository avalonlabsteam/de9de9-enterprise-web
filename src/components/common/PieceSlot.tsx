import { useRef } from 'react';
import { FileCheck2, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A picked file. Screens whose endpoint takes real uploads (KYC) pass `accept`
 * and read `file`; the others still get a placeholder with only a name.
 */
export interface PieceFile {
  name: string;
  file?: File;
}

/**
 * A file-upload slot. With `accept` it opens the file dialog and hands back the
 * real File; without it, clicking "uploads" a placeholder so a flow with no
 * upload endpoint yet (facture proof, tender attachment) can proceed.
 */
export function PieceSlot({
  label,
  hint,
  value,
  onChange,
  fileName = 'document.pdf',
  accept,
  onReject,
  maxBytes,
  locked,
  className,
}: {
  label: string;
  hint?: string;
  value: PieceFile | null;
  onChange: (file: PieceFile | null) => void;
  fileName?: string;
  /** Set it to pick a real file (e.g. `application/pdf,image/*`). */
  accept?: string;
  /** Called instead of `onChange` when the picked file is over `maxBytes`. */
  onReject?: (file: File) => void;
  maxBytes?: number;
  /** The file stays: no ✕ to take it off (e.g. a piece already validated). */
  locked?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (value) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg bg-de9-teal px-3.5 py-3 text-white',
          className,
        )}
      >
        <span className="flex size-8 flex-none items-center justify-center rounded-full bg-white text-de9-teal-dark">
          <FileCheck2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-white">{label}</p>
          <p className="truncate text-[12px] text-white/85">{value.name}</p>
        </div>
        {!locked && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex size-7 flex-none items-center justify-center rounded-full text-white/80 hover:bg-white/15"
            aria-label="Retirer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => (accept ? inputRef.current?.click() : onChange({ name: fileName }))}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg bg-de9-teal-soft px-3.5 py-3 text-start transition-shadow hover:shadow-lift',
        className,
      )}
    >
      <UploadCloud className="size-5 flex-none text-de9-teal-dark" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-de9-teal-dark">{label}</p>
        {hint && <p className="truncate text-[12px] text-de9-teal-dark/70">{hint}</p>}
      </div>
      <span className="flex-none rounded-full bg-card px-2.5 py-1 text-[12px] font-bold text-de9-teal-dark shadow-soft">
        Importer
      </span>
      {accept && (
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            // Reset first: picking the same file twice must still fire.
            e.target.value = '';
            if (!file) return;
            if (maxBytes && file.size > maxBytes) onReject?.(file);
            else onChange({ name: file.name, file });
          }}
        />
      )}
    </button>
  );
}
