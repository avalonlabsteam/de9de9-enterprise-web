/**
 * The sound of a live alert: two soft knocks, the app's own file — replace
 * `public/notification.wav` to change it.
 */
const SRC = '/notification.wav';

/** Alerts arriving together make one sound, not a drum roll. */
const MIN_GAP_MS = 1_500;

let audio: HTMLAudioElement | null = null;
let lastAt = 0;

/**
 * Play it. A browser keeps a page silent until the user has clicked or typed
 * in it once: the refusal is expected then, and ignored — the toast still shows.
 */
export function playAlerteSon(): void {
  const now = Date.now();
  if (now - lastAt < MIN_GAP_MS) return;
  lastAt = now;
  audio ??= new Audio(SRC);
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}
