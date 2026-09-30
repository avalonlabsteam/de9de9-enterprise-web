import type { ToneTag } from '@/lib/actions/schema';

/**
 * A visit's code (`V0`…`V7`, `V5.C`, `VX`) as the prestataire sees it — the
 * same labels and tones as the visit pill of « B2B · Entreprises » (guide 12 §1.2).
 */
const STATUT: Record<string, { fr: string; ar: string; ton: string }> = {
  V0: { fr: 'À planifier', ar: 'للتخطيط', ton: 'neutre' },
  V1: { fr: 'À venir', ar: 'قادمة', ton: 'neutre' },
  V2: { fr: 'Confirmée', ar: 'مؤكدة', ton: 'valide' },
  V3: { fr: 'Ouvrier affecté', ar: 'تم تعيين عامل', ton: 'info' },
  V4: { fr: 'Réalisée', ar: 'منجزة', ton: 'succes' },
  V5: { fr: "En attente d'approbation", ar: 'في انتظار الموافقة', ton: 'attention' },
  'V5.C': { fr: 'Facture contestée', ar: 'فاتورة متنازع عليها', ton: 'danger' },
  V6: { fr: 'Approuvée', ar: 'موافق عليها', ton: 'succes' },
  V7: { fr: 'Terminée', ar: 'منتهية', ton: 'neutre' },
  VX: { fr: 'Annulée', ar: 'ملغاة', ton: 'neutre' },
};

/** The pill for a visit code; an unknown code prints as is, in grey. */
export function visiteTag(code: string | null | undefined, L: (fr: string, ar: string) => string): ToneTag | null {
  if (!code) return null;
  const s = STATUT[code];
  return s ? { code, label: L(s.fr, s.ar), ton: s.ton } : { code, label: code, ton: 'neutre' };
}
