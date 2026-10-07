import type { Role } from '@/stores/authStore';
import type { Alerte } from '../schemas/alerte';

/**
 * `cible.chemin` names the screens by the API's paths (`/client/demandes/{id}`,
 * `/pro/missions/{id}?occurrence=…`, `/kyc`). This app files some of them
 * under other names: this is the one table between the two. `exact` is false
 * when the screen does not exist here yet and a nearby one stands in (a
 * sous-traitance, a particulier booking, the reviews…).
 */
interface Resolved {
  path: string;
  exact: boolean;
}

type Rule = [RegExp, (m: RegExpExecArray, search: string, side: Role) => Resolved];

const exact = (path: string): Resolved => ({ path, exact: true });
const near = (path: string): Resolved => ({ path, exact: false });

const RULES: Rule[] = [
  // ----- client side (guide 11b §2) -----
  [/^\/client$/, () => exact('/client')],
  [/^\/client\/demandes$/, (_, q) => exact(`/client/tenders${q}`)],
  // `section=devis|commande`, `occurrence` — read by « Suivi d'une demande ».
  [/^\/client\/demandes\/([^/]+)$/, (m, q) => exact(`/client/tender/${m[1]}${q}`)],
  // `statut` — read by the list. One invoice opens in a sheet over it (`?facture=`).
  [/^\/client\/factures$/, (_, q) => exact(`/client/factures${q}`)],
  [/^\/client\/factures\/([^/]+)$/, (m) => exact(`/client/factures?facture=${m[1]}`)],
  [/^\/client\/portefeuille$/, () => exact('/client/wallet')],
  [/^\/client\/portefeuille\/mouvements\/([^/]+)$/, (m) => exact(`/client/wallet/mouvements/${m[1]}`)],
  [/^\/client\/profil$/, () => exact('/client/profile')],
  [/^\/client\/sous-traitance(\/.*)?$/, () => near('/client')],
  // A prestataire's published offer (guide 19b §10) is filed under « offres » here.
  [/^\/client\/annonces\/([^/]+)$/, (m) => exact(`/client/offres/${m[1]}`)],
  // ----- shared -----
  [/^\/kyc$/, (_, __, side) => exact(side === 'prestataire' ? '/onboarding/kyc' : '/client/kyc')],
  // ----- prestataire side (guide 11c §2) -----
  [/^\/pro$/, () => exact('/prestataire')],
  // `occurrence`, `facture`, `devis`, `onglet` — read by the screens themselves.
  [/^\/pro\/(missions|demandes-devis)(\/[^/]+)?$/, (m, q) => exact(`/prestataire/${m[1]}${m[2] ?? ''}${q}`)],
  [/^\/pro\/equipe$/, () => exact('/prestataire/effectif')],
  // « Mes annonces » and one annonce (guide 19b §13); `type`, `statut` — read by the list.
  [/^\/pro\/annonces(\/[^/]+)?$/, (m, q) => exact(`/prestataire/annonces${m[1] ?? ''}${q}`)],
  [/^\/pro\/b2c$/, (_, q) => exact(`/prestataire/b2c${q}`)],
  [/^\/pro\/b2c\/reservations\/[^/]+$/, () => near('/prestataire/b2c?onglet=recues')],
  // `handicap` — read by the profile, which opens its handicap sheet.
  [/^\/pro\/profil$/, (_, q) => exact(`/prestataire/profile${q}`)],
  [/^\/pro\/profil\/.+$/, () => near('/prestataire/profile')],
  // Any other pro screen: the same path under /prestataire.
  [/^\/pro(\/.*)?$/, (m, q) => near(`/prestataire${m[1] ?? ''}${q}`)],
];

/** Where an API path lands in this app, for the side the user is on. */
export function resolveChemin(chemin: string, side: Role): Resolved {
  const url = new URL(chemin, 'https://app.invalid');
  const path = url.pathname.replace(/\/+$/, '') || '/';
  for (const [pattern, to] of RULES) {
    const m = pattern.exec(path);
    if (m) return to(m, url.search, side);
  }
  // Already one of this app's paths, or one it does not know: the side's home then.
  if (/^\/(client|prestataire)(\/|$)/.test(path)) return near(path + url.search);
  return near(side === 'prestataire' ? '/prestataire' : '/client');
}

export const appPath = (chemin: string, side: Role): string => resolveChemin(chemin, side).path;

/**
 * Where a tap on an alert leads, in the API's paths — null when the row only
 * informs. The handicap alerts name no screen (`ecran: aucun`): theirs is
 * « Mes demandes » of the handicap sheet, which only the prestataire profile holds.
 */
export function cheminOf(a: Alerte): string | null {
  if (a.cible.chemin && a.cible.ecran !== 'aucun') return a.cible.chemin;
  if (a.code.startsWith('handicap.') && a.cible.app === 'prestataire') return '/pro/profil?handicap=demandes';
  return null;
}

/**
 * The alert is about the screen on display (common guide §7.1): same path,
 * query aside. A stand-in screen never counts — it is not what the alert is about.
 */
export function isOnScreen(chemin: string | null | undefined, side: Role): boolean {
  if (!chemin) return false;
  const { path, exact: isExact } = resolveChemin(chemin, side);
  if (!isExact) return false;
  const here = window.location.pathname.replace(/\/+$/, '') || '/';
  return path.split('?')[0] === here;
}
