import type { Lien } from '../schemas/portefeuille';

/**
 * A `lien` of the answer → the app screen it opens. The `href` is an API path;
 * `ouvre` says which screen shows it:
 * - `demande`  → « Suivi d'une demande » (the id is the last segment of the href);
 * - `factures` → the « Factures » tab, keeping the href's query (`?statut=contestees`);
 * - `facture`  → that tab with the invoice open over it (the id is the last segment).
 */
export function routeForLien(lien: Lien): string | null {
  const href = lien.href ?? '';
  const url = new URL(href, 'https://api.local');
  switch (lien.ouvre) {
    case 'demande': {
      const id = url.pathname.split('/').filter(Boolean).at(-1);
      return id ? `/client/tender/${encodeURIComponent(id)}` : null;
    }
    case 'factures':
      return `/client/factures${url.search}`;
    case 'facture': {
      const id = /\/factures\/([^/]+)$/.exec(url.pathname)?.[1];
      return id ? `/client/factures?facture=${encodeURIComponent(id)}` : `/client/factures${url.search}`;
    }
    default:
      return null;
  }
}
