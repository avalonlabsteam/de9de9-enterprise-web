import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Lock, ServerCrash, ShieldCheck } from 'lucide-react';
import { useT, useL } from '@/lib/i18n';
import { uiActions } from '@/stores/uiStore';
import { useB2cSessionStore, type B2cRefusal } from '@/stores/b2cSessionStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { usePrestataireAccueil } from '@/features/prestataire-dashboard/api/dashboard';
import { refreshAccueil, useAccesB2c, useAccesConnu } from '@/features/auth/api/accueil';
import { useKycState } from '@/features/kyc/api/kyc';
import { useTabCounts } from '../api/b2c';
import { useB2cLive } from '../api/hub';
import { ensureB2cSession, retryB2cSession } from '../api/session';
import { HistoriqueTab, RecuesTab } from './BookingsTabs';
import { ExplorerTab } from './ExplorerTab';
import { JobFlowProvider } from './JobFlowProvider';
import { CardSkeletons } from './parts';

const ONGLETS = ['recues', 'explorer', 'confirmes', 'historique'] as const;
type Onglet = (typeof ONGLETS)[number];

function Count({ value }: { value: number | null | undefined }) {
  if (!value) return null;
  return (
    <span className="ms-1.5 min-w-5 rounded-full bg-de9-teal-soft px-1.5 text-center text-[11px] font-bold text-de9-teal-dark tabular-nums">
      {value > 99 ? '99+' : value}
    </span>
  );
}

function Suspended() {
  const L = useL();
  return (
    <EmptyState
      icon={<Lock className="size-6" />}
      title={L("Votre activité sur l'app de9de9 est suspendue", 'تم تعليق نشاطك على تطبيق de9de9')}
      description={L('Contactez le support pour en savoir plus.', 'اتصل بالدعم لمعرفة المزيد.')}
      action={
        <Button variant="outline" size="sm" onClick={uiActions.openSupport}>
          {L('Contacter le support', 'اتصل بالدعم')}
        </Button>
      }
    />
  );
}

/**
 * The exchange refused (guide 16 §2.2). Each refusal has its own screen; the
 * server's French `detail` is printed when it carries one. Never a generic
 * « Une erreur est survenue » for something the user can understand or fix.
 */
