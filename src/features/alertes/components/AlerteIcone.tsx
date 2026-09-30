import {
  Accessibility,
  Banknote,
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  FileSignature,
  FileText,
  Receipt,
  ShieldCheck,
  Smartphone,
  Star,
  Users,
  Wallet,
} from 'lucide-react';

/**
 * The glyph of an alert's `icone` token (common guide §1.4). A static switch,
 * like `ApiIcon`; an unknown token draws the bell.
 */
export function AlerteIcone({ icone, className }: { icone: string; className?: string }) {
  switch (icone) {
    case 'demande':
      return <FileText className={className} />;
    case 'devis':
      return <FileSignature className={className} />;
    case 'commande':
      return <Briefcase className={className} />;
    case 'visite':
      return <CalendarCheck className={className} />;
    case 'facture':
      return <Receipt className={className} />;
    case 'paiement':
      return <Banknote className={className} />;
    case 'portefeuille':
      return <Wallet className={className} />;
    case 'kyc':
      return <ShieldCheck className={className} />;
    case 'compte':
      return <Building2 className={className} />;
    case 'equipe':
      return <Users className={className} />;
    case 'b2c':
      return <Smartphone className={className} />;
    case 'avis':
      return <Star className={className} />;
    case 'handicap':
      return <Accessibility className={className} />;
    default:
      return <Bell className={className} />;
  }
}
