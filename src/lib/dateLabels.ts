/**
 * Localized month and weekday labels for calendar views (FR / AR).
 *
 * Arabic uses the Algerian (Maghrebi) month names — French-derived
 * (جانفي، فيفري…), not the Levantine/MSA set (يناير، فبراير…). Arabic weekday
 * names are shared across dialects, so those stay standard.
 *
 * Indexed by `Date` accessors: `MONTHS_*[date.getMonth()]` (0 = January) and
 * `WEEKDAYS_*[date.getDay()]` (0 = Sunday). Pair with `useL()` to pick the
 * active locale, e.g. `L(MONTHS_FR[m] ?? '', MONTHS_AR[m] ?? '')`.
 */

export const MONTHS_FR: readonly string[] = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export const MONTHS_AR: readonly string[] = [
  "جانفي",
  "فيفري",
  "مارس",
  "أفريل",
  "ماي",
  "جوان",
  "جويلية",
  "أوت",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const WEEKDAYS_FR: readonly string[] = [
  "DIM",
  "LUN",
  "MAR",
  "MER",
  "JEU",
  "VEN",
  "SAM",
];

export const WEEKDAYS_AR: readonly string[] = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
