import { Link } from 'react-router-dom';
import { useL } from '@/lib/i18n';
import { APP_DOWNLOAD_URL, LOGO_WHITE_IMG } from '../constants';

/** Teal top nav shared by the landing hero and the contact screen. */
export function LandingHeader() {
  const L = useL();
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <Link to="/">
        <img
          src={LOGO_WHITE_IMG}
          alt="De9 De9 Entreprise"
          width={212}
          height={200}
          className="h-[74px] w-auto"
        />
      </Link>

      <nav className="order-3 flex flex-wrap gap-6 text-sm font-semibold text-white lg:order-none lg:gap-12">
        <Link to="/" className="hover:underline">
          {L('Accueil', 'الرئيسية')}
        </Link>
        <Link to="/contact" className="hover:underline">
          {L('Nous contacter', 'اتصل بنا')}
        </Link>
        <a href={APP_DOWNLOAD_URL} className="hover:underline">
          {L('Notre app', 'تطبيقنا')}
        </a>
      </nav>

      <div className="flex gap-3">
        <Link
          to="/login"
          className="flex h-11 items-center justify-center rounded-full bg-white/25 px-6 text-[13px] font-semibold text-white transition-colors hover:bg-white/35"
        >
          {L('Se connecter', 'تسجيل الدخول')}
        </Link>
        <Link
          to="/role"
          className="flex h-11 items-center justify-center rounded-full border border-white px-6 text-[13px] font-semibold text-white transition-colors hover:bg-white/15"
        >
          {L('Créer un compte', 'إنشاء حساب')}
        </Link>
      </div>
    </header>
  );
}
