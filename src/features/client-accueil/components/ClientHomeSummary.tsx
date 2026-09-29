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
    <section
      aria-label={L('Votre accueil', 'الصفحة الرئيسية')}
      className="mb-8 grid gap-4 lg:grid-cols-[306px_minmax(0,1fr)]"
    >
      <CompanyCard entreprise={data.entreprise} compteurs={data.compteurs} />

      {/* A container: beside the company card at lg this column is narrower than
          a phone, so what sits inside follows its width, not the viewport's. */}
      <div className="@container flex min-w-0 flex-col gap-4">
        {data.compteurs.facturesAApprouver > 0 && (
          <ApprovalCta count={data.compteurs.facturesAApprouver} amountDzd={data.depenses.aApprouverDzd} />
        )}
        <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
          <CreditsTile credits={data.credits} />
          <DepensesTile totalDzd={data.depenses.totalDzd} />
        </div>
        <RecentDemandes demandes={data.demandes} />
      </div>
    </section>
  );
}
