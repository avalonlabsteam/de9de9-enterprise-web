/**
 * Brand glyphs for the landing page. lucide-react dropped its brand icons, so
 * the store badges and social links carry their own paths. All of them inherit
 * `currentColor` except `GooglePlayColor`, which keeps the official four-tone
 * mark used on the light footer badge.
 */

type IconProps = { className?: string };

export function AppleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.4 1.4c0 1.1-.4 2.2-1.3 3-.9.9-1.9 1.4-3 1.3 0-1.1.5-2.2 1.3-3 .8-.8 2-1.4 3-1.3zM20.9 17.1c-.5 1.2-.8 1.7-1.4 2.7-.9 1.5-2.2 3.3-3.8 3.3-1.4 0-1.8-.9-3.7-.9s-2.3.9-3.7.9c-1.6 0-2.8-1.6-3.7-3.1-2.5-4-2.8-8.7-1.2-11.2C4.5 7 6.2 6 7.9 6c1.7 0 2.7.9 4.1.9 1.4 0 2.2-.9 4.1-.9 1.5 0 3 .8 4.1 2.2-3.6 2-3 7.2.7 8.9z" />
    </svg>
  );
}

/** Single-tone play triangle, for use on the teal band. */
export function GooglePlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M3.6 1.8 20.3 10c.7.4.7 1.6 0 2L3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z" />
    </svg>
  );
}

/** Four-tone Google Play mark for the light store badge. */
export function GooglePlayColor({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#00C853" d="M3.6 1.8c.5-.3 1.3-.3 2 .1l11.3 6.6L13.4 12z" />
      <path fill="#00B0FF" d="M3.6 1.8 13.4 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z" />
      <path fill="#FFD600" d="m16.9 8.5 3.4 2c.7.4.7 1.6 0 2l-3.4 2L13.4 12z" />
      <path fill="#FF3D00" d="M3.6 22.2 13.4 12l3.5 3.5-11.3 6.6c-.7.4-1.5.4-2 .1z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.9-.1zm0 2.2c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.3-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.1.4-.3 1-.3 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.3 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.1 1 .3 2.1.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.3.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.1-.4.3-1 .3-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.3-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.1-1-.3-2.1-.3-1.2-.1-1.6-.1-4.7-.1z" />
      <path d="M12 6.9a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2zm0 8.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6z" />
      <circle cx="17.2" cy="6.7" r="1.2" />
    </svg>
  );
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.6 5.8a4.8 4.8 0 0 1-1-1.3 5 5 0 0 1-.5-1.7h-3.3v13.2a2.9 2.9 0 1 1-2.1-2.8v-3.3a6.2 6.2 0 1 0 5.4 6.1V9.4a8.2 8.2 0 0 0 4.8 1.5V7.6a4.8 4.8 0 0 1-3.3-1.8z" />
    </svg>
  );
}

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.4 3H3.6C2.7 3 2 3.7 2 4.6v14.8c0 .9.7 1.6 1.6 1.6h16.8c.9 0 1.6-.7 1.6-1.6V4.6c0-.9-.7-1.6-1.6-1.6zM8.1 18.2H5.3V9.7h2.8v8.5zM6.7 8.5a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2zm12 9.7h-2.8v-4.1c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.2H10V9.7h2.7v1.2c.4-.7 1.3-1.5 2.7-1.5 2.9 0 3.4 1.9 3.4 4.3v4.5z" />
    </svg>
  );
}
