import {
  Briefcase,
  Calculator,
  ChartColumn,
  Construction,
  Globe,
  Laptop,
  LifeBuoy,
  type LucideIcon,
  Megaphone,
  Package,
  Scale,
  ShieldCheck,
  SprayCan,
  Truck,
  UtensilsCrossed,
  Users,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryClasses, type CategoryKey } from '@/lib/categoryColors';
import { baseGlyph } from '@/lib/categoryIcons3d';

/**
 * Catalogue families are seeded with an emoji glyph (see `@/lib/catalogue`).
 * On the tinted tiles we render a monochrome Lucide line icon instead — color
 * emoji ignore the ink text colour and clash with the soft category tint.
 * Keyed by the base emoji (variation selectors U+FE0E/U+FE0F stripped) so the
 * seed data and the inline emoji chips on the prestataire side stay unchanged.
 */
const ICON_BY_GLYPH: Record<string, LucideIcon> = {
  '\u{2696}': Scale, // ⚖ Services Juridiques & Légaux
  '\u{1F9EE}': Calculator, // 🧮 Comptabilité, Finance & Fiscalité
  '\u{1F465}': Users, // 👥 Ressources Humaines & Recrutement
  '\u{1F4BB}': Laptop, // 💻 Services Informatiques & Digitaux
  '\u{1F4E3}': Megaphone, // 📣 Marketing, Communication & Créatif
  '\u{1F9FC}': SprayCan, // 🧼 Nettoyage & Hygiène
  '\u{1F6E1}': ShieldCheck, // 🛡 Sécurité & Gardiennage
  '\u{1F69A}': Truck, // 🚚 Logistique, Transport & Supply Chain
  '\u{1F3D7}': Construction, // 🏗 BTP, Travaux & Aménagement
  '\u{1F527}': Wrench, // 🔧 Maintenance Industrielle & Technique
  '\u{1F4CA}': ChartColumn, // 📊 Conseil & Stratégie d'Entreprise
  '\u{1F4E6}': Package, // 📦 Fournitures & Équipements (Achat B2B)
  '\u{1F37D}': UtensilsCrossed, // 🍽 Restauration & Événementiel d'Entreprise
  '\u{1F6DF}': LifeBuoy, // 🛟 Assurance & Gestion des Risques
  '\u{1F30D}': Globe, // 🌍 Import-Export & Commerce International
  '\u{1F5C2}': Briefcase, // 🗂 Services Généraux & Support
};

/** A soft, category-tinted tile — used for family icons and category chips. */
export function CategoryIcon({
  colorKey,
  icon,
  className,
}: {
  colorKey: CategoryKey;
  icon: string;
  className?: string;
}) {
  const c = categoryClasses(colorKey);
  const Icon = ICON_BY_GLYPH[baseGlyph(icon)];
  return (
    <div
      className={cn(
        'flex size-11 items-center justify-center rounded-xl text-[20px] text-de9-ink',
        c.soft,
        className,
      )}
    >
      {Icon ? <Icon size="1em" aria-hidden /> : <span>{icon}</span>}
    </div>
  );
}

export function CategoryChip({
  colorKey,
  label,
  className,
}: {
  colorKey: CategoryKey;
  label: string;
  className?: string;
}) {
  const c = categoryClasses(colorKey);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold',
        c.soft,
        c.text,
        className,
      )}
    >
      <span className={cn('size-2 rounded-full', c.bg)} />
      {label}
    </span>
  );
}
