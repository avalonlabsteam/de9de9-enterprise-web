import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Clock, FileText, MapPin, MessageSquareText, RefreshCw } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toProblem } from '@/api/problem';
import { proLoadError } from '@/lib/proErrors';
import { toneBox, toneText } from '@/lib/tones';
import type { ApiAction } from '@/lib/actions/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { CategoryBubble } from '@/components/common/CategoryBubble';
import { ActionButton, TonePill } from '@/components/actions/parts';
import { actionKey, useActionPress } from '@/components/actions/useActionPress';
import { missionPathFromHref } from '@/features/prestataire-missions/lib/paths';
import { demandeDevisKey, demandesDevisKey, useDemandeDevis } from '../api/devis';
import { demandeDevisReponseSchema, type DemandeDevis, type Fichier } from '../schemas/devis';

/**
 * « Demande de devis » — one request, what de9de9 asked, and your devis
 * (`GET /prestataire/demandes-devis/{id}`, guide 13). Every state, sheet and
 * button comes from the answer; one algorithm presses them all.
 */
export function DemandeDevisPage() {
  const { id } = useParams<{ id: string }>();
  const L = useL();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useDemandeDevis(id);
  const d = query.data;

  const reload = () => {
    void queryClient.invalidateQueries({ queryKey: demandeDevisKey(id ?? '') });
    void queryClient.invalidateQueries({ queryKey: demandesDevisKey });
  };

  const { press, busyKey, openFile, dialogs } = useActionPress<DemandeDevis>({
    reponse: 'demande_devis',
    readScreen: (data) => {
      const parsed = demandeDevisReponseSchema.safeParse(data);
      return parsed.success ? { message: parsed.data.message, screen: parsed.data.demande } : null;
    },
    onScreen: (demande) => {
      queryClient.setQueryData(demandeDevisKey(id ?? ''), demande);
      // The tabs move with the request.
      void queryClient.invalidateQueries({ queryKey: demandesDevisKey });
    },
    reload,
    support: d?.support,
    open: (action) => {
      if (action.ouvre !== 'mission') return false;
      const path = missionPathFromHref(action.href);
      if (path) navigate(path);
      return true;
    },
  });

  if (query.isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-48 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (query.isError || !d) {
    const problem = toProblem(query.error);
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          title={
            problem.status === 404
              ? (problem.detail ?? L('Cette demande de devis est introuvable.', 'طلب عرض السعر هذا غير موجود.'))
              : L('Impossible de charger la demande', 'تعذّر تحميل الطلب')
          }
          description={problem.status === 404 ? undefined : proLoadError(problem, L)}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/prestataire/demandes-devis')}>
                {L('Demandes de devis', 'طلبات عروض الأسعار')}
              </Button>
              {problem.status !== 404 && (
                <Button size="sm" onClick={() => void query.refetch()}>
                  {L('Réessayer', 'إعادة المحاولة')}
                </Button>
              )}
            </div>
          }
        />
      </div>
    );
  }

  const { entete, prochaineAction: pa, monDevis } = d;
  const busy = (a: ApiAction) => busyKey === actionKey(a);
  const fileRow = (f: Fichier) => (
    <FileRow key={f.id ?? f.nom} f={f} onOpen={() => f.action && openFile(f.action, f.nom)} />
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 pb-16">
      <header className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/prestataire/demandes-devis')}
          aria-label={L('Retour', 'رجوع')}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-xl font-extrabold text-de9-ink">{d.titreEcran ?? L('Demande de devis', 'طلب عرض سعر')}</h1>
      </header>

      {/* Header — the same facts as the card */}
      <Card>
        <CardContent className="flex items-start gap-3.5 py-5">
          <CategoryBubble icone={entete.icone} className="size-12 flex-none" />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold break-words text-de9-ink">{entete.titre}</p>
            {entete.service && <p className="text-[12.5px] text-de9-gray">{entete.service}</p>}
            <div className="mt-1.5 flex flex-col gap-0.5 text-[12.5px] text-de9-slate">
              {entete.lieu && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 flex-none text-de9-teal" />
                  {entete.lieu}
                </p>
              )}
              {entete.cadenceLigne && (
                <p className="flex items-center gap-1.5">
                  <RefreshCw className="size-3.5 flex-none text-de9-teal" />
                  {entete.cadenceLigne}
                </p>
              )}
              {(entete.recueLe || entete.echeance) && (
                <p className="flex flex-wrap items-center gap-x-1.5">
                  <Clock className="size-3.5 flex-none text-de9-teal" />
                  {entete.recueLe}
                  {entete.recueLe && entete.echeance && <span aria-hidden>·</span>}
                  {entete.echeance && <span className="font-semibold text-de9-orange-deep">{entete.echeance}</span>}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* « PROCHAINE ACTION » */}
      {pa && (
        <div className={cn('flex flex-col gap-2 rounded-2xl border-s-4 px-4 py-4', toneBox(pa.balle?.ton))}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-extrabold tracking-[0.12em] text-de9-slate">
              {L('PROCHAINE ACTION', 'الإجراء التالي')}
            </p>
            {pa.balle && <TonePill tag={pa.balle} />}
          </div>
          <p className="text-[16px] font-bold text-de9-ink">{pa.titre}</p>
          {pa.texte && <p className="text-[13.5px] text-de9-slate">{pa.texte}</p>}
          {pa.motif && (
            <p className={cn('text-[13px] font-semibold', toneText(pa.motif.ton))}>
              {pa.motif.label} : {pa.motif.texte}
            </p>
          )}
        </div>
      )}

      {/* The buttons, in screen order */}
      {d.actions.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {d.actions.map((action) => (
            <ActionButton
              key={`${action.code}-${action.href ?? ''}`}
              action={action}
              busy={busy(action)}
              onPress={press}
              className={cn('h-11 sm:flex-1', action.style === 'lien_danger' && 'sm:flex-none')}
            />
          ))}
        </div>
      )}

      {/* « Mon devis » — once answered */}
      {monDevis && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[15px] font-bold text-de9-ink">{L('Mon devis', 'عرضي')}</p>
              {monDevis.statut && <TonePill tag={monDevis.statut} />}
            </div>
            {monDevis.montantLabel && (
              <p className="text-[24px] font-black text-de9-ink tabular-nums">{monDevis.montantLabel}</p>
            )}
            {monDevis.validiteLabel && <p className="text-[13px] font-semibold text-de9-slate">{monDevis.validiteLabel}</p>}
            {monDevis.message && (
              <p className="rounded-lg bg-secondary/60 px-3.5 py-2.5 text-[13.5px] whitespace-pre-line text-de9-ink">
                {monDevis.message}
              </p>
            )}
            {monDevis.envoyeLe && (
              <p className="text-[12px] text-de9-gray">
                {L('Envoyé le', 'أُرسل في')} {monDevis.envoyeLe}
                {monDevis.modifieLe && ` · ${L('modifié le', 'عُدّل في')} ${monDevis.modifieLe}`}
              </p>
            )}
            {monDevis.pieces.length > 0 && <ul className="divide-y divide-border border-t border-border">{monDevis.pieces.map(fileRow)}</ul>}
          </CardContent>
        </Card>
      )}

      {/* « Message de de9de9 » */}
      {d.messageDe9de9 && (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="flex items-center gap-1.5 text-[15px] font-bold text-de9-ink">
              <MessageSquareText className="size-4 text-de9-teal" />
              {d.messageDe9de9.titre ?? L('Message de de9de9', 'رسالة من de9de9')}
            </p>
            <p className="text-[13.5px] whitespace-pre-line text-de9-slate">{d.messageDe9de9.texte}</p>
            {d.messageDe9de9.dateLabel && <p className="text-[12px] text-de9-gray">{d.messageDe9de9.dateLabel}</p>}
          </CardContent>
        </Card>
      )}

      {/* « La demande » — what the client asked, within the fence */}
      {d.demande && (
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="mb-1 text-[15px] font-bold text-de9-ink">{d.demande.titre ?? L('La demande', 'الطلب')}</p>
            <dl className="divide-y divide-border">
              {d.demande.lignes.map((ligne) => (
                <div key={ligne.code ?? ligne.label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
                  <dt className="flex-none text-[12.5px] text-de9-gray sm:w-40">{ligne.label}</dt>
                  <dd className="min-w-0 text-[13.5px] font-semibold whitespace-pre-line break-words text-de9-ink">
                    {ligne.valeur ?? '—'}
                  </dd>
                </div>
              ))}
            </dl>
            {d.demande.documents.length > 0 && (
              <ul className="mt-1 divide-y divide-border border-t border-border">{d.demande.documents.map(fileRow)}</ul>
            )}
          </CardContent>
        </Card>
      )}

      {dialogs}
    </div>
  );
}

/** « cahier-des-charges.pdf · 248 Ko › Voir ». */
function FileRow({ f, onOpen }: { f: Fichier; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        disabled={!f.action}
        className="flex w-full items-center gap-3 py-2.5 text-start hover:bg-secondary/40 disabled:opacity-60"
      >
        <span className="grid size-8 flex-none place-items-center rounded-lg bg-secondary text-de9-teal">
          <FileText className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-de9-ink">{f.nom}</span>
          {f.taille && <span className="block text-[11.5px] text-de9-gray">{f.taille}</span>}
        </span>
        {f.action && (
          <span className="flex flex-none items-center gap-0.5 text-[12.5px] font-bold text-de9-teal-dark">
            {f.action.label}
            <ChevronRight className="size-4 rtl:rotate-180" />
          </span>
        )}
      </button>
    </li>
  );
}
