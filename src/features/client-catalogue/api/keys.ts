/**
 * The catalogue's query key, on its own so that what only needs to invalidate
 * it (the alerts hub) does not pull the catalogue's code in.
 */

/**
 * « Nouvelle demande » — the grid, the pickers and the company's B2B access
 * with its sentence (`blocage`). Invalidate when de9de9 suspends or restores
 * that access: the answer is otherwise held for minutes.
 */
export const nouvelleDemandeKey = ['client', 'nouvelle-demande'] as const;
