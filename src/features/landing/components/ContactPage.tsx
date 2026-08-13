import { Toaster } from '@/components/ui/sonner';
import { LandingHeader } from './LandingHeader';
import { ContactSection } from './ContactSection';
import { SiteFooter } from './SiteFooter';

/**
 * Standalone "Nous contacter" screen, reached from the landing nav. Keeps the
 * landing chrome so visitors can navigate back out.
 */
export function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-de9-teal px-6 pt-6 sm:px-10 xl:px-[80px]">
        <div className="mx-auto w-full max-w-[1216px]">
          <LandingHeader />
        </div>
      </div>

      <main className="flex-1">
        <ContactSection />
      </main>

      {/* No teal band above here, so the footer sits straight on the page —
          wrapping it in teal would only show through its rounded corners. */}
      <SiteFooter />

      {/* Public routes sit outside AppLayout, so this screen mounts its own. */}
      <Toaster position="bottom-center" />
    </div>
  );
}
