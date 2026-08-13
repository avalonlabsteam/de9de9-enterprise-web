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
        'flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-[14px] bg-card text-de9-teal shadow-lift dark:ring-1 dark:ring-border">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <div>
        <p className="text-[13px] font-semibold text-de9-teal">{title}</p>
        {description && <p className="mt-1 text-[13px] text-de9-gray">{description}</p>}
      </div>
      {action}
    </div>
  );
}
