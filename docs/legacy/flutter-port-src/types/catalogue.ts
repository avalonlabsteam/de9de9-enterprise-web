/** Bilingual string (French primary, Arabic). Mirrors the Flutter LocalizedText. */
export interface LocalizedText {
  fr: string
  ar: string
}

/** The four-way service-family colour coding (NOIR / BLEU / VERT / ROUGE). */
export type CategoryColorKey = 'noir' | 'bleu' | 'vert' | 'rouge'

/** A single sub-service within a family. */
export interface ServiceSub {
  id: string
  name: LocalizedText
}

/** A top-level service family in the catalogue. */
export interface ServiceFamily {
  id: number
  colorKey: CategoryColorKey
  icon: string
  name: LocalizedText
  subs: ServiceSub[]
}

export type AppRole = 'cliente' | 'prestataire'
