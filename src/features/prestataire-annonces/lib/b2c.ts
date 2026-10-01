import type { CorpsB2c, LigneB2c } from '../api/annonces';
import type { AnnonceB2c, CategorieB2c } from '../schemas/annonces';

/**
 * What the B2C wizard holds while it is filled, and how it becomes the body of
 * `PUT /prestataire/annonces/b2c/{id}` (guide 19a §5). Kept out of the screens
 * so the rules can be read — and checked — on their own.
 */

/** The steps after the category is chosen — also the codes a refusal names (`etapes[].code`). */
export const ETAPES = ['services', 'tarifs', 'questionnaire', 'disponibilite', 'zones', 'description', 'photos'] as const;
export type Etape = (typeof ETAPES)[number];
export const isEtape = (code: string): code is Etape => (ETAPES as readonly string[]).includes(code);

// -------------------------------------------------------------------- lines

/** One line of the annonce: a task (or a service without task) of the app, or a free label. */
export interface Ligne {
  key: string;
  serviceId: number | null;
  tacheId: number | null;
  /** Set on a free line: its label, typed by the pro. */
  libre: string | null;
  /** What the annonce called it — the label kept when the app's tree cannot be read. */
  libelle: string;
  /** As typed: whole DZD. */
  prix: string;
  /** null = the annonce's default unit. */
  unite: number | null;
}

export const cleReelle = (serviceId: number, tacheId: number | null) => `r:${serviceId}:${tacheId ?? ''}`;

let libres = 0;
export const ligneLibre = (libelle = ''): Ligne => ({
  key: `l:${++libres}`,
  serviceId: null,
  tacheId: null,
  libre: libelle,
  libelle,
  prix: '',
  unite: null,
});

export function lignesOf(annonce: AnnonceB2c): Ligne[] {
  return annonce.lignes.map((l) => {
    // A draft line without a price yet is stored as 0: the input shows it empty.
    const prix = l.prixDzd ? String(l.prixDzd) : '';
    // The answer names a unit on every line: it is the line's OWN only when it differs from the annonce's.
    const propre = l.uniteDifferente || (l.unite != null && annonce.uniteDefaut != null && l.unite !== annonce.uniteDefaut);
    const unite = propre ? (l.unite ?? null) : null;
    if (l.estLibre || l.legacyCategoryServiceId == null) return { ...ligneLibre(l.libelle), prix, unite };
    return {
      key: cleReelle(l.legacyCategoryServiceId, l.legacyServiceTaskId ?? null),
      serviceId: l.legacyCategoryServiceId,
      tacheId: l.legacyServiceTaskId ?? null,
      libre: null,
      libelle: l.libelle,
      prix,
      unite,
    };
  });
}

/** Every line the category offers, in the app's order: a task, or a service that has none. */
export function lignesPossibles(categorie: CategorieB2c): { key: string; serviceId: number; tacheId: number | null }[] {
  return categorie.services.flatMap((s) => {
    const taches: (number | null)[] = s.taches.length > 0 ? s.taches.map((t) => t.id) : [null];
    return taches.map((tacheId) => ({ key: cleReelle(s.id, tacheId), serviceId: s.id, tacheId }));
  });
}

/**
 * The lines in display order: the app's own order for the real ones (as far as
 * its tree is known), then the free ones as they were typed.
 */
export function ordonner(lignes: Ligne[], categorie: CategorieB2c | undefined): Ligne[] {
  const rang = new Map((categorie ? lignesPossibles(categorie) : []).map((l, i) => [l.key, i]));
  const reelles = lignes.filter((l) => l.libre === null);
  const position = (l: Ligne) => rang.get(l.key) ?? Number.MAX_SAFE_INTEGER;
  return [
    // A stable sort: lines the tree no longer knows stay last, in their order.
    ...reelles.map((l, i) => ({ l, i })).sort((a, b) => position(a.l) - position(b.l) || a.i - b.i).map((x) => x.l),
    ...lignes.filter((l) => l.libre !== null),
  ];
}

/** Whole DZD, as typed: null when empty, NaN when it is not a number. */
export function montant(raw: string): number | null {
  const text = raw.trim().replace(/\s/g, '');
  if (text === '') return null;
  return /^\d+$/.test(text) ? Number(text) : Number.NaN;
}

