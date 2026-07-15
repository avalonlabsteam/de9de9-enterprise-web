import { Hammer } from 'lucide-react';
import { EmptyState } from './EmptyState';

/** Temporary placeholder for a route whose feature is not built yet. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="animate-fade-in">
      <EmptyState
        title={title}
        description="Écran en cours de construction."
        icon={<Hammer className="size-6" />}
      />
    </div>
  );
}
