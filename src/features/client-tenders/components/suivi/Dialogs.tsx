import { useState } from 'react';
import { Download, Eye, Loader2, Mail, MessageCircle, Phone, Star } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/api/apiClient';
import { openAuthedFile } from '@/lib/authedFile';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PieceSlot } from '@/components/common/PieceSlot';
import type { Champ, SuiviAction, Support } from '../../schemas/suivi';
import { apiUrl, champFilled, type SheetValues } from '../../lib/suiviActions';
import { confirmStyle, hasIcon } from '@/lib/tones';
import { TonePill } from './parts';
import { ApiIcon } from '@/components/common/ApiIcon';

// ------------------------------------------------------------ confirmation sheet

/**
 * The sheet an action's `confirm` describes: its text, its fields, « Revenir »
 * and the coloured confirm button — disabled until every `requis` field is
 * filled. Key it on the action so each opening starts empty.
 */
export function ConfirmDialog({
  action,
  busy,
  onClose,
  onConfirm,
}: {
  action: SuiviAction;
  busy: boolean;
  onClose: () => void;
  onConfirm: (sheet: SheetValues) => void;
}) {
  const [sheet, setSheet] = useState<SheetValues>({ values: {}, files: {} });
  const confirm = action.confirm;
  if (!confirm) return null;

  const ready = confirm.champs.every((champ) => !champ.requis || champFilled(champ, sheet));
  const setValue = (code: string, value: unknown) =>
    setSheet((s) => ({ ...s, values: { ...s.values, [code]: value } }));
  const setFile = (code: string, file: File | null) =>
    setSheet((s) => {
      const files = { ...s.files };
      if (file) files[code] = file;
      else delete files[code];
      return { ...s, files };
    });

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          {hasIcon(confirm.icone) && (
            <span className="mb-1 grid size-10 place-items-center rounded-full bg-secondary text-de9-ink">
              <ApiIcon code={confirm.icone} className="size-5" />
            </span>
          )}
          <DialogTitle>{confirm.titre}</DialogTitle>
          {confirm.texte && <DialogDescription>{confirm.texte}</DialogDescription>}
        </DialogHeader>

        {confirm.champs.length > 0 && (
          <div className="flex flex-col gap-4">
            {confirm.champs.map((champ) => (
              <ChampInput
                key={champ.code}
                champ={champ}
                value={sheet.values[champ.code]}
                file={sheet.files[champ.code]}
                onValue={(v) => setValue(champ.code, v)}
                onFile={(f) => setFile(champ.code, f)}
              />
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {confirm.boutonAnnuler}
          </Button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => onConfirm(sheet)}
            className={cn(
              'inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold disabled:opacity-50',
              confirmStyle(confirm.tonConfirmer),
            )}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {confirm.boutonConfirmer}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** One sheet field, drawn by its `type`. */
function ChampInput({
  champ,
  value,
  file,
  onValue,
  onFile,
}: {
  champ: Champ;
  value: unknown;
  file?: File;
  onValue: (value: unknown) => void;
  onFile: (file: File | null) => void;
}) {
  const L = useL();
  const label = champ.label && (
    <p className="mb-2 text-[13px] font-semibold text-de9-ink">
      {champ.label}
      {champ.requis && <span className="text-destructive"> *</span>}
    </p>
  );

  switch (champ.type) {
    case 'choix_unique':
      return (
        <div role="radiogroup" aria-label={champ.label ?? undefined}>
          {label}
          <div className="flex flex-col gap-2">
            {champ.options.map((option) => {
              const selected = value === option.valeur;
              return (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onValue(option.valeur)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-start text-[13px] transition-colors',
                    selected ? 'bg-accent font-bold text-de9-ink ring-2 ring-de9-teal' : 'bg-secondary text-de9-ink',
                  )}
                >
                  <span
                    className={cn(
                      'size-4 flex-none rounded-full border-2',
                      selected ? 'border-de9-teal bg-de9-teal' : 'border-de9-gray',
                    )}
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      );

    case 'date_chips':
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {champ.options.map((option) => {
              // The chip's value is an object ({ date, time }): compare by content.
              const selected = JSON.stringify(value) === JSON.stringify(option.valeur);
              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onValue(option.valeur)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-[13px] font-bold',
                    selected ? 'bg-de9-teal text-white' : 'bg-secondary text-de9-teal-dark',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      );

    case 'note_etoiles': {
      const min = champ.min ?? 1;
      const max = champ.max ?? 5;
      const current = typeof value === 'number' ? value : 0;
      return (
        <div>
          {label}
          <div className="flex gap-1" role="radiogroup" aria-label={champ.label ?? undefined}>
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={current === n}
                aria-label={`${n}`}
                onClick={() => onValue(n)}
                className="p-0.5"
              >
                <Star className={cn('size-7', n <= current ? 'fill-amber-400 text-amber-400' : 'text-de9-gray')} />
              </button>
            ))}
          </div>
        </div>
      );
    }

    case 'texte':
      return (
        <div>
          {label}
          <Textarea
            rows={4}
            value={typeof value === 'string' ? value : ''}
            placeholder={champ.placeholder ?? undefined}
            maxLength={champ.max ?? undefined}
            onChange={(e) => onValue(e.target.value)}
          />
          {champ.max && (
            <p className="mt-1 text-end text-[11px] text-de9-gray">
              {(typeof value === 'string' ? value.length : 0).toLocaleString('fr-FR')} / {champ.max.toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      );

    case 'fichier':
      return (
        <div>
          {label}
          <PieceSlot
            label={champ.bouton ?? champ.label ?? L('Joindre un fichier', 'إرفاق ملف')}
            accept={champ.accepte ?? 'application/pdf,image/*'}
            maxBytes={champ.maxOctets ?? undefined}
            onReject={() => toast.error(L('Fichier trop lourd.', 'الملف ثقيل.'))}
            value={file ? { name: file.name, file } : null}
            onChange={(picked) => onFile(picked?.file ?? null)}
          />
        </div>
      );

    default:
      return null;
  }
}

// ------------------------------------------------------------ support sheet

function CanalIcon({ code }: { code?: string | null }) {
  if (code === 'whatsapp') return <MessageCircle className="size-4" />;
  if (code === 'email') return <Mail className="size-4" />;
  return <Phone className="size-4" />;
}

/** « Contacter le support »: no call — one button per channel of the answer. */
export function SupportDialog({ support, onClose }: { support: Support; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{support.titre}</DialogTitle>
          {support.texte && <DialogDescription>{support.texte}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {support.canaux.map((canal) => {
            return (
              <a
                key={canal.href}
                href={canal.href}
                target={canal.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className={cn(
                  'flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-bold',
                  canal.principal
                    ? 'bg-de9-teal text-white shadow-glow hover:bg-de9-teal-dark'
                    : 'bg-secondary text-de9-ink hover:bg-secondary/80',
                )}
              >
                <CanalIcon code={canal.code} />
                {canal.label}
              </a>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------ document viewer

/** The file name the server gave, from `Content-Disposition`, if any. */
function fileNameOf(disposition: unknown): string | undefined {
  if (typeof disposition !== 'string') return undefined;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star?.[1]) return decodeURIComponent(star[1]);
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1];
}

/**
 * `ouvre: "document"`: the viewer's frame (title, facts, status chip) around
 * the file. The file is private — fetched with the bearer token, never a bare
 * link. No `href` → the « no file yet » sentence instead.
 */
export function ViewerDialog({ action, onClose }: { action: SuiviAction; onClose: () => void }) {
  const L = useL();
  const [loading, setLoading] = useState<'apercu' | 'telecharger' | null>(null);
  const v = action.visionneuse;

  const preview = async () => {
    const href = action.apercuHref ?? action.href;
    if (!href) return;
    setLoading('apercu');
    try {
      await openAuthedFile(apiUrl(href));
    } catch {
      toast.error(L("Impossible d'ouvrir le document.", 'تعذّر فتح المستند.'));
    } finally {
      setLoading(null);
    }
  };

  const download = async () => {
    if (!action.href) return;
    setLoading('telecharger');
    try {
      const res = await apiClient.get(apiUrl(action.href), { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileNameOf(res.headers['content-disposition']) ?? v?.titre ?? 'document';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error(L('Téléchargement impossible.', 'تعذّر التنزيل.'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{v?.titre ?? action.label}</DialogTitle>
        </DialogHeader>
        {v?.statut && <TonePill tag={v.statut} className="self-start" />}
        {v && v.lignes.length > 0 && (
          <dl className="divide-y divide-border rounded-lg bg-secondary/60 px-3.5">
            {v.lignes.map((ligne) => (
              <div key={ligne.label} className="flex justify-between gap-4 py-2 text-[13px]">
                <dt className="text-de9-gray">{ligne.label}</dt>
                <dd className="text-end font-semibold text-de9-ink">{ligne.valeur}</dd>
              </div>
            ))}
          </dl>
        )}
        {action.href ? (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => void preview()} disabled={!!loading}>
              {loading === 'apercu' ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
              {L('Aperçu', 'معاينة')}
            </Button>
            <Button onClick={() => void download()} disabled={!!loading}>
              {loading === 'telecharger' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {L('Télécharger', 'تنزيل')}
            </Button>
          </DialogFooter>
        ) : (
          <p className="rounded-lg bg-secondary px-3.5 py-3 text-[13px] text-de9-slate">
            {action.indisponible ?? v?.aucunFichier ?? L('Aucun document.', 'لا يوجد مستند.')}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
