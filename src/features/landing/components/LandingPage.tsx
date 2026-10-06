import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Mail, BarChart3, UsersRound, Star, TrendingUp, Zap } from "lucide-react";
import { useL } from "@/lib/i18n";
import { useAuthStore } from "@/stores/authStore";
import { LandingHeader } from "./LandingHeader";
import { SiteFooter } from "./SiteFooter";
import { AppleIcon, GooglePlayIcon } from "./BrandIcons";
import {
  APP_DOWNLOAD_URL,
  STORE_URLS,
  VISIBILITE_IMG,
  APP_PHONE_IMG,
} from "../constants";

/** Team members shown in the floating cards beside the phone. */
const SHOWCASE = [
  {
    name: "Said Gherbi",
    color: "#D4711F",
    bars: [5, 8, 12, 7, 10, 22, 13, 9, 15, 7, 11],
  },
  {
    name: "Lydia Taslim",
    color: "#B9AEA6",
    bars: [6, 9, 7, 13, 10, 16, 18, 24, 12, 8, 14],
  },
  {
    name: "Ismail Hamdani",
    color: "#8A9A5B",
    bars: [7, 12, 9, 14, 8, 23, 15, 11, 18, 9, 13],
  },
] as const;

/**
 * Public landing page — the Deg Deg hero: teal card, centred nav, headline +
 * copy on the start side, and a phone mock-up ringed by floating product cards.
 * Authenticated visitors skip straight to their shell.
 */
export function LandingPage() {
  const L = useL();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);

  if (token) {
    return (
      <Navigate
        to={role === "prestataire" ? "/prestataire" : "/client"}
        replace
      />
    );
  }

  return (
    <div>
      {/* ===== Hero — fills the first viewport ===== */}
      <div className="flex min-h-screen flex-col overflow-hidden bg-de9-teal px-6 pt-6 sm:px-10 xl:px-[80px]">
      <section className="relative mx-auto flex w-full max-w-[1216px] flex-1 flex-col">
        <LandingHeader />

        {/* ===== copy + art ===== */}
        <div className="flex flex-1 items-stretch justify-between gap-10">
          <div className="flex max-w-[560px] flex-col justify-center py-12 lg:max-w-[420px] xl:max-w-[560px]">
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              {L("Gérez votre équipe", "أدر فريقك")}
            </h1>
            <p className="mt-7 text-base font-medium leading-relaxed text-white sm:text-[17px]">
              {L(
                "La plateforme complète pour organiser votre effectif, et suivre vos performances en temps réel.",
                "المنصة الكاملة لتنظيم فريقك ومتابعة أدائك في الوقت الفعلي.",
              )}
            </p>
            <p className="mt-4 text-base font-semibold leading-relaxed text-white sm:text-[17px]">
              {L(
                "Avec De9De9 Entreprise, suivez les performances de vos collaborateurs, assignez des missions, et gardez le contrôle sur chaque aspect de votre activité.",
                "مع De9De9 Entreprise، تابع أداء موظفيك، وأسند المهام، وتحكّم في كل جوانب نشاطك.",
              )}
            </p>

            <div className="mt-12 flex flex-wrap gap-6">
              <a
                href={APP_DOWNLOAD_URL}
                className="flex h-[58px] items-center justify-center rounded-[14px] border border-white px-8 text-[15px] font-semibold text-white transition-colors hover:bg-white/15"
              >
                {L("Télécharger l'application", "حمّل التطبيق")}
              </a>
              <Link
                to="/contact"
                className="flex h-[58px] items-center justify-center gap-4 rounded-[14px] bg-white px-8 text-[15px] font-semibold text-de9-teal-dark transition-[filter] hover:brightness-95"
              >
                {L("Nous contacter", "اتصل بنا")}
                <Mail className="size-5" />
              </Link>
            </div>
          </div>

          <PhoneArt />
        </div>
      </section>
      </div>

      {/* ===== Visibilité ===== */}
      <VisibiliteSection />

      {/* ===== Analysez vos retours ===== */}
      <RetoursSection />

      {/* ===== Download band + footer (share the teal backdrop) ===== */}
      <div className="bg-de9-teal">
        <WaveDivider />
        <DownloadSection />
        <SiteFooter />
      </div>

      {/* <footer className="mx-auto flex w-full max-w-[1216px] flex-wrap items-center justify-between gap-2 px-2 py-6 text-xs text-de9-gray">
        <span>De9 De9 Entreprise — {L('Alger, Algérie', 'الجزائر العاصمة، الجزائر')}</span>
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
          {CONTACT_EMAIL}
        </a>
      </footer> */}
    </div>
  );
}

