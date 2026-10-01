/**
 * The wallet's query keys, on their own so that what only needs to invalidate
 * them (the alerts hub) does not pull the wallet's code in.
 */

/**
 * Invalidate after anything that moves money (an invoice approved or
 * contested, a recharge credited): the card and the rows change. Never polled.
 */
export const portefeuilleKey = ['client', 'portefeuille'] as const;

/**
 * Online payments — kept apart from `portefeuilleKey` on purpose: resetting
 * the wallet after a credit must not fire `/verification` again.
 */
export const paiementsKey = ['client', 'paiements-en-ligne'] as const;
export const paiementKey = (id: string) => [...paiementsKey, id] as const;
export const paiementsListeKey = [...paiementsKey, 'liste'] as const;
