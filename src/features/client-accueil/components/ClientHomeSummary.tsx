import { useL } from '@/lib/i18n';
import { useAccueilStore } from '@/stores/accueilStore';
import { CompanyCard } from './CompanyCard';
import { ApprovalCta, CreditsTile, DepensesTile } from './MoneyTiles';
import { RecentDemandes } from './RecentDemandes';

/**
 * The client home, above the catalogue. The backend builds it and delivers it
 * with the sign-in / switch answer; the store holds it. There is no home route
 * to fetch, so without one this renders nothing and the catalogue stands alone.
 */
export function ClientHomeSummary() {
  const L = useL();
  const data = useAccueilStore((s) => (s.accueil?.role === 'client' ? s.accueil.client : null));
  if (!data) return null;

  return (
    // Full-width rows, each only as tall as what it holds: no column waits on a taller neighbour.
    // A container: beside the sidebar this column can be narrower than a tablet, so what sits
    // inside follows its width, not the viewport's.
    <section aria-label={L('Votre accueil', 'الصفحة الرئيسية')} className="@container mb-8 flex flex-col gap-4">
      <CompanyCard entreprise={data.entreprise} compteurs={data.compteurs} />
      {data.compteurs.facturesAApprouver > 0 && (
        <ApprovalCta count={data.compteurs.facturesAApprouver} amountDzd={data.depenses.aApprouverDzd} />
      )}
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
        <CreditsTile credits={data.credits} />
        <DepensesTile totalDzd={data.depenses.totalDzd} />
      </div>
      <RecentDemandes demandes={data.demandes} />
    </section>
  );
}
