/**
 * The social links of an annonce (`liensSociaux`): one member per network, by
 * its code, null — or absent — where no page is given. The list of networks is
 * the API's; these names are only for the screens that receive a bare code.
 */
export type LiensSociaux = Record<string, string | null | undefined>;

const LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  linkedin: 'LinkedIn',
};

/** A network's name, where an answer gives only its code. */
export const reseauLabel = (code: string): string => LABELS[code] ?? code.charAt(0).toUpperCase() + code.slice(1);

/** The networks that have a page, in the answer's order. */
export const liensRemplis = (liens: LiensSociaux | null | undefined): [code: string, url: string][] =>
  Object.entries(liens ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '');
