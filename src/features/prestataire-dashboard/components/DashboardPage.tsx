import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  UsersRound,
  Wallet,
  CalendarClock,
  History,
  Loader,
  CheckCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { useT, useL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useDashboard } from "../api/dashboard";
import { CreatePickSheet } from "./CreatePickSheet";

const formatDa = (n: number) => n.toLocaleString("fr-FR");

/** Deg Deg dashboard: company card left, KPIs + recent activity right. */
export function DashboardPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const [pickOpen, setPickOpen] = useState(false);
  const { data, isPending, isError } = useDashboard();

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      {isError && (
        <EmptyState
          title={L(
            "Impossible de charger le tableau de bord",
            "تعذّر تحميل لوحة القيادة",
          )}
          description={L(
            "Veuillez réessayer plus tard.",
            "يرجى المحاولة لاحقًا.",
          )}
        />
      )}

      {isPending && !isError && <DashboardSkeleton />}

      {data && (
        <>
          <div className="grid gap-4 lg:grid-cols-[306px_minmax(0,1fr)]">
            {/* Company card — logo, name, stat trio */}
            <Card>
              <CardContent className="flex flex-col items-center px-5 py-7 text-center">
                <span className="grid size-[100px] flex-none place-items-center rounded-full bg-de9-blue text-[28px] font-extrabold text-white">
                  {data.entreprise.slice(0, 2).toUpperCase()}
                </span>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="truncate text-[26px] font-bold text-de9-ink">
                    {data.entreprise}
                  </span>
                  {data.verified && (
                    <BadgeCheck className="size-5 flex-none text-de9-teal" />
                  )}
                </div>
                <p className="text-sm font-medium text-de9-gray">
                  {data.verified
                    ? L("Entreprise vérifiée", "مؤسسة موثّقة")
                    : L("Non vérifiée", "غير موثّقة")}
                </p>

                <div className="mt-6 flex w-full justify-between px-1">
                  <CompanyStat
                    value={data.stats.avenir}
                    label={t("statAvenir")}
                    circle="bg-de9-blue-soft"
                    icon={<CalendarClock className="size-5" />}
                  />
                  <CompanyStat
                    value={data.stats.enCours}
                    label={t("statEnCours")}
                    circle="bg-de9-orange"
                    icon={<Loader className="size-5" />}
                  />
                  <CompanyStat
                    value={data.stats.completes}
                    label={t("statComplete")}
                    circle="bg-de9-teal"
                    icon={<CheckCheck className="size-5" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right column — KPI pair + activity */}
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  label={t("chiffreAffaire")}
                  icon={<Wallet className="size-5" />}
                  onClick={() => navigate("/prestataire/stats")}
                >
                  <p className="mt-3 text-2xl font-bold text-de9-ink">
                    {formatDa(data.chiffreAffaireDa)} DA
                  </p>
                </KpiCard>
                <KpiCard
                  label={t("monEquipe")}
                  icon={<UsersRound className="size-5" />}
                  onClick={() => navigate("/prestataire/effectif")}
                >
                  <p className="mt-3 text-2xl font-bold text-de9-ink">
                    {data.equipe.used}/{data.equipe.total}
                  </p>
                  <span className="mt-3 block h-2.5 w-full overflow-hidden rounded-sm bg-background">
                    <span
                      className="block h-full rounded-sm bg-de9-teal transition-[width]"
                      style={{
                        width: `${Math.min(100, Math.round((data.equipe.used / Math.max(1, data.equipe.total)) * 100))}%`,
                      }}
                    />
                  </span>
                </KpiCard>
              </div>

              <Card className="flex-1">
                <CardContent className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-bold text-de9-ink">
                      {L("Activité récente", "النشاط الأخير")}
                    </h2>
                    <History className="size-5 text-de9-teal" />
                  </div>
                  <ul className="mt-2">
                    {(data.activite ?? []).map((a, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 py-1.5 text-sm font-medium text-de9-ink"
                      >
                        <span className="truncate">{a.title}</span>
                        <time className="flex-none text-[10px] text-de9-gray">
                          {a.time}
                        </time>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Create annonce */}
          {/* <Button
            className="h-11 w-full gap-2 text-[14px] shadow-glow"
            onClick={() => setPickOpen(true)}
          >
            <Plus className="size-4" />
            {t('createAnnonce')}
          </Button> */}
        </>
      )}

      <CreatePickSheet open={pickOpen} onOpenChange={setPickOpen} />
    </div>
  );
}

function CompanyStat({
  value,
  label,
  circle,
  icon,
}: {
  value: number;
  label: string;
  circle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex w-[84px] flex-col items-center gap-1.5">
      <span
        className={cn(
          "grid size-10 place-items-center rounded-full text-white",
          circle,
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-de9-ink">{label}</span>
      <span className="text-[30px] font-bold leading-tight text-de9-ink">
        {value}
      </span>
    </div>
  );
}

function KpiCard({
  label,
  icon,
  onClick,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-card px-6 py-5 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-de9-ink">{label}</span>
        <span className="flex-none text-de9-teal">{icon}</span>
      </span>
      {children}
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid animate-pulse items-start gap-4 lg:grid-cols-[306px_minmax(0,1fr)]">
      <div className="h-[318px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-[109px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
          <div className="h-[109px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
        </div>
        <div className="h-[180px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
      </div>
    </div>
  );
}
