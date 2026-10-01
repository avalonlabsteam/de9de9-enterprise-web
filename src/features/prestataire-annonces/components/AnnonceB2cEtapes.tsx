import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ZoneInput } from '../api/annonces';
import {
  JOURNEE,
  PLAGE_DEFAUT,
  cleReelle,
  heure,
  ligneLibre,
  lignesPossibles,
  memesPlages,
  plagesInvalides,
  type Ligne,
  type Plage,
  type Semaine,
} from '../lib/b2c';
import type { CategorieB2c, ReferentielB2c, ZonesB2c } from '../schemas/annonces';
import { Bandeau } from './parts';
import { ZonesPicker } from './ZonesPicker';

type Libelle = { libelle: string; libelleAr?: string | null };

/** The title of a step, and the sentence under it. */
export function EtapeTitre({ titre, texte }: { titre: string; texte?: string }) {
  return (
    <div>
      <h2 className="text-[20px] font-extrabold text-de9-ink">{titre}</h2>
      {texte && <p className="mt-1 text-[13.5px] leading-relaxed text-de9-gray">{texte}</p>}
    </div>
  );
}

// ------------------------------------------------------------------ services

/**
 * Step 3 — the category's services and their tasks. A ticked task is a line of
 * the annonce; a service without task is itself the checkbox. Free lines are
 * the pro's own words: shown on the annonce, never found by the app's search.
 */
