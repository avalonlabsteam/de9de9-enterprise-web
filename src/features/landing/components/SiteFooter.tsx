import { Mail, Phone, MapPin } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { CONTACT_DETAILS } from '../contactDetails';
import { LOGO_MARK_IMG, STORE_URLS, SOCIAL_URLS } from '../constants';
import {
  AppleIcon,
  GooglePlayColor,
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  LinkedinIcon,
} from './BrandIcons';

const COPYRIGHT_YEAR = new Date().getFullYear();

/** White footer card that curves over the teal band. */
export function SiteFooter() {
  const L = useL();
  const socials = [
    { href: SOCIAL_URLS.facebook, Icon: FacebookIcon, name: 'Facebook' },
    { href: SOCIAL_URLS.instagram, Icon: InstagramIcon, name: 'Instagram' },
    { href: SOCIAL_URLS.tiktok, Icon: TiktokIcon, name: 'TikTok' },
    { href: SOCIAL_URLS.linkedin, Icon: LinkedinIcon, name: 'LinkedIn' },
  ];

  return (
    <footer className="relative z-10 rounded-t-[40px] bg-card px-6 pb-8 pt-12 sm:px-10 xl:px-[80px]">
      <div className="mx-auto flex max-w-[1216px] flex-wrap justify-between gap-12">
        {/* brand + store badges */}
        <div>
          <img
            src={LOGO_MARK_IMG}
            alt="De9 De9 Entreprise"
            width={563}
            height={563}
            className="-ms-3 -mt-3 size-[104px]"
          />
          <p className="mt-3 text-[13px] font-semibold text-de9-ink">
            {L("Téléchargez l'application", 'حمّل التطبيق')}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={STORE_URLS.android}
              className="flex h-11 items-center gap-2.5 rounded-lg border border-de9-line px-4 text-[13px] font-semibold text-de9-ink transition-shadow hover:shadow-soft"
            >
              <GooglePlayColor className="size-5" />
              Play Store
            </a>
            <a
              href={STORE_URLS.ios}
              className="flex h-11 items-center gap-2.5 rounded-lg border border-de9-line px-4 text-[13px] font-semibold text-de9-ink transition-shadow hover:shadow-soft"
            >
              <AppleIcon className="size-5" />
              App Store
            </a>
          </div>
        </div>

        {/* contacts */}
        <div>
          <h3 className="text-[15px] font-bold text-de9-ink">{L('Contacts', 'اتصالات')}</h3>
          <ul className="mt-5 flex flex-col gap-4 text-[13px] text-de9-ink">
            <li className="flex items-center gap-3">
              <Phone className="size-4 flex-none text-de9-teal" />
              <a
                href={`tel:${CONTACT_DETAILS.phone.replace(/[^\d+]/g, '')}`}
                className="hover:underline"
              >
                {CONTACT_DETAILS.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 flex-none text-de9-teal" />
              <a href={`mailto:${CONTACT_DETAILS.email}`} className="hover:underline">
                {CONTACT_DETAILS.email}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-4 flex-none text-de9-teal" />
              {CONTACT_DETAILS.address}
            </li>
          </ul>
        </div>

        {/* socials */}
        <div>
          <h3 className="text-[15px] font-bold text-de9-ink">
            {L('Réseaux sociaux', 'شبكات التواصل')}
          </h3>
          <div className="mt-5 flex gap-4">
            {socials.map(({ href, Icon, name }) => (
              <a
                key={name}
                href={href}
                aria-label={name}
                className="text-de9-teal transition-opacity hover:opacity-70"
              >
                <Icon className="size-9" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-[1216px] text-center text-[11px] text-de9-gray">
        Copyright © {COPYRIGHT_YEAR} Eurl Avalon Labs ·{' '}
        {L('Tous droits réservés', 'جميع الحقوق محفوظة')} ·{' '}
        <a href="#privacy" className="hover:underline">
          {L('Politique de confidentialité', 'سياسة الخصوصية')}
        </a>{' '}
        ·{' '}
        <a href="#terms" className="hover:underline">
          {L('Termes et conditions', 'الشروط والأحكام')}
        </a>
      </p>
    </footer>
  );
}
