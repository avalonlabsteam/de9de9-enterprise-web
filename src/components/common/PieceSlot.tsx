import { FileCheck2, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A mock file (only the name is tracked — no real upload happens). */
export interface PieceFile {
  name: string;
}

/**
 * A file-upload slot for the mock app. Clicking "uploads" a placeholder file so
 * the flow (KYC docs, facture proof, …) can proceed without a real backend.
 */
export function PieceSlot({
  label,
  hint,
  value,
  onChange,
  fileName = 'document.pdf',
  className,
}: {
  label: string;
  hint?: string;
  value: PieceFile | null;
  onChange: (file: PieceFile | null) => void;
  fileName?: string;
  className?: string;
}) {
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
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex size-7 flex-none items-center justify-center rounded-full text-white/80 hover:bg-white/15"
          aria-label="Retirer"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onChange({ name: fileName })}
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
    </button>
  );
}
