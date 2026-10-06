import { useState } from 'react';
import { Download, Eye, Loader2, Lock, Mail, MessageCircle, Phone, Star } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/api/apiClient';
import { fileNameOf, openAuthedFile, saveBlob } from '@/lib/authedFile';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PieceSlot } from '@/components/common/PieceSlot';
import type { ApiAction, Champ, Support } from '@/lib/actions/schema';
import { apiUrl, initialSheet, sheetReady, type SheetValues } from '@/lib/actions/run';
import { confirmStyle, hasIcon } from '@/lib/tones';
import { TonePill } from './parts';
import { ApiIcon } from '@/components/common/ApiIcon';

// ------------------------------------------------------------ confirmation sheet

/**
 * The sheet an action's `confirm` describes: its text, its fields (prefilled
 * with their `valeur`), « Revenir » and the coloured confirm button — disabled
 * until every `requis` field is filled. Key it on the action so each opening
 * starts afresh.
 */
export function ConfirmDialog({
  action,
  busy,
  onClose,
  onConfirm,
}: {
  action: ApiAction;
  busy: boolean;
  onClose: () => void;
  onConfirm: (sheet: SheetValues) => void;
}) {
  const [sheet, setSheet] = useState<SheetValues>(() => initialSheet(action));
  const confirm = action.confirm;
  if (!confirm) return null;

  const ready = sheetReady(confirm.champs, sheet);
  const setValue = (code: string, value: unknown) =>
    setSheet((s) => ({ ...s, values: { ...s.values, [code]: value } }));
  const setFiles = (code: string, files: File[]) => setSheet((s) => ({ ...s, files: { ...s.files, [code]: files } }));

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
                files={sheet.files[champ.code] ?? []}
                onValue={(v) => setValue(champ.code, v)}
                onFiles={(f) => setFiles(champ.code, f)}
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

const Aide = ({ text }: { text?: string | null }) =>
  text ? <p className="mt-1.5 text-[12px] text-de9-gray">{text}</p> : null;

/** One sheet field, drawn by its `type`. */
function ChampInput({
  champ,
  value,
  files,
  onValue,
  onFiles,
}: {
  champ: Champ;
  value: unknown;
  files: File[];
  onValue: (value: unknown) => void;
  onFiles: (files: File[]) => void;
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
                    selected ? 'bg-de9-teal text-primary-foreground' : 'bg-secondary text-de9-teal-dark',
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
          <Aide text={champ.aide} />
        </div>
      );

    case 'date':
      return (
        <div>
          {label}
          <Input
            type="date"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onValue(e.target.value)}
            className="w-full sm:w-52"
            dir="ltr"
          />
          <Aide text={champ.aide} />
        </div>
      );

    case 'montant_dzd': {
      const amount = typeof value === 'number' ? value : undefined;
      return (
        <div>
          {label}
          <div className="relative">
            <Input
              type="number"
              inputMode="numeric"
              min={champ.min ?? 1}
              step={1}
              value={amount ?? ''}
              onChange={(e) => onValue(e.target.value === '' ? undefined : Number(e.target.value))}
              className="pe-12 tabular-nums"
              dir="ltr"
            />
            <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-de9-gray">
              DA
            </span>
          </div>
          {amount != null && amount > 0 && (
            <p className="mt-1 text-[12px] font-semibold text-de9-teal-dark tabular-nums">
              = {(amount * 10).toLocaleString('fr-FR')} {L('crédits', 'رصيد')}
            </p>
          )}
          <Aide text={champ.aide} />
        </div>
      );
    }

    case 'lecture_seule':
      return (
        <div className="rounded-lg bg-secondary px-3.5 py-2.5">
          <p className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-1.5 text-de9-gray">
              <Lock className="size-3.5" />
              {champ.label}
            </span>
            <span className="text-end font-semibold text-de9-slate">{String(champ.valeur ?? '—')}</span>
          </p>
          <Aide text={champ.aide} />
        </div>
      );

    case 'fichier':
      return (
        <div>
          {label}
          <FileField champ={champ} files={files} onFiles={onFiles} />
          <Aide text={champ.aide} />
        </div>
      );

    default:
      return null;
  }
}

