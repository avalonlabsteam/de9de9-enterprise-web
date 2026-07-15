import { Phone, MessageCircle, Mail } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useT } from '@/lib/i18n';
import { useUiStore, uiActions } from '@/stores/uiStore';
import { dirOf, useLangStore } from '@/stores/langStore';

/**
 * Global "Besoin d'aide ?" sheet, driven by uiStore. Channels are inert (mock).
 */
export function SupportHost() {
  const t = useT();
  const open = useUiStore((s) => s.supportOpen);
  const lang = useLangStore((s) => s.lang);
  const side = dirOf(lang) === 'rtl' ? 'left' : 'right';

  const rows = [
    { icon: Phone, label: t('callBtn') },
    { icon: MessageCircle, label: t('whatsappBtn') },
    { icon: Mail, label: t('emailBtn') },
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? uiActions.openSupport() : uiActions.closeSupport())}>
      <SheetContent side={side} className="w-[340px] gap-0 bg-card p-5">
        <SheetHeader className="p-0">
          <SheetTitle className="text-[17px] font-extrabold text-de9-ink">{t('supportTitle')}</SheetTitle>
        </SheetHeader>
        <div className="mt-5 flex flex-col gap-2.5">
          {rows.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="flex items-center gap-3 rounded-xl border border-de9-line bg-de9-row px-4 py-3.5 text-start hover:border-de9-teal"
            >
              <span className="flex size-9 flex-none items-center justify-center rounded-full bg-[#E5F7F4] text-de9-teal-dark dark:bg-[#14322E]">
                <Icon className="size-[18px]" />
              </span>
              <span className="text-[13.5px] font-bold text-de9-ink">{label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Placeholder hosts for the document viewer and worker viewer overlays
 * (search-param driven, e.g. ?doc=… / ?worker=…). Fleshed out in M6/M7.
 */
export function DocViewHost() {
  return null;
}

export function WorkerViewHost() {
  return null;
}