function Refusal({ refusal }: { refusal: B2cRefusal }) {
  const L = useL();
  const navigate = useNavigate();
  const retry = (
    <Button variant="outline" size="sm" onClick={retryB2cSession}>
      {L('Réessayer', 'إعادة المحاولة')}
    </Button>
  );

  switch (refusal.kind) {
    case 'suspended':
      return <Suspended />;
    case 'kyc':
      return (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title={L('Vérification de votre entreprise requise', 'يلزم توثيق مؤسستك')}
          description={
            refusal.detail ??
            L('Le B2C s’ouvre une fois le dossier KYC (RC, NIF, NIS) vérifié par de9de9.', 'يُفتح B2C بعد توثيق ملف KYC من طرف de9de9.')
          }
          action={
            <Button size="sm" onClick={() => navigate('/onboarding/kyc')}>
              {L('Terminer la vérification', 'إكمال التوثيق')}
            </Button>
          }
        />
      );
    case 'not_ready':
      return (
        <EmptyState
          icon={<Clock className="size-6" />}
          title={L('Compte de9de9 en préparation', 'حساب de9de9 قيد التحضير')}
          description={
            refusal.detail ??
            L("Le compte de9de9 de l'entreprise n'est pas encore prêt : réessayez dans quelques minutes.", 'حساب de9de9 للمؤسسة غير جاهز بعد: أعد المحاولة بعد دقائق.')
          }
          action={retry}
        />
      );
    case 'unavailable':
      return (
        <EmptyState
          icon={<ServerCrash className="size-6" />}
          title={L('Service indisponible', 'الخدمة غير متاحة')}
          description={
            refusal.detail ??
            L("L'application de9de9 est momentanément indisponible : réessayez plus tard.", 'تطبيق de9de9 غير متاح مؤقتًا: أعد المحاولة لاحقًا.')
          }
          action={retry}
        />
      );
    case 'forbidden':
    case 'side':
      // Not an active seat, an inactive company, or no prestataire side: nothing to retry.
      return (
        <EmptyState
          icon={<Lock className="size-6" />}
          title={L('B2C indisponible pour ce compte', 'B2C غير متاح لهذا الحساب')}
          description={refusal.detail}
        />
      );
    default:
      return (
        <EmptyState
          title={L('Impossible d’ouvrir la session de9de9', 'تعذّر فتح جلسة de9de9')}
          description={refusal.detail ?? L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.')}
          action={retry}
        />
      );
  }
}

/**
 * The tabs, once the de9de9 session is open: one exchange on entry, shared by
 * everything below. A refusal — at entry or later, when a de9de9 401 forces a
 * new exchange — takes the tabs' place.
 */
function Workspace() {
  const t = useT();
  const L = useL();
  const session = useB2cSessionStore((s) => s.session);
  const refusal = useB2cSessionStore((s) => s.refusal);
  const [params, setParams] = useSearchParams();
  const param = params.get('onglet');
  const onglet: Onglet = ONGLETS.find((o) => o === param) ?? 'recues';
  const setOnglet = (next: string) => setParams(next === 'recues' ? {} : { onglet: next }, { replace: true });

  // Opened once: a token dropped later is traded again by the next call, the tabs stay.
  const [opened, setOpened] = useState(false);
  if (session && !opened) setOpened(true);
  useEffect(() => {
    if (!session && !refusal) ensureB2cSession().catch(() => undefined);
  }, [session, refusal]);

  const ready = opened && !refusal;
  const counts = useTabCounts(ready).data;
  useB2cLive();

  if (refusal) return <Refusal refusal={refusal} />;
  if (!opened) return <CardSkeletons />;

  return (
    <JobFlowProvider onGoConfirmes={() => setOnglet('confirmes')}>
      <Tabs value={onglet} onValueChange={setOnglet}>
        <TabsList className="mb-4 h-auto flex-wrap">
          <TabsTrigger value="recues">
            {t('recues')}
            <Count value={counts?.recues} />
          </TabsTrigger>
          <TabsTrigger value="explorer">{t('explorer')}</TabsTrigger>
          <TabsTrigger value="confirmes">
            {t('confirmes')}
            <Count value={counts?.confirmes} />
          </TabsTrigger>
          <TabsTrigger value="historique">{L('Historique', 'السجل')}</TabsTrigger>
        </TabsList>

        <TabsContent value="recues">
          <RecuesTab />
        </TabsContent>
        <TabsContent value="explorer">
          <ExplorerTab pending={counts?.offres ?? null} />
        </TabsContent>
        <TabsContent value="confirmes">
          <HistoriqueTab view="confirmes" />
        </TabsContent>
        <TabsContent value="historique">
          <HistoriqueTab view="historique" />
        </TabsContent>
      </Tabs>
    </JobFlowProvider>
  );
}

/**
 * « B2C · Particuliers » — the company working in the de9de9 app as a normal
 * pro (guide 16). The home's `b2c.statut` says what the exchange would answer,
 * without a call: suspended and pending companies stop here.
 */
export function B2cPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const kyc = useKycState();
  usePrestataireAccueil(); // the home, fresh: its access block decides what this page may do
  const statut = useAccesB2c();
  const connu = useAccesConnu();
  // An older API sends no access block: its home may be out of date, and the exchange itself has the last word.
  const [bypass, setBypass] = useState(false);
  const [checking, setChecking] = useState(false);

  const verifier = async () => {
    if (!connu) {
      setBypass(true);
      return;
    }
    setChecking(true);
    await refreshAccueil();
    setChecking(false);
  };

  let body: ReactNode;
  if (statut === 'non_autorise') {
    // Reached by a saved link only — the menu is hidden. Nothing to retry: de9de9 grants the access.
    body = (
      <EmptyState
        icon={<Lock className="size-6" />}
        title={L("L'accès B2C n'est pas ouvert pour votre entreprise", 'خدمة B2C غير مفتوحة لمؤسستك')}
        description={L(
          "Il est accordé par l'administration de9de9. Contactez de9de9 pour le demander.",
          'تمنحها إدارة de9de9. اتصل بـ de9de9 لطلبها.',
        )}
        action={
          <Button variant="outline" size="sm" onClick={uiActions.openSupport}>
            {L('Contacter de9de9', 'اتصل بـ de9de9')}
          </Button>
        }
      />
    );
  } else if (statut === 'suspendu' && !bypass) body = <Suspended />;
  else if (statut === 'en_attente' && !bypass) {
    body = (
      <EmptyState
        icon={<Clock className="size-6" />}
        title={L('Visible sur l’app de9de9 après vérification', 'ستظهر على تطبيق de9de9 بعد التوثيق')}
        description={L(
          "Votre compte de9de9 est créé une fois votre entreprise vérifiée. Les commandes et les demandes des particuliers s'afficheront ici.",
          'يُنشأ حسابك على de9de9 بعد توثيق مؤسستك. ستظهر هنا طلبات وحجوزات الأفراد.',
        )}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {!kyc.verified && (
              <Button size="sm" onClick={() => navigate('/onboarding/kyc')}>
                {L('Terminer la vérification', 'إكمال التوثيق')}
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={checking} onClick={() => void verifier()}>
              {L('Vérifier à nouveau', 'تحقق مجددًا')}
            </Button>
          </div>
        }
      />
    );
  } else body = <Workspace />;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-5">
        <h1 className="text-[22px] font-black text-de9-ink">{t('b2cTitle')}</h1>
        <p className="mt-1 text-[14px] text-de9-gray">
          {L('Clients particuliers — votre activité sur l’app de9de9', 'العملاء الأفراد — نشاطك على تطبيق de9de9')}
        </p>
      </header>
      {body}
    </div>
  );
}
