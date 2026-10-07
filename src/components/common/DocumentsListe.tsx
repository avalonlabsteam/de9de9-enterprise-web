import { ExternalLink, FileText } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { tailleLabel } from '@/lib/fichiers';

/** A file anyone holding its address can open — an annonce's PDF. */
export interface DocumentPublic {
  id: string;
  nom: string;
  /** Absolute and public, like a photo's address. */
  url: string;
  tailleOctets?: number | null;
}

/**
 * Documents to read: name, size, « Ouvrir ↗ ». Each opens in a new tab under
 * its own file name — never in a frame, the server forbids it.
 */
export function DocumentsListe({ documents }: { documents: DocumentPublic[] }) {
  const L = useL();
  return (
    <ul className="divide-y divide-border">
      {documents.map((doc) => {
        const taille = tailleLabel(doc.tailleOctets, L);
        return (
          <li key={doc.id}>
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2.5 hover:bg-secondary/40">
              <span className="grid size-8 flex-none place-items-center rounded-lg bg-de9-red-soft text-de9-red">
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-de9-ink">{doc.nom}</span>
                {taille && <span className="block text-[11.5px] text-de9-gray">{taille}</span>}
              </span>
              <span className="flex flex-none items-center gap-1 text-[12.5px] font-bold text-de9-teal-dark">
                {L('Ouvrir', 'فتح')}
                <ExternalLink className="size-3.5" />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
