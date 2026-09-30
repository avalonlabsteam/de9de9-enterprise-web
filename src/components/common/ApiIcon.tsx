import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  FileSignature,
  FileText,
  Headset,
  Hourglass,
  Landmark,
  Lock,
  LockOpen,
  MapPin,
  NotebookPen,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Star,
  TriangleAlert,
  UsersRound,
} from 'lucide-react';

/**
 * The glyph for an icon code of an API answer (`coche` ✓, `cadenas` 🔒,
 * `fleche_haut` ↑…) — the app draws it. A static switch, not a looked-up
 * component, so nothing is created during render. Unknown codes draw nothing.
 */
export function ApiIcon({ code, className }: { code?: string | null; className?: string }) {
  switch (code) {
    case 'coche':
      return <Check className={className} />;
    case 'cadenas':
      return <Lock className={className} />;
    case 'cadenas_ouvert':
      return <LockOpen className={className} />;
    case 'fleche_bas':
      return <ArrowDown className={className} />;
    case 'fleche_haut':
      return <ArrowUp className={className} />;
    case 'sablier':
      return <Hourglass className={className} />;
    case 'calendrier':
      return <CalendarDays className={className} />;
    case 'facture':
      return <FileText className={className} />;
    case 'etoile':
      return <Star className={className} />;
    case 'recurrence':
      return <RefreshCw className={className} />;
    case 'alerte':
      return <TriangleAlert className={className} />;
    case 'plus':
      return <Plus className={className} />;
    case 'banque':
      return <Landmark className={className} />;
    case 'equipe':
      return <UsersRound className={className} />;
    case 'support':
      return <Headset className={className} />;
    case 'telephone':
      return <Phone className={className} />;
    case 'adresse':
      return <MapPin className={className} />;
    case 'note':
      return <NotebookPen className={className} />;
    case 'devis':
      return <FileSignature className={className} />;
    case 'piece_jointe':
      return <Paperclip className={className} />;
    default:
      return null;
  }
}
