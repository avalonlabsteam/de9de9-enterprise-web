import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-de9-line bg-card/60 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-de9-gray">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <div>
        <p className="text-[14px] font-bold text-de9-ink">{title}</p>
        {description && <p className="mt-1 text-[13px] text-de9-gray">{description}</p>}
      </div>
      {action}
    </div>
  );
}