// ------------------------------------------------------------- availability

/** Whole hours: `debut` 0..23, `fin` 1..24 — 24 is the day's last minute, « 23:59 ». */
export interface Plage {
  debut: number;
  fin: number;
}
/** Seven days, index 0 = dimanche … 6 = samedi; an empty day is not available. */
export type Semaine = Plage[][];

export const JOURNEE: Plage = { debut: 0, fin: 24 };
export const PLAGE_DEFAUT: Plage = { debut: 8, fin: 18 };

export const heure = (h: number) => (h >= 24 ? '23:59' : `${String(h).padStart(2, '0')}:00`);

function heureOf(texte: string, fin: boolean): number {
  const [h = '0', m = '0'] = texte.split(':');
  const heures = Number(h) || 0;
  // « 23:59 » closes the day; any other end is read at its hour.
  return fin && heures === 23 && Number(m) > 0 ? 24 : Math.min(Math.max(heures, 0), fin ? 24 : 23);
}

export function semaineOf(annonce: AnnonceB2c): Semaine {
  const semaine: Semaine = [[], [], [], [], [], [], []];
  for (const d of annonce.disponibilites) {
    semaine[d.jour]?.push({ debut: heureOf(d.debut, false), fin: heureOf(d.fin, true) });
  }
  return semaine.map((jour) => [...jour].sort((a, b) => a.debut - b.debut));
}

/** A day's ranges the app would refuse: an end not after its start, or two that overlap. */
export function plagesInvalides(plages: Plage[]): boolean {
  if (plages.some((p) => p.fin <= p.debut)) return true;
  const tri = [...plages].sort((a, b) => a.debut - b.debut);
  return tri.some((p, i) => i > 0 && p.debut < (tri[i - 1]?.fin ?? 0));
}

export const memesPlages = (a: Plage[], b: Plage[]) =>
  a.length === b.length && a.every((p, i) => p.debut === b[i]?.debut && p.fin === b[i]?.fin);

// ---------------------------------------------------------------- questions

/** The questions on screen: the category's own, and those of a ticked task (the app's own rule). */
export function questionsVisibles(categorie: CategorieB2c | undefined, lignes: Ligne[]): CategorieB2c['questions'] {
  if (!categorie) return [];
  const taches = new Set(lignes.map((l) => l.tacheId).filter((id) => id != null));
  return categorie.questions.filter((q) => q.tacheId == null || taches.has(q.tacheId));
}

// ------------------------------------------------------------------ the body

export interface Contenu {
  lignes: Ligne[];
  uniteDefaut: number | null;
  /** As typed: 0..100. */
  remise: string;
  reponseIds: string[];
  semaine: Semaine;
  description: string;
}

/**
 * The full replacement body. A free line left blank is dropped; an answer whose
 * question is no longer on screen is dropped too — the server applies the same
 * rule. A price not typed yet travels as 0: a draft accepts it, « Publier » does not.
 */
export function corpsB2c(contenu: Contenu, categorie: CategorieB2c | undefined): CorpsB2c {
  const lignes = ordonner(contenu.lignes, categorie)
    .filter((l) => l.libre === null || l.libre.trim() !== '')
    .map((l): LigneB2c => {
      const prixDzd = montant(l.prix) || 0;
      return l.libre !== null
        ? { libelleLibre: l.libre.trim(), prixDzd, unite: l.unite }
        : { legacyCategoryServiceId: l.serviceId, legacyServiceTaskId: l.tacheId, prixDzd, unite: l.unite };
    });
  const admises = categorie
    ? new Set(questionsVisibles(categorie, contenu.lignes).flatMap((q) => q.reponses.map((r) => r.id)))
    : null;
  return {
    uniteDefaut: contenu.uniteDefaut,
    remise: montant(contenu.remise) || 0,
    lignes,
    reponseIds: admises ? contenu.reponseIds.filter((id) => admises.has(id)) : contenu.reponseIds,
    disponibilites: contenu.semaine.flatMap((plages, jour) =>
      [...plages].sort((a, b) => a.debut - b.debut).map((p) => ({ jour, debut: heure(p.debut), fin: heure(p.fin) })),
    ),
    description: contenu.description.trim() || null,
  };
}

