import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { toProblem } from '@/api/problem';
import { useL } from '@/lib/i18n';
import { messageOnlySchema, type ApiAction, type Support } from '@/lib/actions/schema';
import { actionErrorMessage, buildBody, sendAction, type SheetValues } from '@/lib/actions/run';
import { ConfirmDialog, SupportDialog, ViewerDialog } from './ActionDialogs';

export const actionKey = (a: ApiAction) => `${a.method}:${a.href}`;

type Message = { titre: string; texte?: string | null } | null | undefined;

interface Options<T> {
  /** The `reponse` whose 2xx body carries the whole new screen (`mission`, `demande_devis`). */
  reponse: string;
  /** Read that body: its toast and its screen — null when it does not fit (the screen is then fetched again). */
  readScreen: (data: unknown) => { message: Message; screen: T } | null;
  /** Put the new screen in place of the old one. */
  onScreen: (screen: T) => void;
  /** GET the screen again — after `recharger`, and after a 403 / 404 / 409. */
  reload: () => void;
  /** What « Contacter de9de9 » opens. */
  support?: Support | null;
  /** The screen's own `ouvre` values (the worker picker, a scroll…): true when handled. */
  open?: (action: ApiAction) => boolean;
}

const showMessage = (message: Message) => {
  if (message) toast.success(message.titre, { description: message.texte ?? undefined });
};

/**
 * One algorithm for every button of a prestataire screen (guide 12 §6): what
 * the press opens, asks (the `confirm` sheet), sends — always as multipart when
 * the action says so — and how the answer is read. Render `dialogs` once in the
 * screen.
 */
export function useActionPress<T>({ reponse, readScreen, onScreen, reload, support, open }: Options<T>) {
  const L = useL();
  const [confirmFor, setConfirmFor] = useState<ApiAction | null>(null);
  const [viewer, setViewer] = useState<{ action: ApiAction; title?: string } | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  /** Steps 3–7: send, then read the answer by `reponse`. */
  const execute = async (
    action: ApiAction,
    body: Record<string, unknown>,
    files: Record<string, File[]> = {},
  ): Promise<{ ok: boolean; error?: unknown }> => {
    setBusyKey(actionKey(action));
    try {
      const data = await sendAction(action, body, files, { multipartAlways: true });
      const read = action.reponse === reponse ? readScreen(data) : null;
      if (read) {
        onScreen(read.screen);
        showMessage(read.message);
      } else {
        // `recharger`: a reused route answered its own format — GET the screen again.
        const message = messageOnlySchema.safeParse(data);
        if (message.success) showMessage(message.data.message);
        reload();
      }
      return { ok: true };
    } catch (error) {
      toast.error(actionErrorMessage(action, error, L("L'action n'a pas pu aboutir. Réessayez.", 'تعذّر تنفيذ الإجراء. أعد المحاولة.')));
      // The screen is out of date (409), or what it offered is gone (403 `forbidden_ball`,
      // 404): fetch it before the user acts again.
      if ([403, 404, 409].includes(toProblem(error).status)) reload();
      return { ok: false, error };
    } finally {
      setBusyKey(null);
    }
  };

  /** Steps 1–2: what a press opens, asks, or sends. */
  const press = (action: ApiAction) => {
    if (open?.(action)) return;
    switch (action.ouvre) {
      case 'support':
        if (support) setSupportOpen(true);
        return;
      case 'document':
      case 'motif':
        setViewer({ action });
        return;
    }
    if (!action.href || !action.method) {
      if (action.indisponible) toast.info(action.indisponible);
      return;
    }
    if (action.confirm) {
      setConfirmFor(action);
      return;
    }
    void execute(action, buildBody(action, { values: {}, files: {} }));
  };

  const confirmSheet = async (action: ApiAction, sheet: SheetValues) => {
    const result = await execute(action, buildBody(action, sheet), sheet.files);
    // A refused field or file (400, 413, 415) or a lost connection: keep the
    // sheet so it can be fixed and sent again. Done, or the screen moved on: close.
    const status = toProblem(result.error).status;
    if (result.ok || status === 403 || status === 404 || status === 409) setConfirmFor(null);
  };

  const dialogs: ReactNode = (
    <>
      {confirmFor && (
        <ConfirmDialog
          key={actionKey(confirmFor)}
          action={confirmFor}
          busy={busyKey === actionKey(confirmFor)}
          onClose={() => setConfirmFor(null)}
          onConfirm={(sheet) => void confirmSheet(confirmFor, sheet)}
        />
      )}
      {supportOpen && support && <SupportDialog support={support} onClose={() => setSupportOpen(false)} />}
      {viewer && <ViewerDialog action={viewer.action} title={viewer.title} onClose={() => setViewer(null)} />}
    </>
  );

  return {
    press,
    execute,
    busyKey,
    /** Open a file row (a brief document, an attachment) in the viewer, titled by its name. */
    openFile: (action: ApiAction, title: string) => setViewer({ action, title }),
    dialogs,
  };
}
