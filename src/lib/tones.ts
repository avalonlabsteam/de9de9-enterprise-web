/**
 * The API's `ton` vocabulary — attention · info · action · succes · valide ·
 * danger · neutre — is a meaning, not a colour: this is the app's palette for
 * each one, shared by every screen that prints one (Suivi, Calendrier,
 * Portefeuille). Unknown tones draw neutral rather than failing.
 */
const TONE_PILL: Record<string, string> = {
  attention: 'bg-de9-orange/20 text-de9-orange-deep',
  info: 'bg-de9-blue-tint text-de9-blue',
  action: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  succes: 'bg-de9-teal-soft text-de9-teal-dark',
  valide: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  danger: 'bg-de9-red-soft text-de9-red',
  neutre: 'bg-secondary text-de9-gray',
};

/** The « PROCHAINE ACTION » box: a tinted panel with a coloured edge. */
const TONE_BOX: Record<string, string> = {
  attention: 'border-de9-orange-deep/40 bg-de9-orange/10',
  info: 'border-de9-blue/40 bg-de9-blue-tint/60',
  action: 'border-violet-400/50 bg-violet-50 dark:bg-violet-500/10',
  succes: 'border-de9-teal/50 bg-de9-teal-soft/60',
  valide: 'border-emerald-400/50 bg-emerald-50 dark:bg-emerald-500/10',
  danger: 'border-de9-red/40 bg-de9-red-soft/60',
  neutre: 'border-border bg-secondary/60',
};

/** Text only — info lines, credit lines. */
const TONE_TEXT: Record<string, string> = {
  attention: 'text-de9-orange-deep',
  info: 'text-de9-blue',
  action: 'text-violet-600 dark:text-violet-300',
  succes: 'text-de9-teal-dark',
  valide: 'text-emerald-600 dark:text-emerald-400',
  danger: 'text-de9-red',
  neutre: 'text-de9-gray',
};

export const tonePill = (ton?: string | null) => TONE_PILL[ton ?? ''] ?? TONE_PILL.neutre;
export const toneBox = (ton?: string | null) => TONE_BOX[ton ?? ''] ?? TONE_BOX.neutre;
export const toneText = (ton?: string | null) => TONE_TEXT[ton ?? ''] ?? TONE_TEXT.neutre;

/** Button `style` → the classes of the app's button. */
const BUTTON_STYLE: Record<string, string> = {
  primaire: 'bg-de9-teal text-white shadow-glow hover:bg-de9-teal-dark',
  succes: 'bg-emerald-600 text-white hover:bg-emerald-700',
  contour: 'border border-de9-teal bg-transparent text-de9-teal-dark hover:bg-de9-teal-soft',
  neutre: 'bg-secondary text-de9-ink hover:bg-secondary/80',
  danger: 'bg-destructive text-white hover:bg-destructive/90',
  lien_danger: 'bg-transparent text-destructive underline-offset-4 shadow-none hover:underline',
  ajout: 'border border-dashed border-de9-teal/60 bg-transparent text-de9-teal-dark hover:bg-de9-teal-soft',
};
export const buttonStyle = (style?: string | null) => BUTTON_STYLE[style ?? ''] ?? BUTTON_STYLE.neutre;

/** The confirm button of a sheet (`tonConfirmer`). */
export const confirmStyle = (ton?: string | null) =>
  ton === 'danger' ? BUTTON_STYLE.danger : ton === 'succes' ? BUTTON_STYLE.succes : BUTTON_STYLE.primaire;

/** Icon codes the app can draw (see `ApiIcon`). */
const ICON_CODES = new Set([
  'coche',
  'cadenas',
  'cadenas_ouvert',
  'fleche_bas',
  'fleche_haut',
  'sablier',
  'calendrier',
  'facture',
  'etoile',
  'recurrence',
  'alerte',
  'plus',
  'banque',
]);
export const hasIcon = (code?: string | null): boolean => ICON_CODES.has(code ?? '');