/**
 * "Maximisez votre visibilité" — red graph-paper panel with the photo breaking
 * out of it on the start side, copy + quote CTA on the end side.
 */
function VisibiliteSection() {
  const L = useL();
  const [artFailed, setArtFailed] = useState(false);

  return (
    <section className="bg-background px-6 py-20 sm:px-10 xl:px-[80px]">
      <div className="mx-auto flex max-w-[1216px] flex-col items-center gap-14 lg:flex-row lg:gap-24">
        {/* photo */}
        <div className="w-full max-w-[460px] flex-none lg:w-[460px]">
          {!artFailed && (
            <img
              src={VISIBILITE_IMG}
              onError={() => setArtFailed(true)}
              alt=""
              className="w-full"
            />
          )}
        </div>

        {/* copy */}
        <div className="max-w-[560px]">
          <h2 className="text-3xl font-bold leading-tight text-de9-teal sm:text-[40px]">
            {L('Maximisez votre visibilité', 'عزّز ظهورك')}
          </h2>
          <p className="mt-7 text-base leading-relaxed text-de9-ink sm:text-[17px]">
            {L(
              'Grâce à notre plateforme, présentez vos services, obtenez des avis certifiés et augmentez votre taux de conversion.',
              'بفضل منصتنا، اعرض خدماتك، واحصل على تقييمات موثّقة، وارفع معدل التحويل.',
            )}
          </p>
          <p className="mt-5 text-base leading-relaxed text-de9-ink sm:text-[17px]">
            {L(
              'Votre savoir-faire mérite d’être vu. Nous vous aidons à le faire briller.',
              'خبرتك تستحق أن تُرى. نساعدك على إبرازها.',
            )}
          </p>
          <Link
            to="/contact"
            className="mt-10 inline-flex h-[52px] items-center justify-center rounded-[10px] bg-de9-teal px-8 text-[15px] font-semibold text-primary-foreground transition-[filter] hover:brightness-95"
          >
            {L('Demander un devis', 'اطلب عرض سعر')}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** "Analysez vos retours" — centred heading over three feature cards. */
function RetoursSection() {
  const L = useL();
  const cards = [
    { icon: BarChart3, label: L('Suivez vos\nStatistiques', 'تابع إحصائياتك') },
    { icon: TrendingUp, label: L('Evaluez vos\nPerformances', 'قيّم أداءك') },
    { icon: Zap, label: L('Améliorez vos\nRésultats', 'حسّن نتائجك') },
  ];

  return (
    <section className="bg-background px-6 pb-24 pt-20 sm:px-10 xl:px-[80px]">
      <h2 className="text-center text-3xl font-bold text-de9-teal sm:text-[40px]">
        {L('Analysez vos retours', 'حلّل نتائجك')}
      </h2>
      <div className="mx-auto mt-16 flex max-w-[1000px] flex-wrap justify-center gap-14">
        {cards.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex w-[190px] flex-col items-center gap-5 rounded-[18px] bg-card px-6 py-8 text-center shadow-float dark:ring-1 dark:ring-border"
          >
            <Icon className="size-9 text-de9-teal" strokeWidth={2.4} />
            <p className="whitespace-pre-line text-[15px] font-semibold leading-snug text-de9-ink">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Curved transition from the light page into the teal download band. */
function WaveDivider() {
  return (
    <div className="bg-background">
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="block h-[60px] w-full text-de9-teal sm:h-[110px]"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0 62C220 14 470 0 730 22c250 21 470 74 710 44v54H0z"
        />
      </svg>
    </div>
  );
}

/** "Téléchargez l'application" — copy on the start side, app mock-up on the end. */
function DownloadSection() {
  const L = useL();
  return (
    <section className="px-6 pb-14 pt-6 sm:px-10 xl:px-[80px]">
      <div className="mx-auto flex max-w-[1216px] flex-col items-center gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[520px] py-10 lg:py-20">
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-[40px]">
            {L("Téléchargez l'application", 'حمّل التطبيق')}
          </h2>
          <p className="mt-7 text-base font-semibold leading-relaxed text-white sm:text-[17px]">
            {L(
              'Gérez vos équipes, vos missions et vos statistiques directement depuis votre mobile.',
              'أدر فرقك ومهامك وإحصائياتك مباشرة من هاتفك.',
            )}
          </p>
          <p className="mt-6 text-base font-semibold text-white sm:text-[17px]">
            {L('Disponible sur Android et iOS.', 'متوفّر على أندرويد و iOS.')}
          </p>
          <div className="mt-7 flex items-center gap-7">
            <a
              href={STORE_URLS.ios}
              aria-label={L("Télécharger sur l'App Store", 'حمّل من App Store')}
              className="text-white transition-opacity hover:opacity-80"
            >
              <AppleIcon className="size-8" />
            </a>
            <a
              href={STORE_URLS.android}
              aria-label={L('Télécharger sur Google Play', 'حمّل من Google Play')}
              className="text-white transition-opacity hover:opacity-80"
            >
              <GooglePlayIcon className="size-8" />
            </a>
          </div>
        </div>

        <img
          src={APP_PHONE_IMG}
          alt=""
          className="w-[300px] max-w-full flex-none lg:w-[380px]"
        />
      </div>
    </section>
  );
}

/** Phone mock-up with the floating "Mon équipe", team and "Statistiques" cards. */
function PhoneArt() {
  const L = useL();
  return (
    <div
      className="relative hidden h-[545px] w-[512px] flex-none self-end lg:block"
      aria-hidden
    >
      {/* phone body — bezel blends into the hero, screen reads as the surface */}
      <div className="absolute left-[42px] top-0 h-[560px] w-[340px] rounded-t-[46px] bg-white/20 p-2.5">
        <div className="relative h-full w-full overflow-hidden rounded-t-[38px] bg-[#F8F9FA]">
          <div className="absolute left-1/2 top-0 flex h-[34px] w-[190px] -translate-x-1/2 items-center justify-center gap-3 rounded-b-[18px] bg-de9-teal">
            <span className="h-1.5 w-[64px] rounded-full bg-white/90" />
            <span className="size-2.5 rounded-full bg-white/90" />
          </div>
        </div>
      </div>

      {/* "Mon équipe" quota card */}
      <div className="absolute left-[92px] top-[185px] w-[245px] rounded-[16px] bg-de9-teal p-5 shadow-float">
        <div className="flex items-center justify-between text-white">
          <span className="text-[15px] font-bold">
            {L("Mon équipe", "فريقي")}
          </span>
          <UsersRound className="size-5" />
        </div>
        <p className="mt-3 text-[22px] font-bold leading-none text-white">
          3/5
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/40">
          <span className="block h-full w-[60%] rounded-full bg-white" />
        </div>
      </div>

      {/* team member cards */}
      {SHOWCASE.map((m, i) => (
        <div
          key={m.name}
          className="absolute left-[327px] w-[185px] rounded-[14px] bg-white p-2.5 shadow-float"
          style={{ top: 123 + i * 82 }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-[38px] flex-none place-items-center rounded-full text-[12px] font-bold text-white"
              style={{ backgroundColor: m.color }}
            >
              {m.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <span className="truncate text-[11px] font-bold text-de9-ink">
                  {m.name}
                </span>
                <Star className="size-3 flex-none fill-[#FFC93C] text-[#FFC93C]" />
              </div>
              <div className="mt-1.5 flex h-[26px] items-end gap-[3px]">
                {m.bars.map((h, bi) => (
                  <span
                    key={bi}
                    className={`w-[4px] rounded-full ${h >= 20 ? "bg-de9-teal" : "bg-de9-teal/35"}`}
                    style={{ height: h }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* "Statistiques" card */}
      <div className="absolute left-0 top-[350px] h-[128px] w-[240px] overflow-hidden rounded-[16px] bg-white px-5 pt-4 shadow-float">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-de9-ink">
            {L("Statistiques", "الإحصائيات")}
          </span>
          <BarChart3 className="size-5 text-de9-teal" />
        </div>
        <svg
          className="absolute inset-x-0 bottom-0 h-[70px] w-full"
          viewBox="0 0 240 70"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="landing-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#E7464E" stopOpacity=".45" />
              <stop offset="1" stopColor="#E7464E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            fill="url(#landing-spark)"
            d="M0 56 C12 54 18 32 30 30 C42 28 46 46 58 48 C70 50 76 20 88 18 C100 16 104 40 116 42 C128 44 132 30 144 30 C156 30 160 48 172 50 C184 52 190 34 202 30 C214 26 222 14 240 12 V70 H0 Z"
          />
          <path
            fill="none"
            stroke="#E7464E"
            strokeWidth="2.5"
            strokeLinecap="round"
            d="M0 56 C12 54 18 32 30 30 C42 28 46 46 58 48 C70 50 76 20 88 18 C100 16 104 40 116 42 C128 44 132 30 144 30 C156 30 160 48 172 50 C184 52 190 34 202 30 C214 26 222 14 240 12"
          />
        </svg>
      </div>
    </div>
  );
}