/** `application/pdf,image/*` against a file — what a drop must be checked on (the picker filters by itself). */
function accepts(accept: string | null | undefined, file: File): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept.split(',').some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return file.type.startsWith(rule.slice(0, -1));
    return file.type === rule;
  });
}

/**
 * A `fichier` field: at most `max` files (1 when null) of `maxOctets` each,
 * picked or dropped. Each picked file shows as a removable slot; the picker
 * stays while there is room for another.
 */
function FileField({ champ, files, onFiles }: { champ: Champ; files: File[]; onFiles: (files: File[]) => void }) {
  const L = useL();
  const [dragging, setDragging] = useState(false);
  const max = champ.max ?? 1;
  const tooBig = L('Fichier trop lourd.', 'الملف ثقيل.');

  const add = (picked: File[]) => {
    const kept: File[] = [];
    for (const file of picked) {
      if (!accepts(champ.accepte, file)) toast.error(L(`« ${file.name} » : type non accepté.`, `« ${file.name} »: نوع غير مقبول.`));
      else if (champ.maxOctets && file.size > champ.maxOctets) toast.error(`${file.name} — ${tooBig}`);
      else kept.push(file);
    }
    const next = [...files, ...kept];
    if (next.length > max) toast.error(L(`${max} fichier(s) au plus.`, `${max} ملف(ات) على الأكثر.`));
    // One file allowed: a new pick replaces it.
    onFiles(max === 1 ? next.slice(-1) : next.slice(0, max));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        add([...e.dataTransfer.files]);
      }}
      className={cn('flex flex-col gap-2 rounded-lg', dragging && 'ring-2 ring-de9-teal ring-offset-2 ring-offset-background')}
    >
      {files.map((file, i) => (
        <PieceSlot
          key={`${file.name}-${i}`}
          label={champ.label ?? file.name}
          value={{ name: file.name, file }}
          onChange={() => onFiles(files.filter((_, j) => j !== i))}
        />
      ))}
      {files.length < max && (
        <PieceSlot
          label={champ.bouton ?? champ.label ?? L('Joindre un fichier', 'إرفاق ملف')}
          hint={champ.placeholder ?? undefined}
          accept={champ.accepte ?? 'application/pdf,image/*'}
          maxBytes={champ.maxOctets ?? undefined}
          onReject={() => toast.error(tooBig)}
          value={null}
          onChange={(picked) => picked?.file && add([picked.file])}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------ support sheet

function CanalIcon({ code }: { code?: string | null }) {
  if (code === 'whatsapp') return <MessageCircle className="size-4" />;
  if (code === 'email') return <Mail className="size-4" />;
  return <Phone className="size-4" />;
}

/** « Contacter le support » / « Contacter de9de9 »: no call — one button per channel of the answer. */
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
                    ? 'bg-de9-teal text-primary-foreground shadow-glow hover:brightness-95'
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

/**
 * `ouvre: "document"`: the viewer's frame (title, facts, status chip) around
 * the file. The file is private — fetched with the bearer token, never a bare
 * link. No `href` → the « no file yet » sentence instead. `ouvre: "motif"`:
 * the same frame, alone — there is no file to open.
 */
export function ViewerDialog({
  action,
  title,
  onClose,
}: {
  action: ApiAction;
  /** When the action carries no `visionneuse` (a file row): the file's name. */
  title?: string;
  onClose: () => void;
}) {
  const L = useL();
  const [loading, setLoading] = useState<'apercu' | 'telecharger' | null>(null);
  const v = action.visionneuse;
  const fileless = action.ouvre === 'motif';

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
      saveBlob(res.data as Blob, fileNameOf(res.headers['content-disposition']) ?? title ?? v?.titre ?? 'document');
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
          <DialogTitle className="break-words">{v?.titre ?? title ?? action.label}</DialogTitle>
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
        {fileless ? null : action.href ? (
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