// -------------------------------------------------------------------- rules

type L = (fr: string, ar: string) => string;

export interface Limites {
  lignesMax: number;
  lignesLibresMax: number;
  descriptionMin: number;
  plagesParJourMax: number;
}

/**
 * The rules the backend repeats. A draft accepts partial content: only what
 * could not be stored at all is refused. `complet`: those of « Publier » — and
 * of every save of an annonce already online. `zones`: how many the company
 * has, when known.
 */
export function verifierB2c(
  contenu: Contenu,
  limites: Limites,
  complet: boolean,
  zones: number | null,
  L: L,
): Partial<Record<Etape, string>> {
  const e: Partial<Record<Etape, string>> = {};
  const lignes = contenu.lignes.filter((l) => l.libre === null || l.libre.trim() !== '');
  const reelles = lignes.filter((l) => l.libre === null);

  if (lignes.length > limites.lignesMax) {
    e.services = L(`Une annonce compte ${limites.lignesMax} lignes au plus.`, `الإعلان يضم ${limites.lignesMax} سطرًا كحد أقصى.`);
  } else if (complet && reelles.length === 0) {
    e.services = L('Choisissez au moins un service de la liste.', 'اختر خدمة واحدة على الأقل من القائمة.');
  }

  const prix = lignes.map((l) => montant(l.prix));
  const remise = montant(contenu.remise);
  if (prix.some((p) => Number.isNaN(p))) {
    e.tarifs = L('Les prix sont des montants entiers, en DZD.', 'الأسعار مبالغ صحيحة بالدينار.');
  } else if (remise !== null && (Number.isNaN(remise) || remise > 100)) {
    e.tarifs = L('La remise est un pourcentage entre 0 et 100.', 'التخفيض نسبة بين 0 و100.');
  } else if (complet && lignes.length > 0) {
    if (prix.some((p) => !p)) e.tarifs = L('Indiquez un prix supérieur à 0 pour chaque service.', 'أدخل سعرًا أكبر من 0 لكل خدمة.');
    else if (contenu.uniteDefaut === null) e.tarifs = L("Choisissez l'unité de vos tarifs.", 'اختر وحدة أسعارك.');
  }

  if (contenu.semaine.some((plages) => plages.length > limites.plagesParJourMax)) {
    e.disponibilite = L(`${limites.plagesParJourMax} plages au plus par jour.`, `${limites.plagesParJourMax} فترات كحد أقصى في اليوم.`);
  } else if (contenu.semaine.some(plagesInvalides)) {
    e.disponibilite = L(
      "Les plages d'un même jour ne se chevauchent pas, et finissent après leur début.",
      'فترات اليوم الواحد لا تتداخل، وتنتهي بعد بدايتها.',
    );
  } else if (complet && contenu.semaine.every((plages) => plages.length === 0)) {
    e.disponibilite = L('Indiquez au moins une plage de disponibilité.', 'حدّد فترة توفر واحدة على الأقل.');
  }

  if (complet && zones === 0) e.zones = L("Ajoutez au moins une zone d'intervention.", 'أضف منطقة تدخل واحدة على الأقل.');

  if (complet && contenu.description.trim().length < limites.descriptionMin) {
    e.description = L(
      `Décrivez vos services en ${limites.descriptionMin} caractères au moins.`,
      `صف خدماتك في ${limites.descriptionMin} حرفًا على الأقل.`,
    );
  }
  return e;
}

/** A `field` of a 400 → the step that shows its sentence. */
export function etapeOfField(field: string | undefined): Etape | undefined {
  const racine = field?.split(/[.[]/)[0];
  switch (racine) {
    case 'lignes':
      return field?.includes('prixDzd') || field?.includes('unite') ? 'tarifs' : 'services';
    case 'uniteDefaut':
    case 'remise':
      return 'tarifs';
    case 'reponseIds':
      return 'questionnaire';
    case 'disponibilites':
      return 'disponibilite';
    case 'zones':
      return 'zones';
    case 'description':
      return 'description';
    default:
      return undefined;
  }
}
