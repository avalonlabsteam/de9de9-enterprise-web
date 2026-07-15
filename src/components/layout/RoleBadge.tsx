import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

/** CLIENT / PRO pill reflecting the logged-in persona. */
export function RoleBadge({ className }: { className?: string }) {
  const t = useT();
  const role = useAuthStore((s) => s.user?.role);
  if (!role) return null;
  const isClient = role === 'client';
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[10.5px] font-extrabold tracking-[.1em]',
        isClient
          ? 'bg-[#EAF2FD] text-[#2F7FD0] dark:bg-[#17293A] dark:text-[#5BB6F0]'
          : 'bg-[#E5F7F4] text-de9-teal-dark dark:bg-[#14322E]',
        className,
      )}
    >
      {isClient ? t('clientTag') : t('proTag')}
    </span>
  );
}