export function EtapeServices({
  categorie,
  lignes,
  libresMax,
  onChange,
}: {
  categorie: CategorieB2c;
  lignes: Ligne[];
  libresMax: number;
  onChange: (lignes: Ligne[]) => void;
}) {
  const L = useL();
  const nom = (x: Libelle) => L(x.libelle, x.libelleAr ?? x.libelle);
  const cochees = new Set(lignes.map((l) => l.key));
  const connues = new Set(lignesPossibles(categorie).map((l) => l.key));
  // Ticked once, gone from the app since: such a line blocks the publication until it is removed.
  const orphelines = lignes.filter((l) => l.libre === null && !connues.has(l.key));
  const libres = lignes.filter((l) => l.libre !== null);

  const basculer = (serviceId: number, tacheId: number | null, libelle: string) => {
    const key = cleReelle(serviceId, tacheId);
    onChange(
      cochees.has(key)
        ? lignes.filter((l) => l.key !== key)
        : [...lignes, { key, serviceId, tacheId, libre: null, libelle, prix: '', unite: null }],
    );
  };

  const case_ = (serviceId: number, tacheId: number | null, x: Libelle, gras = false) => (
    <label className="flex cursor-pointer items-start gap-3">
      <Checkbox
        checked={cochees.has(cleReelle(serviceId, tacheId))}
        onCheckedChange={() => basculer(serviceId, tacheId, x.libelle)}
        className="mt-0.5 size-5 rounded-[6px]"
      />
      <span className={cn('text-[14px] text-de9-ink', gras && 'font-bold')}>{nom(x)}</span>
    </label>
  );

  return (
    <div className="flex flex-col gap-6">
      {categorie.services.length === 0 && (
        <p className="text-[13px] text-de9-gray">{L("Cette catégorie n'a pas encore de service sur l'app de9de9.", 'هذه الفئة لا تضم خدمات بعد على تطبيق de9de9.')}</p>
      )}
      {categorie.services.map((service) =>
        service.taches.length === 0 ? (
          <div key={service.id}>{case_(service.id, null, service, true)}</div>
        ) : (
          <div key={service.id}>
            <h3 className="text-[14.5px] font-bold text-de9-ink">{nom(service)}</h3>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {service.taches.map((tache) => (
                <li key={tache.id}>{case_(service.id, tache.id, tache)}</li>
              ))}
            </ul>
          </div>
        ),
      )}

      {orphelines.length > 0 && (
        <div className="rounded-xl border border-de9-red/30 bg-de9-red/5 px-3.5 py-3">
          <p className="text-[12.5px] font-semibold text-de9-red">
            {L("Ce service n'existe plus sur l'app de9de9. Retirez-le pour continuer.", 'هذه الخدمة لم تعد موجودة على تطبيق de9de9. احذفها للمتابعة.')}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {orphelines.map((l) => (
              <li key={l.key} className="flex items-center gap-2 text-[13.5px] text-de9-ink">
                <span className="min-w-0 flex-1 break-words">{l.libelle}</span>
                <button
                  type="button"
                  onClick={() => onChange(lignes.filter((x) => x.key !== l.key))}
                  className="flex-none text-[12.5px] font-bold text-de9-red underline underline-offset-2"
                >
                  {L('Retirer', 'إزالة')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2.5 border-t border-de9-line pt-5">
        {libres.map((l) => (
          <div key={l.key} className="flex items-center gap-2">
            <Input
              value={l.libre ?? ''}
              maxLength={120}
              autoFocus={l.libre === ''}
              onChange={(e) => onChange(lignes.map((x) => (x.key === l.key ? { ...x, libre: e.target.value, libelle: e.target.value } : x)))}
              placeholder={L('Ex. Recherche de fuite par caméra', 'مثال: كشف التسرب بالكاميرا')}
              aria-label={L('Prestation libre', 'خدمة حرة')}
            />
            <button
              type="button"
              onClick={() => onChange(lignes.filter((x) => x.key !== l.key))}
              aria-label={L('Retirer la prestation', 'إزالة الخدمة')}
              className="grid size-8 flex-none place-items-center rounded-full text-de9-gray hover:bg-secondary hover:text-de9-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {libres.length < libresMax && (
          <button
            type="button"
            onClick={() => onChange([...lignes, ligneLibre()])}
            className="flex items-center gap-1.5 self-start text-[13.5px] font-bold text-de9-teal-dark hover:underline"
          >
            <Plus className="size-4" />
            {L('Ajouter une prestation libre', 'إضافة خدمة حرة')}
          </button>
        )}
        <p className="text-[12px] text-de9-gray">
          {L(
            `Les prestations libres n'apparaissent pas dans la recherche de l'app. ${libresMax} au plus.`,
            `الخدمات الحرة لا تظهر في بحث التطبيق. ${libresMax} كحد أقصى.`,
          )}
        </p>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- tarifs

const SANS = 'defaut';

/**
 * Step 4 — ONE unit for the whole annonce, a price per line, an optional
 * discount. A line may name another unit, but the order in the app copies its
 * unit from any line: hence the note.
 */
export function EtapeTarifs({
  lignes,
  libelleOf,
  unites,
  uniteDefaut,
  remise,
  onUniteDefaut,
  onRemise,
  onLigne,
}: {
  /** In display order. */
  lignes: Ligne[];
  libelleOf: (ligne: Ligne) => string;
  unites: ReferentielB2c['unites'];
  uniteDefaut: number | null;
  remise: string;
  onUniteDefaut: (unite: number) => void;
  onRemise: (remise: string) => void;
  onLigne: (key: string, patch: Partial<Ligne>) => void;
}) {
  const L = useL();
  // « Unité différente » opened on a row, before a unit is picked in it.
  const [ouvertes, setOuvertes] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-de9-ink">{L('Unité', 'الوحدة')}</span>
        <Select value={uniteDefaut === null ? '' : String(uniteDefaut)} onValueChange={(v) => onUniteDefaut(Number(v))}>
          <SelectTrigger className="h-11 w-full rounded-xl px-3.5 text-[14px]" aria-label={L('Unité', 'الوحدة')}>
            <SelectValue placeholder={L('Choisir une unité', 'اختر وحدة')} />
          </SelectTrigger>
          <SelectContent>
            {unites.map((u) => (
              <SelectItem key={u.code} value={String(u.code)}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[12px] text-de9-gray">{L("Elle s'applique à toutes les lignes de l'annonce.", 'تُطبَّق على كل أسطر الإعلان.')}</p>
      </div>

      {lignes.length === 0 ? (
        <p className="text-[13px] text-de9-gray">
          {L('Revenez à l’étape Services pour choisir ce que vous proposez.', 'ارجع إلى خطوة الخدمات لاختيار ما تقدمه.')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-de9-line">
          {lignes.map((l) => {
            const autre = l.unite !== null || ouvertes.includes(l.key);
            return (
              <li key={l.key} className="flex flex-col gap-2 py-3">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 text-[14px] break-words text-de9-ink">{libelleOf(l)}</span>
                  <Input
                    value={l.prix}
                    onChange={(e) => onLigne(l.key, { prix: e.target.value })}
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="0"
                    aria-label={`${L('Tarif', 'السعر')} — ${libelleOf(l)}`}
                    className="h-10 w-[96px] flex-none text-center"
                  />
                  <span className="flex-none text-[12.5px] font-semibold text-de9-gray">DZD</span>
                </div>
                {autre ? (
                  <div className="flex flex-col gap-1">
                    <Select
                      value={l.unite === null ? SANS : String(l.unite)}
                      onValueChange={(v) => {
                        onLigne(l.key, { unite: v === SANS ? null : Number(v) });
                        if (v === SANS) setOuvertes((list) => list.filter((k) => k !== l.key));
                      }}
                    >
                      <SelectTrigger size="sm" className="self-start" aria-label={L('Unité de la ligne', 'وحدة السطر')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SANS}>{L("L'unité de l'annonce", 'وحدة الإعلان')}</SelectItem>
                        {unites.map((u) => (
                          <SelectItem key={u.code} value={String(u.code)}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11.5px] text-de9-gray">{L("L'unité affichée sur la commande peut différer.", 'قد تختلف الوحدة المعروضة على الطلب.')}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOuvertes((list) => [...list, l.key])}
                    className="self-start text-[12px] font-semibold text-de9-teal-dark hover:underline"
                  >
                    {L('Unité différente', 'وحدة مختلفة')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-de9-ink">{L('Remise (%)', 'التخفيض (%)')}</span>
        <Input
          value={remise}
          onChange={(e) => onRemise(e.target.value)}
          inputMode="numeric"
          dir="ltr"
          placeholder="0"
          aria-label={L('Remise en pourcentage', 'التخفيض بالنسبة المئوية')}
          className="h-10 w-[96px] text-center"
        />
        <p className="text-[12px] text-de9-gray">{L('Facultative, de 0 à 100.', 'اختياري، من 0 إلى 100.')}</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- questionnaire

/** Step 5 — one answer on a single-choice question (pressed again, it is cleared), several on the others. */
export function EtapeQuestionnaire({
  questions,
  reponseIds,
  onChange,
}: {
  questions: CategorieB2c['questions'];
  reponseIds: string[];
  onChange: (reponseIds: string[]) => void;
}) {
  const L = useL();
  const choisies = new Set(reponseIds);

  return (
    <div className="flex flex-col gap-7">
      {questions.map((q) => {
        const siennes = new Set(q.reponses.map((r) => r.id));
        return (
          <div key={q.id} role={q.choixMultiple ? 'group' : 'radiogroup'} aria-label={q.enonce}>
            <h3 className="text-[14px] font-bold text-de9-ink">{L(q.enonce, q.enonceAr ?? q.enonce)}</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {q.reponses.map((r) => {
                const on = choisies.has(r.id);
                const basculer = () =>
                  onChange(
                    on
                      ? reponseIds.filter((id) => id !== r.id)
                      : q.choixMultiple
                        ? [...reponseIds, r.id]
                        : [...reponseIds.filter((id) => !siennes.has(id)), r.id],
                  );
                return (
                  <li key={r.id}>
                    {q.choixMultiple ? (
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox checked={on} onCheckedChange={basculer} className="mt-0.5 size-5 rounded-[6px]" />
                        <span className="text-[14px] text-de9-ink">{L(r.libelle, r.libelleAr ?? r.libelle)}</span>
                      </label>
                    ) : (
                      <button type="button" role="radio" aria-checked={on} onClick={basculer} className="flex items-start gap-3 text-start">
                        <span className={cn('mt-0.5 grid size-5 flex-none place-items-center rounded-full border', on ? 'border-primary' : 'border-input')}>
                          {on && <span className="size-2.5 rounded-full bg-primary" />}
                        </span>
                        <span className="text-[14px] text-de9-ink">{L(r.libelle, r.libelleAr ?? r.libelle)}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------- disponibilité

const JOURS: [string, string][] = [
  ['Dimanche', 'الأحد'],
  ['Lundi', 'الاثنين'],
  ['Mardi', 'الثلاثاء'],
  ['Mercredi', 'الأربعاء'],
  ['Jeudi', 'الخميس'],
  ['Vendredi', 'الجمعة'],
  ['Samedi', 'السبت'],
];
const DEBUTS = Array.from({ length: 24 }, (_, h) => h);

/** Whole hours only — the app's calendar tests the 24 whole hours of a day. */
function Heure({ value, options, label, onChange }: { value: number; options: number[]; label: string; onChange: (h: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger size="sm" className="tabular-nums" dir="ltr" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((h) => (
          <SelectItem key={h} value={String(h)} className="tabular-nums">
            {heure(h)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** The ranges of one day (or of every day, under « 7j/7 »): up to `max`, each on whole hours. */
function Plages({ plages, max, nom, onChange }: { plages: Plage[]; max: number; nom: string; onChange: (plages: Plage[]) => void }) {
  const L = useL();
  const set = (index: number, plage: Plage) => onChange(plages.map((p, i) => (i === index ? plage : p)));
  const dernier = Math.max(...plages.map((p) => p.fin), 0);

  return (
    <div className="mt-2 flex flex-col gap-2">
      {plages.map((p, index) => (
        <div key={index} className="flex items-center gap-2 text-[13px] text-de9-slate">
          <Heure
            value={p.debut}
            options={DEBUTS}
            label={`${L('Début', 'البداية')} — ${nom}`}
            // An end is always after its start.
            onChange={(debut) => set(index, { debut, fin: Math.max(p.fin, debut + 1) })}
          />
          <span aria-hidden>–</span>
          <Heure
            value={p.fin}
            options={DEBUTS.map((h) => h + 1).filter((h) => h > p.debut)}
            label={`${L('Fin', 'النهاية')} — ${nom}`}
            onChange={(fin) => set(index, { ...p, fin })}
          />
          {plages.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(plages.filter((_, i) => i !== index))}
              aria-label={L('Retirer la plage', 'إزالة الفترة')}
              className="grid size-7 flex-none place-items-center rounded-full text-de9-gray hover:bg-secondary hover:text-de9-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ))}
      {plagesInvalides(plages) && (
        <p className="text-[12px] text-de9-red">{L('Ces plages se chevauchent.', 'هذه الفترات متداخلة.')}</p>
      )}
      {plages.length < max && dernier < 24 && (
        <button
          type="button"
          // The next range starts where the day's last one ends.
          onClick={() => onChange([...plages, { debut: Math.min(dernier, 23), fin: Math.min(dernier + 2, 24) }])}
          className="flex items-center gap-1 self-start text-[12.5px] font-bold text-de9-teal-dark hover:underline"
        >
          <Plus className="size-3.5" />
          {L('Ajouter une plage', 'إضافة فترة')}
        </button>
      )}
    </div>
  );
}

/**
 * Step 6 — seven day rows, Sunday first. « 7j/7 » gives the seven days the same
 * ranges; « 24h/24 » makes every available day a full one (00:00 – 23:59). A
 * day switched off has no range.
 */
export function EtapeDisponibilite({ semaine, max, onChange }: { semaine: Semaine; max: number; onChange: (semaine: Semaine) => void }) {
  const L = useL();
  const premier = semaine.find((plages) => plages.length > 0);
  // What the switches say when the step opens: read off the ranges themselves.
  const [toute, setToute] = useState(() => !!premier && semaine.every((plages) => memesPlages(plages, premier)));
  const [jourEntier, setJourEntier] = useState(
    () => !!premier && semaine.every((plages) => plages.length === 0 || memesPlages(plages, [JOURNEE])),
  );
  const parDefaut = jourEntier ? [JOURNEE] : [PLAGE_DEFAUT];

  return (
    <div className="flex flex-col gap-4">
      <label className="flex cursor-pointer items-center gap-3">
        <Switch
          checked={toute}
          onCheckedChange={(on) => {
            setToute(on);
            // The seven days take the ranges of the first available one.
            if (on) onChange(semaine.map(() => premier ?? parDefaut));
          }}
        />
        <span className="text-[14.5px] font-semibold text-de9-ink">{L('Disponible 7j/7', 'متوفر 7/7')}</span>
      </label>
      <label className="flex cursor-pointer items-center gap-3">
        <Switch
          checked={jourEntier}
          onCheckedChange={(on) => {
            setJourEntier(on);
            onChange(semaine.map((plages) => (plages.length === 0 ? plages : on ? [JOURNEE] : [PLAGE_DEFAUT])));
          }}
        />
        <span className="text-[14.5px] font-semibold text-de9-ink">{L('Disponible 24h/24', 'متوفر 24/24')}</span>
      </label>

      {toute ? (
        !jourEntier && (
          <div className="rounded-xl bg-de9-row px-3.5 py-3">
            <p className="text-[14px] font-bold text-de9-ink">{L('Tous les jours', 'كل الأيام')}</p>
            <Plages
              plages={premier ?? parDefaut}
              max={max}
              nom={L('tous les jours', 'كل الأيام')}
              onChange={(plages) => onChange(semaine.map(() => plages))}
            />
          </div>
        )
      ) : (
        <ul className="flex flex-col gap-2">
          {JOURS.map(([fr, ar], jour) => {
            const plages = semaine[jour] ?? [];
            const on = plages.length > 0;
            const set = (next: Plage[]) => onChange(semaine.map((p, i) => (i === jour ? next : p)));
            return (
              <li key={fr} className="rounded-xl bg-de9-row px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-bold text-de9-ink">{L(fr, ar)}</span>
                  <span className="flex items-center gap-2.5">
                    <span className="text-[12px] text-de9-gray">{on ? L('Disponible', 'متوفر') : L('Non disponible', 'غير متوفر')}</span>
                    <Switch checked={on} onCheckedChange={(next) => set(next ? parDefaut : [])} aria-label={L(fr, ar)} />
                  </span>
                </div>
                {on && !jourEntier && <Plages plages={plages} max={max} nom={L(fr, ar)} onChange={set} />}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[12px] text-de9-gray">
        {L("Les créneaux commencent à l'heure pile, comme sur l'app de9de9.", 'تبدأ الفترات عند رأس الساعة، كما في تطبيق de9de9.')}
      </p>
    </div>
  );
}

// --------------------------------------------------------------------- zones

/**
 * Step 7 — the company's ONE list of B2C zones: what is edited here applies to
 * every B2C annonce it has, and decides which consumer posts it sees.
 */
export function EtapeZones({
  zones,
  value,
  modifiees,
  onChange,
}: {
  zones: ZonesB2c;
  value: ZoneInput[];
  /** Edited and not saved yet: the server's counter no longer describes them. */
  modifiees: boolean;
  onChange: (zones: ZoneInput[]) => void;
}) {
  const L = useL();
  return (
    <div className="flex flex-col gap-4">
      <Bandeau ton="attention" texte={zones.note ?? L("Ces zones s'appliquent à toutes vos annonces B2C.", 'تُطبَّق هذه المناطق على كل إعلاناتك B2C.')} />
      {zones.zonesB2b.length > 0 && (
        <button
          type="button"
          onClick={() => onChange(zones.zonesB2b.map((z) => ({ wilayaCode: z.wilayaCode, communeCode: z.communeCode ?? null })))}
          className="self-start text-[13px] font-bold text-de9-teal-dark hover:underline"
        >
          {L('Reprendre mes zones B2B', 'استعمال مناطقي B2B')}
        </button>
      )}
      <ZonesPicker value={value} onChange={onChange} max={zones.max} />
      {!modifiees && zones.communesCouvertes != null && (
        <p className="text-[12.5px] font-semibold text-de9-slate">
          {L(`${zones.communesCouvertes} communes couvertes`, `${zones.communesCouvertes} بلدية مغطاة`)}
        </p>
      )}
      <p className="text-[12px] text-de9-gray">
        {L(
          'Avec vos catégories, ces zones décident aussi des demandes de particuliers que vous voyez dans « Explorer les offres ».',
          'مع فئاتك، تحدد هذه المناطق أيضًا طلبات الأفراد التي تراها في « استكشاف العروض ».',
        )}
      </p>
    </div>
  );
}
