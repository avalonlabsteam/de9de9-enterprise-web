import { cn } from '@/lib/utils';
import { useAuthedImage } from '@/lib/useAuthedImage';

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

/**
 * The company's logo — an authenticated file, fetched with the bearer token —
 * or its initials on a coloured circle while it loads or when there is none.
 */
export function CompanyAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const src = useAuthedImage(logoUrl);
  if (src) {
    return <img src={src} alt={name} className={cn('flex-none rounded-full object-cover', className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn(
        'flex flex-none items-center justify-center rounded-full bg-de9-blue font-bold text-white',
        className,
      )}
    >
      {initialsOf(name) || '?'}
    </span>
  );
}
