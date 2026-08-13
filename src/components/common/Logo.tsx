import { cn } from '@/lib/utils';

/** "De9 De9 · Entreprise" brand lockup (served from `public/logo-brand.png`). */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo-brand.png"
      alt="De9 De9 Entreprise"
      width={208}
      height={232}
      className={cn('h-12 w-auto', className)}
    />
  );
}
