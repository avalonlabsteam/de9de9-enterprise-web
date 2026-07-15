import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** "De9 De9 · ENTREPRISE" brand lockup. */
export function Logo({ className }: { className?: string }) {
  const t = useT();
  return (
    <div className={cn('flex items-center gap-[11px]', className)}>
      <span className="text-[21px] font-extrabold leading-[0.82]">
        <span className="text-de9-red">De9</span> <span className="text-de9-teal">De9</span>
      </span>
      <span className="rounded-[7px] bg-de9-ink px-[9px] py-1 text-[10.5px] font-extrabold tracking-[.12em] text-white dark:text-[#151923]">
        {t('brandEntreprise')}
      </span>
    </div>
  );
}
