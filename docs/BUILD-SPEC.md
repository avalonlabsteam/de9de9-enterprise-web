# DE9DE9 ENTREPRISE — WEB BUILD SPEC

> Single source of truth for rebuilding the **DE9DE9 Entreprise** app as a React web application.
> **Flows** come from the prototype/Flutter app; **architecture, tooling, and look** are copied verbatim from the admin sibling project (`de9de9-enterprise`).
> Prose in English. **All status names, product labels, and UI copy stay in French (verbatim).** Bilingual FR (primary) / AR (RTL).

---

## 1. Goal & Principles

**Goal.** One React SPA — the "Entreprise" app — that serves **two personas behind a single login**: **Cliente Entreprise** (B2B buyer) and **Prestataire Entreprise** (provider). It reproduces every screen and transition of the prototype/Flutter app, but is engineered and styled **exactly like the admin console**.

**Principles.**
1. **Flows from the prototype, architecture from admin.** Screen inventory, navigation, copy, and modals follow Report A/D. Folder layout, tooling, tokens, and patterns follow Report C. Nothing about the phone-frame prototype survives — this is a responsive web app with an `AppLayout` (sidebar + mobile `Sheet`).
2. **One status, three projections + ball.** A single canonical S/V status model (Report B) is the source of truth. The client, de9de9, and prestataire each see their own **projection label**; the **derived demand badge** is computed from occurrences, never stored. S/V numbers are internal — users see a stepper + action-first one-liner.
3. **Blind assignment invariant.** From `S4/assigne` onward the client never sees provider identity.
4. **No auto-confirm.** The client confirms every visit (`V1→V2`).
5. **KYC gates publishing.** Client must validate RC · NIF · NIS before publishing an appel d'offres.
6. **Credit money model.** `1 DZD = 10 crédits`; debit at approve (V5→V6), payout at settle (V6→V7, 85% pro / 15% de9de9).
7. **Zod is the source of truth** for every type; `apiClient` is the only thing that talks HTTP; the mock adapter is the backend.
8. **Two shells, one layout.** `AppLayout` renders a **role-scoped nav** (Client vs Prestataire) chosen from the auth store — no separate app.
9. **Alignment over legacy.** The Flutter client collapsed the pipeline to 5 flat states. The new app expands the client suivi to the full S1–S4 + V0–V7 model while masking provider identity and hiding S/V numbers.

---

## 2. Tech Stack & Dependencies

Vite + React 19 + TypeScript. Tailwind **v4** (CSS-first, **no `tailwind.config.js`**). Copy `package.json` top matter and deps **verbatim** from admin.

```json
{
  "name": "de9de9-entreprise-web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

**dependencies**

| package | version | package | version |
|---|---|---|---|
| `@fontsource-variable/geist` | ^5.2.9 | `next-themes` | ^0.4.6 |
| `@hookform/resolvers` | ^5.4.0 | `radix-ui` | ^1.6.1 |
| `@tanstack/react-query` | ^5.101.2 | `react` | ^19.2.7 |
| `axios` | ^1.18.1 | `react-dom` | ^19.2.7 |
| `class-variance-authority` | ^0.7.1 | `react-hook-form` | ^7.81.0 |
| `clsx` | ^2.1.1 | `react-router-dom` | ^7.18.1 |
| `lucide-react` | ^1.23.0 | `shadcn` | ^4.13.0 |
| `sonner` | ^2.0.7 | `tailwind-merge` | ^3.6.0 |
| `tw-animate-css` | ^1.4.0 | `zod` | ^4.4.3 |
| `zustand` | ^5.0.14 | | |

**devDependencies:** `@eslint/js`^10.0.1, `@tailwindcss/vite`^4.3.2, `@types/node`^24.13.2, `@types/react`^19.2.17, `@types/react-dom`^19.2.3, `@vitejs/plugin-react`^6.0.3, `eslint`^10.6.0, `eslint-plugin-react-hooks`^7.1.1, `eslint-plugin-react-refresh`^0.5.3, `globals`^17.7.0, `tailwindcss`^4.3.2, `typescript`~6.0.2, `typescript-eslint`^8.62.0, `vite`^8.1.1.

**Config files — reproduce verbatim from admin** (Report C §2): `vite.config.ts` (`@`→`./src` alias, `react()`+`tailwindcss()` plugins), `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`, `components.json` (`"style":"radix-nova"`, `"config":""`, `"rtl":true`, base color `neutral`), `eslint.config.js` (flat; UI files opt out of `only-export-components`), `index.html` (`lang="fr"`; load **Poppins + Noto Sans Arabic** via Google Fonts `<link>`; title `DE9DE9 Entreprise`), `src/main.tsx` (Query + Router providers, `import './index.css'`), `src/lib/utils.ts` (`cn`), `src/lib/queryClient.ts` (staleTime 30 000, gcTime 5 min, retry 1, no refetchOnFocus). Add `public/favicon.svg`.

**Env:** `VITE_API_MOCK` (default mocked unless `'false'`), `VITE_API_URL` (`?? '/api'`).

---

## 3. Project Structure

```
src/
├── index.css                         # tokens, @theme, de9-* utilities, animations, base
├── main.tsx                          # entry (Query + Router providers)
├── api/
│   ├── apiClient.ts                  # single axios instance (+ mock adapter when mocked)
│   └── mock/
│       ├── index.ts                  # barrel: import './handlers'; export mockAdapter
│       ├── router.ts                 # register() + mockAdapter (verbatim from admin)
│       ├── handlers.ts               # all register('METHOD','/path',…) route table
│       └── db.ts                     # in-memory seed singleton + helpers
├── components/
│   ├── ui/                           # shadcn radix-nova (verbatim from admin, +avatar,+radio-group,+accordion,+calendar-ish)
│   ├── layout/
│   │   ├── AppLayout.tsx             # role-scoped shell (sidebar + mobile Sheet)
│   │   ├── ClientNav.tsx             # 5 client nav items
│   │   ├── PrestataireNav.tsx        # 5 prestataire nav items
│   │   ├── RoleBadge.tsx             # CLIENT / PRO pill
│   │   └── overlayHosts.tsx          # SupportHost, WorkerViewHost, DocViewHost (search-param driven)
│   └── common/
│       ├── StatusBadge.tsx           # renders a projection label from statusModel
│       ├── Stepper.tsx               # S/V progress stepper (numbers hidden)
│       ├── EmptyState.tsx
│       ├── PieceSlot.tsx             # file-upload slot (mock)
│       └── CategoryChip.tsx          # de9 category-color chip
├── features/
│   ├── auth/         { api, components, schemas, routes.tsx, stores }
│   ├── onboarding/   { components, routes.tsx }          # signup pro/client + role landing
│   ├── kyc/          { api, components, schemas, routes.tsx }
│   ├── client-catalogue/  { api, components, schemas, routes.tsx, stores }
│   ├── client-tenders/    { api, components, schemas, routes.tsx, stores }  # appels d'offres + suivi
│   ├── client-wallet/     { api, components, schemas, routes.tsx }
│   ├── client-factures/   { api, components, schemas, routes.tsx }
│   ├── client-calendrier/ { api, components, routes.tsx }
│   ├── client-profil/     { components, routes.tsx }
│   ├── prestataire-dashboard/ { api, components, routes.tsx }
│   ├── prestataire-b2c/   { api, components, schemas, routes.tsx, stores }
│   ├── prestataire-b2b/   { api, components, schemas, routes.tsx, stores }
│   ├── prestataire-annonces/ { api, components, schemas, routes.tsx }
│   ├── prestataire-calendar/ { api, components, routes.tsx }
│   ├── prestataire-equipe/   { api, components, schemas, routes.tsx, stores }  # effectif
│   ├── prestataire-profil/   { components, routes.tsx }
│   └── shared-modals/     { components }                 # Support, Affecter, DocView, Upload…
├── lib/
│   ├── utils.ts
│   ├── queryClient.ts
│   ├── statusModel/
│   │   ├── index.ts                  # types, tables, projections, cascade
│   │   ├── setup.ts                  # S1–S4 table
│   │   ├── visite.ts                 # V0–V7 + V5·C + V✕ table
│   │   └── badge.ts                  # derived demand-badge cascade
│   ├── catalogue.ts                  # 16 families + subs (shared const, or via api)
│   ├── categoryColors.ts             # noir/bleu/vert/rouge tokens + helpers
│   └── i18n/ { dict.ts, index.ts }
├── stores/
│   ├── authStore.ts                  # token + user{role:'client'|'prestataire'}
│   ├── langStore.ts                  # fr/ar + dirOf
│   ├── themeStore.ts                 # light/dark/system
│   └── uiStore.ts                    # ephemeral (active shell, support open)
└── routes/
    └── index.tsx                     # createBrowserRouter, AppLayout element, spread feature routes
```

**Slice recipe (every feature identical):** `schemas/<x>.ts` (Zod + `z.infer` types) → `api/<x>.ts` (react-query hooks that `.parse()` responses) → `routes.tsx` (`RouteObject[]` with `lazy()` named-export pages) → `components/*.tsx` (named exports, handle `isPending`/`isError`/success). Feature registers routes only by adding a `register(...)` block in `api/mock/handlers.ts` + optional `db` seed.

---

## 4. Design Tokens & AppLayout

### 4.1 Tokens (`src/index.css`) — reproduce admin exactly

CSS-first Tailwind v4. Order: `@import "tailwindcss"; @import "tw-animate-css"; @import "shadcn/tailwind.css";` → `@custom-variant dark (&:is(.dark *));` → `@theme inline` (fonts + `--color-*: var(--*)` + `--radius-*`) → `:root` / `.dark` value blocks → De9 `@theme inline` + `:root`/`.dark` → `@theme` animations → `@layer base`.

**shadcn base tokens** (light → dark): `--background` `#E7EBEE`→`#151923`; `--foreground` `#232838`→`#E8EBF2`; `--card` `#fff`→`#1E2330`; `--popover` `#fff`→`#1E2330`; `--primary` `#178A82`→`#2AB3A8` (fg `#fff`→`#08211E`); `--secondary` `#F1F4F6`→`#262C3B`; `--muted` `#F1F4F6`→`#262C3B` (fg `#8A94A0`→`#98A1B0`); `--accent` `#F7FBFB`→`#22303A` (fg `#178A82`→`#65CBC4`); `--destructive` `#E7464E`→`#F2646B`; `--border`/`--input` `#E4E9ED`→`#2C3345`; `--ring` `#65CBC4`→`#2AB3A8`; `--chart-1..5` `#65CBC4,#178A82,#232838,#E7464E,#8A94A0` → `#65CBC4,#2AB3A8,#E8EBF2,#F2646B,#98A1B0`; `--radius` `0.8125rem`; `--sidebar*` (8 vars). Radius scale `sm|md|lg|xl|2xl|3xl|4xl` = radius × `.6/.8/1/1.4/1.8/2.2/2.6`.

**Fonts:** `--font-sans: 'Poppins', ui-sans-serif, system-ui, sans-serif`; `--font-heading: var(--font-sans)`; `--font-arabic: 'Noto Sans Arabic', 'Poppins', sans-serif`. `[dir="rtl"] body { font-family: var(--font-arabic) }`.

**De9 brand tokens** (`bg-de9-*` / `text-de9-*` / `border-de9-*`):

| utility | light | dark | | utility | light | dark |
|---|---|---|---|---|---|---|
| `de9-red` | `#E7464E` | `#F2646B` | | `de9-gray` | `#8A94A0` | `#7D8694` |
| `de9-teal` | `#65CBC4` | `#65CBC4` | | `de9-line` | `#E4E9ED` | `#2C3345` |
| `de9-teal-dark` | `#178A82` | `#2AB3A8` | | `de9-bg` | `#E7EBEE` | `#151923` |
| `de9-ink` | `#232838` | `#E8EBF2` | | `de9-row` | `#F7FBFB` | `#222836` |
| `de9-slate` | `#5A6472` | `#A6AEBD` | | `--de9-scrollbar` (raw) | `#C7CFD7` | `#3A4356` |

**Category-color tokens** (Report D §2.1 — add as a third `@theme inline` block so `bg-cat-*` etc. exist): `cat-noir` `#2D3340`/dark `#B6BEC8` (soft `#ECEEF1`), `cat-bleu` `#2F9BE0`/`#5BB6F0` (soft `#EAF2FD`), `cat-vert` `#46B3AA`/`#5FC9C0` (soft `#E5F7F4`), `cat-rouge` `#E7464E`/`#FF6B72` (soft `#FDECEC`). Helper `categoryColors.ts` exposes `accentOn(dark)`, `surfaceOn(dark)`, `onBadgeOn(dark)` (`#11151C` dark / `#FFFFFF` light).

**Animations:** `animate-fade-in`, `animate-slide-up`, `animate-sheet-up`, `animate-pulse-ring` (keyframes `fadeIn`, `slideUp` 14px→0, `sheetUp` 20px+scale.97→1, `pulseRing` expanding red ring).

**Base layer:** `* { @apply border-border outline-ring/50 }`, `body { @apply bg-background text-foreground }`, `html { @apply font-sans }`, RTL font swap, custom scrollbar via `--de9-scrollbar`.

### 4.2 AppLayout — role split (Client vs Prestataire)

`AppLayout` is the single `element` for `/`. It differs from admin only in that the **nav item set is chosen by the logged-in role** (`useAuthStore(s => s.user.role)`), not fixed.

Responsibilities (same as admin): (1) `useEffect` sets `documentElement.dir`/`lang` from `langStore`; (2) `useEffect` applies `.dark` from `themeStore` + `matchMedia` listener via `resolveTheme`; (3) sticky desktop sidebar (`NavLink` list) + mobile `Sheet` nav (side `dir==="rtl" ? "right" : "left"`); (4) top bar with theme-cycle button (`{light:Sun, dark:Moon, system:SunMoon}`) + language toggle (`ع`/`FR`); (5) `RoleBadge` (CLIENT/PRO); (6) `<Outlet/>` in `<main class="mx-auto max-w-[1320px]…">`; (7) global overlay hosts `<SupportHost/> <WorkerViewHost/> <DocViewHost/>` + `<Toaster position="bottom-center"/>`. Brand `Logo` = "Deĝ De9" + "ENTREPRISE", `text-de9-red`/`text-de9-teal` + ink badge. **No mobile phone frame.**

**Client shell nav** (`role==='client'`), `{ to, labelKey }`:

| # | route | labelKey → FR | icon |
|---|---|---|---|
| 1 | `/client` | `navHome` → **Accueil** | Home |
| 2 | `/client/tenders` | `navSuivi` → **Demandes** | ClipboardList |
| 3 | `/client/calendrier` | `navCalendrier` → **Calendrier** | Calendar |
| 4 | `/client/wallet` | `navWallet` → **Crédits** | Wallet |
| 5 | `/client/factures` | `navFactures` → **Factures** | FileText |

`Profil` (`/client/profile`) has **no nav item** — reached via the "EL" avatar in page headers (mirrors prototype).

**Prestataire shell nav** (`role==='prestataire'`):

| # | route | labelKey → FR | icon |
|---|---|---|---|
| 1 | `/prestataire` | `pNavHome` → **Accueil** | Home |
| 2 | `/prestataire/b2c` | `pNavB2c` → **B2C** | Users |
| 3 | `/prestataire/b2b` | `pNavB2b` → **B2B** | Building2 |
| 4 | `/prestataire/calendar` | `pNavCal` → **Calendrier** | Calendar |
| 5 | `/prestataire/profile` | `pNavProfil` → **Profil** | UserCog |

Secondary prestataire pages (`Annonces`, `Effectif`, `Statistiques`, detail screens) are reached from Accueil/Profil, not the nav bar. B2C/B2B pages carry a floating **"+"** create action (teal for B2C, blue for B2B).

---

## 5. The Status Model Module (`lib/statusModel`)

Single canonical S/V model (Report B). Codes stay in **English** (enum values); labels stay in **French**.

### 5.1 Types

```ts
// lib/statusModel/index.ts
export type SetupCode = 'arappeler' | 'contacte' | 'devis' | 'assigne';
export type VisiteCode =
  | 'added' | 'toConfirm' | 'confirmed' | 'confirmedAssigned'
  | 'doneNoInvoice' | 'doneInvoiced' | 'doneDisputed'
  | 'doneApproved' | 'paid' | 'cancelled';
export type StatusCode = SetupCode | VisiteCode;

export type Ball = 'client' | 'de9' | 'pro' | 'done';
export type Projection = 'client' | 'de9' | 'pro';
export type Level = 'S' | 'V';

export interface StatusDef {
  code: StatusCode;
  level: Level;
  num: string;                 // 'S1'…'S4', 'V0'…'V7', 'V5·C', 'V✕' (admin-only aid)
  fr: string;                  // canonical FR statut name
  labels: Record<Projection, string | null>;   // three projections; null = not shown
  ball: Ball | null;
  action: string | null;       // action that advances it
  next: StatusCode[];          // reachable transitions
  actor: Ball | null;          // who performs the advancing action
}

// occurrence + demand shapes used across features
export interface Occurrence {
  id: string;
  date: string;                // ISO or 'dd/mm/yyyy'
  status: VisiteCode;
  montant?: number;            // DZD
  motif?: string;              // dispute reason
}
export interface DemandStatusInput {
  setup: SetupCode | null;     // null once occurrences exist
  occurrences: Occurrence[];
  type: 'ponctuel' | 'recurrent';
}
```

### 5.2 Setup transition table (`setup.ts`)

| num | code | fr (statut) | client | de9de9 | prestataire | ball | action → next |
|---|---|---|---|---|---|---|---|
| S1 | `arappeler` | En attente | En attente | À rappeler | — | de9 | Appeler le client → `contacte` |
| S2 | `contacte` | Contacté | Contacté | Devis à demander | — | de9 | Demander les devis → `devis` |
| S3 | `devis` | Devis en cours | Devis en cours | En attente des devis | Devis à envoyer | pro | (devis validés) → `assigne` |
| S4 | `assigne` | Assigné | Assigné | Devis transmis (attente choix) | Devis envoyé | client | Choisir le prestataire → crée `toConfirm` (V1) |

### 5.3 Visite transition table (`visite.ts`)

| num | code | fr (statut) | client | de9de9 | prestataire | ball | action → next |
|---|---|---|---|---|---|---|---|
| V0 | `added` | À planifier | Visite à planifier | Occurrence à planifier | — | de9 | Planifier l'occurrence → `toConfirm` |
| V1 | `toConfirm` | À venir — à confirmer | Prochaine visite à confirmer : [date] | En attente du client | En attente de confirmation client | client | Confirmer la visite → `confirmed` |
| V2 | `confirmed` | Confirmée — visite prévue | Prochaine visite : [date] | Suivi de la visite | Visite à venir — affecter | pro | Affecter un ou plusieurs ouvriers → `confirmedAssigned` |
| V3 | `confirmedAssigned` | Ouvrier affecté | Prochaine visite : [date] | Visite à marquer réalisée | Ouvrier(s) affecté(s) · visite à venir | de9 | Marquer la visite réalisée → `doneNoInvoice` |
| V4 | `doneNoInvoice` | Réalisée — sans facture | En attente de la facture | Suivi de la facture | Facture à déposer | pro | Déposer la facture → `doneInvoiced` |
| V5 | `doneInvoiced` | Facture déposée — à approuver | Facture à approuver | En attente du client | En attente d'approbation | client | Approuver la facture → `doneApproved` |
| V5·C | `doneDisputed` | Facture contestée | Facture contestée | Litige à résoudre | Facture contestée | de9 | Résoudre → `doneInvoiced` |
| V6 | `doneApproved` | Approuvée — à régler | Terminé | Facture à régler | Paiement en attente | de9 | Régler (pro + prestataire) → `paid` |
| V7 | `paid` | Payée — Terminé | Terminé | Terminé | Payé · Transféré | done | (terminal) |
| V✕ | `cancelled` | Annulée | Annulée | — | — | null | (terminal) |

**Branch rules:** `added` (V0) precedes V1 only for ad-hoc client-added occurrences; normal recurring visits start at V1. `doneDisputed` (V5·C) is a detour from V5 — payment frozen, returns to `doneInvoiced` on resolution. `cancelled` (V✕) reachable from V0–V3 only. Multi-worker: occurrence becomes V3 as soon as ≥1 worker assigned (not a new status); editable until V4 lock.

**Transition edges** (`from → to`, actor): `arappeler→contacte` (de9); `contacte→devis` (de9); `devis→assigne` (pro/de9 validates); `assigne→toConfirm` (client, creates occ); `added→toConfirm` (de9); `toConfirm→confirmed` (client); `confirmed→confirmedAssigned` (pro); `confirmedAssigned→doneNoInvoice` (de9); `doneNoInvoice→doneInvoiced` (pro); `doneInvoiced→doneApproved` (client); `doneInvoiced→doneDisputed` (client); `doneDisputed→doneInvoiced` (de9); `doneApproved→paid` (de9); `{toConfirm,confirmed,confirmedAssigned}→cancelled`. Admin override: any transition can be performed by de9de9 on behalf of a role (audit: « fait par de9de9 pour le compte de [rôle] »).

### 5.4 Derived demand-badge cascade (`badge.ts`)

```ts
export function computeDemandBadge(d: DemandStatusInput): { fr: string; kind: BadgeKind };
```

Not stored — computed from occurrences by **urgency** (action before info), which deliberately differs from progression order (V5 outranks V1):

| priority | badge (client FR) | derived from | kind |
|---|---|---|---|
| 1 | Facture à approuver | any `doneInvoiced` (V5) | `action` |
| 2 | Prochaine visite à confirmer : [date] | nearest `toConfirm` (V1) | `action` |
| 3 | En attente de la facture | any `doneNoInvoice` (V4) | `wait` |
| 4 | Facture contestée | any `doneDisputed` (V5·C) | `wait` |
| 5 | Visite à planifier | any `added` (V0) | `setup` |
| 6 | Terminé | all `paid`/`cancelled` | `done` |
| info | Prochaine visite : [date] | `confirmed`/`confirmedAssigned` (V2/V3) when nothing above | `info` |
| setup | En attente / Contacté / Devis en cours / Assigné | `setup` code, no occurrences yet | `setup` |

`suiviFilter` maps `BadgeKind` → chips: `all`, `action`, `wait`, `setup`, `done`, `cancelled`. **Rule: keep number (progression) and cascade (urgency) as separate concepts in code.** `Stepper` renders progress (Confirmée → Réalisée → Facturée → Payé) and an action-first one-liner (« À vous : … » / « En attente : … »); **never render S/V numbers to client/prestataire.**

---

## 6. Routing Map

`routes/index.tsx` → `createBrowserRouter`. Public/auth routes are **outside** `AppLayout`; shell routes are children of `AppLayout`. All pages `lazy()` code-split named exports. A `requireAuth` + `requireRole` guard (reads `authStore`) protects shell routes; unauth → `/login`, wrong role → its own home.

### 6.1 Public / Auth

| path | feature | component |
|---|---|---|
| `/login` | auth | `LoginPage` |
| `/role` | onboarding | `RoleChoosePage` (S'identifier en tant que) |
| `/signup` | onboarding | `ProSignupPage` (Créer une entreprise) |
| `/signup/client` | onboarding | `ClientSignupPage` (Créer un compte client) |
| `/onboarding/kyc` | kyc | `ProKycPage` (pro KYC) |
| `/onboarding/kyc/success` | kyc | `ProKycSuccessPage` |

Landing after `/role` (`pickRole` + `authMode`): signup→cliente→`/signup/client`; signup→prestataire→`/signup`; login→cliente→`/client`; login→prestataire→`/prestataire`.

### 6.2 Client shell (`AppLayout`, role `client`)

| path | feature | component |
|---|---|---|
| `/client` | client-catalogue | `CataloguePage` (Que recherchez-vous ?) |
| `/client/family/:id` | client-catalogue | `FamilyDetailPage` |
| `/client/kyc` | kyc | `ClientKycPage` |
| `/client/kyc/success` | kyc | `ClientKycSuccessPage` |
| `/client/publish/:familyId` | client-tenders | `PublishTenderPage` (Appel d'offres) |
| `/client/publish/:familyId/confirm` | client-tenders | `TenderConfirmPage` (Appel d'offres envoyé !) |
| `/client/tenders` | client-tenders | `MyTendersPage` (Mes appels d'offres) |
| `/client/tender/:id` | client-tenders | `TenderDetailPage` (suivi detail) |
| `/client/calendrier` | client-calendrier | `ClientCalendrierPage` |
| `/client/wallet` | client-wallet | `WalletPage` (Portefeuille) |
| `/client/factures` | client-factures | `FacturesPage` (Factures) |
| `/client/profile` | client-profil | `ClientProfilePage` |

### 6.3 Prestataire shell (`AppLayout`, role `prestataire`)

| path | feature | component |
|---|---|---|
| `/prestataire` | prestataire-dashboard | `DashboardPage` (Tableau de bord) |
| `/prestataire/b2c` | prestataire-b2c | `B2cPage` |
| `/prestataire/b2b` | prestataire-b2b | `B2bPage` |
| `/prestataire/b2b/:id` | prestataire-b2b | `B2bDetailPage` (Détail de la mission) |
| `/prestataire/calendar` | prestataire-calendar | `CalendarPage` |
| `/prestataire/annonces` | prestataire-annonces | `AnnoncesPage` |
| `/prestataire/annonce/create` | prestataire-annonces | `CreateAnnoncePage` (`?type=b2c\|b2b`) |
| `/prestataire/annonce/assign` | prestataire-annonces | `AssignAnnoncePage` |
| `/prestataire/effectif` | prestataire-equipe | `EffectifPage` (Mon effectif) |
| `/prestataire/effectif/:id` | prestataire-equipe | `ProDetailPage` (Gestion du professionnel) |
| `/prestataire/worker/:id` | prestataire-equipe | `WorkerProfilePage` |
| `/prestataire/agrandir` | prestataire-equipe | `AgrandirPage` |
| `/prestataire/stats` | prestataire-dashboard | `StatsPage` (Statistiques) |
| `/prestataire/profile` | prestataire-profil | `PrestataireProfilePage` |

Root: `index` → `Navigate` to `/login` if unauth, else role home; `*` → role home.

---

## 7. Feature-by-Feature Build Plan

For every feature: **Screens → Routes → FR copy → Flow transitions (status model) → Zod schemas → react-query hooks + mock endpoints → modals/sheets.**

### 7.1 `auth`

- **Screens/routes:** `LoginPage` (`/login`).
- **FR copy:** header "Se connecter"; fields **"Adresse e-mail"** (prefill `contact@plombex.dz`), **"Password"** (prefill `123456789`, eye toggle), link **"Mot de passe oublié ?"**, checkbox **"Rester connecté"**, CTA **"Se connecter"**, Google/Apple social (inert), footer "Pas encore membre? **Créer un compte**".
- **Flow:** "Se connecter" (authMode `login`) → `/role`; "Créer un compte" (authMode `signup`) → `/role`. On successful role pick, `authActions.login(token, {role})` and navigate to shell home.
- **Zod:** `loginSchema = { email: z.string().email(), password: z.string().min(1), remember: z.boolean().optional() }`.
- **Hooks/mock:** `useLogin()` → `POST /auth/login` → `{ token, user{ id,name,role } }`. Mock accepts any credentials, echoes role chosen at `/role` (store `pendingAuthMode`/`pendingRole` in `auth` store or query params).
- **Modals:** none.

### 7.2 `onboarding`

- **Screens/routes:** `RoleChoosePage` (`/role`), `ProSignupPage` (`/signup`), `ClientSignupPage` (`/signup/client`).
- **RoleChoose FR:** header **"S'identifier en tant que"**, cards **"Client"** (`cliente`) / **"Professionnel"** (`prestataire`), back → previous.
- **ProSignup FR:** header **"Créer une entreprise"**; note "Un compte client est créé automatiquement avec votre compte professionnel."; fields **Nom** (Mansouri), **Prénom** (Nadir), **Nom de l'entreprise** (PlombEx), **Registre de commerce** (16/00-1234567 B 24), **Email**, **Mot de passe**; **"Nombre de comptes professionnels désiré"** options `3 / 4 / 5 / 6+`; CTA **"Créer mon entreprise"** → `/prestataire`; footer "En continuant vous acceptez les conditions d'utilisation".
- **ClientSignup FR:** header **"Créer un compte client"**; "Espace acheteur B2B — hôtels, entreprises et grands comptes."; fields Nom (Khelifi), Prénom (Amel), Nom de l'entreprise (Hôtel El Aurassi), Registre de commerce (RC), Numéro de téléphone, Email, Mot de passe; CTA **"Créer mon compte"** → `/client/kyc`.
- **Flow:** sets `authStore.user.role`; pro→dashboard, client→client KYC.
- **Zod:** `proSignupSchema` (nom, prenom, entreprise, rc, email, password, desiredAccounts: z.enum(['3','4','5','6+'])), `clientSignupSchema` (nom, prenom, entreprise, rc, phone, email, password).
- **Hooks/mock:** `useProSignup` → `POST /auth/signup/pro`; `useClientSignup` → `POST /auth/signup/client`.

### 7.3 `kyc`

- **Screens/routes:** `ProKycPage` (`/onboarding/kyc`), `ProKycSuccessPage` (`/onboarding/kyc/success`), `ClientKycPage` (`/client/kyc`), `ClientKycSuccessPage` (`/client/kyc/success`).
- **Pro KYC FR:** header **"Vérifier mon entreprise"**; "La vérification KYC débloque la publication d'annonces et la création de comptes professionnels."; docs each with **"Importer"**: **"Registre de commerce (RC)"** / "PDF ou photo", **"NIF"** / "Numéro d'identification fiscale", **"NIS"** / "Numéro d'identification statistique"; CTA **"Soumettre la vérification"** → success. Success: **"Demande envoyée !"** / "Votre dossier KYC est en cours de revue…" CTA **"Aller au tableau de bord"** → `/prestataire`.
- **Client KYC FR:** header **"Vérifier mon entreprise"**; "Importez RC · NIF · NIS pour débloquer la publication."; same 3 docs; CTA **"Soumettre la vérification"** → sets `kycValidated=true` → success. Success: **"Entreprise vérifiée !"** / "Vous pouvez maintenant publier vos appels d'offres." CTA **"Parcourir le catalogue"** → `/client`.
- **Flow:** client KYC **gates S1** (publishing). `kycValidated` lives in kyc store (persisted) or server (`GET /kyc/client`). `submitKyc` forces validated. Note the prototype/Flutter start un-validated so the lock is visible.
- **Zod:** `kycSubmitSchema = { rc: pieceFile.nullable(), nif: pieceFile.nullable(), nis: pieceFile.nullable() }` where `pieceFile = z.object({ name: z.string() })`.
- **Hooks/mock:** `useKyc(key)` → `GET /kyc/:key` (`client` | `pres:<id>`); `useSubmitKyc` → `POST /kyc/:key` → `{ validated:true }`; `useUploadKycDoc` → `POST /kyc/:key/docs`; `DELETE /kyc/:key/docs/:docId`.
- **Modals:** none (inline `PieceSlot` uploaders).

### 7.4 `client-catalogue`

- **Screens/routes:** `CataloguePage` (`/client`), `FamilyDetailPage` (`/client/family/:id`).
- **Catalogue FR:** header logo + tag **"CLIENT"**, language pill (🌐 العربية / 🌐 Français), support icon → Support sheet, avatar "EL" → `/client/profile`; title **"Que recherchez-vous ?"**, sub **"16 familles de services B2B"**; search placeholder "Rechercher un service…". Query → dropdown of family/sub matches with kind badges **"Catégorie"** / **"Service"**; no results → **"Aucun résultat"** + **"Je cherche autre chose"** → Support. Browse mode: if `!kycValidated` amber banner **"Vérification requise"** / "Validez RC · NIF · NIS pour publier un appel d'offres." + **"Compléter la vérification"** → `/client/kyc`; else green badge **"Entreprise vérifiée"**. **"Top catégories du mois"** (families 6,9,7,4), **"Toutes les catégories"** (16-grid), **"Je cherche autre chose"** card (**"WhatsApp"** + **"Appeler"** → Support).
- **FamilyDetail FR:** family header (icon, category label, **"Sélectionnez un ou plusieurs services"**); multi-select sub rows; sticky CTA **"Publier un appel d'offres"** (+count). `goPublish`: no subs → return; `!kycValidated` → `/client/kyc`; else → `/client/publish/:familyId`.
- **Flow:** publishing gated by `kycValidated`. Catalogue is static reference data.
- **Zod:** `familySchema = { id, colorKey: z.enum(['noir','bleu','vert','rouge']), icon, name:{fr,ar}, subs: [{ id, name:{fr,ar} }] }`; selection state in `catalogueStore` (`selectedFamily`, `selectedSubs`, `catSearch`).
- **Hooks/mock:** `useFamilies()` → `GET /catalogue` (16 families, §8); `useFamily(id)` → `GET /catalogue/:id`. Search is client-side.
- **Modals:** Support sheet (shared).

### 7.5 `client-tenders` (Appels d'offres + Suivi)

- **Screens/routes:** `PublishTenderPage` (`/client/publish/:familyId`), `TenderConfirmPage` (`.../confirm`), `MyTendersPage` (`/client/tenders`), `TenderDetailPage` (`/client/tender/:id`).
- **Publish FR:** header **"Appel d'offres"**; fields **"Famille & catégorie"** (chips), **"Description détaillée du besoin"**, **"Wilaya / lieu d'exécution"**, **"Délai souhaité"**, **"Budget estimatif (optionnel)"**, **"Type de besoin"** → **"Ponctuel"** / **"Contrat récurrent"**; if récurrent **"Fréquence"** chips **Hebdomadaire / Mensuel / Trimestriel / Annuel**; **"Documents joints"**, **"Critères de sélection prioritaires"**; CTA **"Envoyer l'appel d'offres"** → confirm. Confirm FR: badge **"En attente"**, **"Appel d'offres envoyé !"** / "Merci, nous vous contacterons sous 1 à 2h maximum." CTA **"Suivre ma demande"** → `/client/tenders`.
- **MyTenders FR:** header avatar + support; **"Suivez l'avancement de vos demandes"**; filter chips (`{label} · {count}`): **"Tous"**, **"Action requise"**, **"Facture en attente"**, **"En préparation"**, **"Terminées"**, **"Annulées"**; cards with derived badge (`computeDemandBadge`); empty **"Aucune demande dans cette catégorie."**
- **TenderDetail FR:** header card (cat, wilaya, date, derived badge). Setup timeline **"En attente" → "Devis en cours" → "Assigné"** when not active; assigned line "✓ Prestataire assigné" (provider card, **identity blind-masked**) when active. **"Prochaine action"** card per status: `attente`→"Demande reçue"; `devis`→"Devis en cours"; `assigne`→"Propositions reçues"; `encours`→"Prestation en cours"; `confirme`→"Prestation confirmée"; `termine`→"Prestation terminée"; `annule`→"Demande annulée". Early actions (attente|devis): **"Modifier la demande"** → publish, **"Contacter le support"** → Support, **"Annuler la demande"** → Cancel modal. Provider selection (assigne): proposals list, **"Montant du devis"** / **"Délai proposé"**, **"Voir le devis"** → DocView; CTA **"Confirmer le prestataire"** → sets → `encours` (`S4→V1`). Recurrence (recurrent & active): **"Récurrence"**, layout toggle timeline/sections (**"Dernier service"**, **"Prochain service"**, **"Historique"**), per-occurrence controls: **"Confirmer la visite"** (`V1→V2`), **"Reprogrammer"**, **"Annuler"**, facture card **"Voir / Télécharger la facture"** + **"Approuver"** (`V5→V6`) / **"Contester"** (`V5→V5·C`), review CTA **"Laisser un avis"**, **"+ Ajouter une récurrence"** (`V0`). Ponctuel facture (termine): approve/contest/review. **"Voir les factures"** (termine & recurrent) → `/client/factures`.
- **Flow (status model §5):** publish → `arappeler` (S1). `confirmProvider` → occurrences at `toConfirm` (V1). `confirmOcc` V1→V2. Approve V5→V6, Contest V5→V5·C. Add/reschedule/cancel occurrence. Badge derived by cascade.
- **Zod:** `tenderPublishSchema = { familyId, serviceName, description, wilaya: z.enum(WILAYAS), delai: z.enum(DELAIS), budgetDzd: z.number().optional(), type: z.enum(['ponctuel','recurrent']), recurrence: z.enum(RECURRENCES).optional(), critere: z.string().optional(), attachments: pieceFile.array() }`. `tenderSchema` (id, familyId, serviceName, description, wilaya, delai, type, recurrence?, budgetDzd?, setup: SetupCode|null, occurrences: Occurrence[], prov?, proposals?, createdAt). `proposalSchema`, `reviewInputSchema`, `contestInputSchema` (`motif: z.enum(['Montant incorrect','Prestation non conforme','Prestation non réalisée']), proof: pieceFile.nullable()`), `addOccSchema` (date), `cancelSchema`.
- **Hooks/mock:** `useTenders(filter)` → `GET /tenders`; `useTender(id)` → `GET /tenders/:id`; `usePublishTender` → `POST /tenders`; `useTenderAction` → `POST /tenders/:id/actions` (`chooseProvider`, `confirmOcc`, `approveOcc`, `contestOcc`, `addOcc`, `rescheduleOcc`, `cancelOcc`, `cancelDemand`); `useReview` → `POST /tenders/:id/reviews`. Handlers `safeParse` input, mutate `db`, recompute badge server-side (or client-side via `statusModel`).
- **Modals/sheets:** DocView (devis/facture viewer), Approve, Contest (sheet), Add/Reschedule récurrence (sheet), Cancel demand, Client review (sheet), Support.

### 7.6 `client-wallet` (Portefeuille)

- **Screens/routes:** `WalletPage` (`/client/wallet`).
- **FR:** header avatar + support; balance card **"Solde actuel"**, value in **crédits**, "≈ … DZD · 1 DZD = 10 crédits"; negative-balance warning; abonnement card **"Abonnement annuel"** + body + "480 000 crédits / an" + **"Choisir l'abonnement"** (inert / "coming soon"); note that recharges are manual (no in-app payment); **"Mouvements"** — ledger (Rechargement / Facture deductions).
- **Flow:** read-only, admin-fed. Debits linked to approved invoices (`invoiceId`). Negative allowed, never hard-blocks.
- **Zod:** `walletSchema = { balanceCredits, subscriptionActive: boolean, history: walletTxSchema.array() }`; `walletTxSchema = { id, type: z.enum(['recharge','deduction']), amountCredits, label, date, invoiceId: z.string().optional() }`.
- **Hooks/mock:** `useWallet()` → `GET /wallet`. Seed §8.

### 7.7 `client-factures` (Factures)

- **Screens/routes:** `FacturesPage` (`/client/factures`).
- **FR:** header avatar + support; hint; filter pills + counts: **"Toutes"**, **"En attente"**, **"Approuvées"**, **"Contestées"**; cards → DocView; status badge (**"En attente de confirmation"** / **"Approuvée"** / **"Contestée"**), credits badge "↓ −{credits} crédits", "⟳ {occ}"; empty state.
- **Flow:** filter derives from occurrence facture status (V5/V5·C/V6). `amountCredits = amountDzd × 10`.
- **Zod:** `invoiceSchema = { id, tenderId, label, amountDzd, issuedAt, occurrenceLabel: z.string().optional(), status: z.enum(['waiting','approved','contested']) }`.
- **Hooks/mock:** `useFactures(filter)` → `GET /factures`. Server derives factures from tenders (`facturesFromCommandes` analogue). Seed §8.
- **Modals:** DocView (with Approve/Contest when waiting).

### 7.8 `client-calendrier`

- **Screens/routes:** `ClientCalendrierPage` (`/client/calendrier`).
- **FR:** **"Calendrier"**, month label, avatar; **"Vos prestations confirmées"**; date strip; agenda cards → `/client/tender/:id`; badge **"Confirmé"**; empty state.
- **Flow:** shows confirmed occurrences (`confirmed`/`confirmedAssigned`). Derived from tenders' occurrences.
- **Hooks/mock:** `useClientCalendar()` → `GET /client/calendar` (or derive client-side from `useTenders`).

### 7.9 `client-profil`

- **Screens/routes:** `ClientProfilePage` (`/client/profile`).
- **FR:** company card "Hôtel El Aurassi", "Cliente Entreprise · Alger"; support banner **"Support & contact"** / "0560 00 00 00 · 7j/7" → Support; rows (toggle lang): "Informations de l'entreprise", "Vérification KYC" (badge ✓ if validated), "Abonnement & crédits", "Support & contact", "Langue", "Notifications"; **"Se déconnecter"** → `authActions.logout()` → `/login`.
- **Hooks:** reads kyc/lang/theme stores.

### 7.10 `prestataire-dashboard`

- **Screens/routes:** `DashboardPage` (`/prestataire`), `StatsPage` (`/prestataire/stats`).
- **Dashboard FR:** header logo + **"Vérifier mon entreprise"** pill → `/onboarding/kyc`; bell (inert); company card "PlombEx" (verified badge); stat trio **"À venir" 9**, **"En cours" 3**, **"Complétés" 512**; **"Créer une annonce"** → create-pick sheet; **"Mes annonces"** + **"Tout voir"** → `/prestataire/annonces`; **"Mon équipe" 3/5** → `/prestataire/effectif`; **"Chiffre d'affaire" 152 000 DA** → `/prestataire/stats`.
- **Stats FR:** gradient CA card "152 000 DA · ▲ +12% ce mois"; **"Voir par employé"** → effectif; **"CA par catégorie"**, **"CA par service"** bar lists; KPIs Revenue 312 000 DZD, Missions 48, Rating 4.8/5, Win-rate 62% (Report D §3.9).
- **Hooks/mock:** `useDashboard()` → `GET /prestataire/dashboard`; `useStats()` → `GET /prestataire/stats`. Monthly revenue ratios Jan .4 / Fév .55 / Mar .5 / Avr .7 / Mai .85 / Juin .95.
- **Modals:** create-pick sheet (**"Type d'annonce"** / "Pour quel espace…" → **"Annonce B2C"** / **"Annonce B2B"** → CreateAnnonce).

### 7.11 `prestataire-b2c`

- **Screens/routes:** `B2cPage` (`/prestataire/b2c`).
- **FR:** header **"B2C · Particuliers"** / "Clients particuliers — le de9de9 normal"; 3 tabs: **"Commandes reçues"** (cards → **"Voir les détails"** → Affecter sheet; empty "Aucune commande reçue"), **"Explorer les offres"** (sub-pills **"Voir les offres"** [search, **"Categories :"** chips Nettoyage/Plomberie/Climatisation/Gardiennage, **"Zones :"** chips Alger/Oran/Blida, cards **"Postuler"** → Postuler sheet] / **"Offres envoyées"** [status badges **"En attente"** / **"Retenue"** / **"Refusée"**]), **"Services confirmés"** (cards **"Affecté à"** worker chips → `/prestataire/worker/:id`, **"Modifier l'affectation"** → Affecter). FAB "+" (teal) → CreateAnnonce B2C.
- **Flow (status model §4.3):** `recue` ≈ V1; Affecter → `confirmee` ≈ V2/V3 (moves recue→confirmées). Bid → SentOffer `enAttente`; won bid surfaces as `Reservation(fromWonBid:true, confirmee)`. `retenue`/`refusee` admin-driven (display-only).
- **Zod:** `reservationSchema = { id, clientName, serviceName, dateLabel, wilaya, status: z.enum(['recue','confirmee']), priceDzd?, assignedWorkerId?, fromWonBid }`; `openOfferSchema`, `sentOfferSchema` (status `enAttente|retenue|refusee`); `bidSchema = { prixDzd, delai, message }`; `affecterSchema = { workerIds: z.string().array().min(1) }`.
- **Hooks/mock:** `useReservations()`, `useOpenOffers()`, `useSentOffers()` → `GET /b2c/*`; `useSubmitBid` → `POST /b2c/bids`; `useAffecterB2c` → `POST /b2c/reservations/:id/affect`. Seed §8.
- **Modals:** Affecter sheet (multi-worker, conflict detection → Conflit modal), Postuler/Envoyer une offre sheet.

### 7.12 `prestataire-b2b`

- **Screens/routes:** `B2bPage` (`/prestataire/b2b`), `B2bDetailPage` (`/prestataire/b2b/:id`).
- **B2b FR:** header **"B2B · Entreprises"** / "Missions assignées par de9de9 (clients entreprises)"; filter chips **"Toutes"**, **"Action requise"**, **"En attente"**, **"Terminées"**; cards (client + lead badge, service, occurrence, occ-state badge, facture badge) → detail; empty "Aucune mission dans cette catégorie". FAB "+" (blue) → CreateAnnonce B2B.
- **B2bDetail FR:** header card (client, service, occurrence, facture badge, **"Contacter de9de9"** → Support); **"Affecté à"** worker chips; progress frise **"Confirmée" / "Réalisée" / "Facturée" / "Payé"**, lead badge (**"À vous" / "En attente" / "Terminé" / "Annulée"**); primary button by status: `confirmee`→**"Affecter un ouvrier"**, `realisee`→**"Téléverser la facture"**, `contestee`→**"Re-téléverser la facture corrigée"**; secondaries **"Voir le détail"**, **"Contacter de9de9"**, **"Changer l'ouvrier"**, **"Voir la facture"**, **"Re-téléverser (corriger)"**, **"Voir le motif"**; **"Détails de l'occurrence"** (Adresse, Date / heure, Fréquence, Instructions); **"Historique des occurrences"**.
- **Occ-state labels:** avenir→"À venir", confirmee→"Confirmée", affecte→"Ouvrier affecté", realisee→"Réalisée", deposee→"En attente d'approbation", contestee→"Facture contestée", approuvee→"Approuvée", payee→"Terminée", annulee→"Annulée". Facture badges: "Aucune facture" / "Facture déposée" / "Facture contestée" / "Facture approuvée" / "Payée".
- **Flow (status model):** Affecter at V2 (`confirmed→confirmedAssigned`); upload facture at V4 (`doneNoInvoice→doneInvoiced`). Facture: none=V4, envoyee=V5, contestee=V5·C, approuvee=V6, payee=V7.
- **Zod:** `b2bJobSchema = { id, clientEntreprise, serviceName, occurrenceLabel, dateLabel, assignedWorkerId?, factureStatus: z.enum(['none','envoyee','recue','approuvee','contestee']), factureAmountDzd?, status: VisiteCode, addr?, freq?, instr?, history? }`; `b2bUploadSchema = { montant: z.number(), occRef: z.string(), file: pieceFile }`.
- **Hooks/mock:** `useB2bJobs(filter)` → `GET /b2b`; `useB2bJob(id)` → `GET /b2b/:id`; `useB2bAction` → `POST /b2b/:id/actions` (affect, upload, changer). Seed §8.
- **Modals:** Affecter sheet (multi-worker), B2B upload sheet (stages idle→selected→uploading→success, sets factureStatus=envoyee, status=deposee/V5), Support.

### 7.13 `prestataire-annonces`

- **Screens/routes:** `AnnoncesPage` (`/prestataire/annonces`), `CreateAnnoncePage` (`/prestataire/annonce/create?type=b2c|b2b`), `AssignAnnoncePage` (`/prestataire/annonce/assign`).
- **Annonces FR:** header **"Annonces"**; tabs **"Mes annonces"** (**"+ Créer une annonce"** → create; cards **"Modifier"** / **"Supprimer"** inert) and **"Missions des pros"** ("Missions assignées à chaque salarié par de9de9"; accordion rows → **"Missions à venir"** / **"Missions passées"**, tags "À venir"/"Terminé", B2C/B2B chips; empty "Aucune mission assignée").
- **CreateAnnonce FR:** title **"Créer une annonce B2C"** / **"Créer une annonce B2B"**. B2C: photo uploader, **"Titre de l'annonce"**, **"Catégorie"** chips (❄️ Climatisation / 🚿 Plomberie / ⚡ Électricité), **"Description"**, **"Services & tarifs"** + **"+ Ajouter un service"**. B2B: purple note "Annonce destinée aux clients entreprises (B2B) routés par de9de9."; **"Titre de l'offre"**, **"Familles & catégories"** chips, **"Wilayas / zone de couverture"** chips, **"Capacité / volume traitable"**, **"Certifications & agréments"**, **"Mode de tarification"** (Sur devis / Sur demande), **"Références"**. **"Affecter à un professionnel"** row → assign; summary "Optionnel · annonce au nom de la société" or "{n} professionnel(s) sélectionné(s)". CTA **"Publier l'annonce"** → created modal.
- **AssignAnnonce FR:** header **"Affecter l'annonce"**; "Sélectionnez le ou les professionnels qui auront cette annonce."; checkbox list; **"Valider ({count})"** → back keeping selection.
- **Zod:** `annonceSchema = { id, title, serviceName, type: z.enum(['b2c','b2b']), active }`; `createAnnonceSchema` (B2C/B2B discriminated union), `assignSchema = { proIds: z.string().array() }`.
- **Hooks/mock:** `useAnnonces()` → `GET /annonces`; `useCreateAnnonce` → `POST /annonces`; `useProsWithJobs()` → `GET /annonces/pros`. Seed §8.
- **Modals:** created modal ("Annonce publiée !" → **"Voir mes annonces"** → annonces).

### 7.14 `prestataire-calendar`

- **Screens/routes:** `CalendarPage` (`/prestataire/calendar`).
- **FR:** header **"Calendrier"** / "Avril 2025"; week strip; source pills **"Tous" / "B2C" / "B2B"**; employee filter chips (Tous, Samir, Karim, Yacine); timeline slots filtered by source, worker color tags.
- **Zod:** `calendarEventSchema = { id, title, start (ISO), wilaya, source: z.enum(['b2c','b2b']), assignedWorkerId? }`.
- **Hooks/mock:** `useCalendar()` → `GET /prestataire/calendar`. Seed §8 (25–26 June 2026 events).

### 7.15 `prestataire-equipe` (Effectif)

- **Screens/routes:** `EffectifPage` (`/prestataire/effectif`), `ProDetailPage` (`/prestataire/effectif/:id`), `WorkerProfilePage` (`/prestataire/worker/:id`), `AgrandirPage` (`/prestataire/agrandir`).
- **Effectif FR:** header **"Mon effectif"**; card **"Slots utilisés" {used}/{total}** + **"+ Agrandir"** → agrandir; team list three states: **active** (**"Voir plus"** → proDetail, **"Supprimer"** → empty slot; salarié badge **"🤝 de9de9"** if `type==='salarie'`, "{role} · Salarié de9de9"); **pending** ("En attente de création…" / "Le professionnel doit créer son compte"; copy-link `de9de9.dz/join/{token}` → **"Copier"** ↔ **"✓ Copié"** 1.6s); **empty** (**"Ajouter un professionnel"** → generate token).
- **ProDetail FR:** header **"Gestion du professionnel"**, badge **"● Actif"**, salarié badge; **"Fiche — éditable"** (Rôle / Heures travaillées / Tarif / Disponibilité, live-updates); if salarié **"Analytics"** (Missions réalisées, Satisfaction %, Délai de réponse); **"Statistiques"** (CA global, Sollicitations 47), **"CA par sous-catégorie"**, Offres postulées 12 / Offres retenues 7; **"Missions assignées"** À venir / Passées.
- **WorkerProfile FR:** **"Profil de l'ouvrier"** (read-only); avatar, name, role, ★note badge, availability badge; **"Compétences"** chips; **"Contact"** (**"Appeler"** / **"WhatsApp"** inert + phone); **"Missions affectées"** (En cours/à venir / Passées; empty "Aucune mission affectée").
- **Agrandir FR:** **"Agrandir la société"**; 🚀 note "Besoin de plus de slots professionnels ?…"; fields Nom de la société, Numéro de téléphone, Email, Pro actuels / Pro désirés; **"Envoyer la demande"** → agrandirSent modal.
- **Flow:** salariés (sous-traitance) orthogonal to lifecycle, assignable via Affecter. Slots exclude salariés.
- **Zod:** `workerSchema = { id, name, role, available, colorHex, status: z.enum(['active','pending','empty']).optional(), type: z.enum(['pro','salarie']).optional(), skills?, avail?, hours?, tarif?, note?, token? }`; `agrandirSchema`, `memberFieldSchema`.
- **Hooks/mock:** `useTeam()` → `GET /workers`; `useWorker(id)` → `GET /workers/:id`; `useUpdateMember` → `PATCH /workers/:id`; `useGenerateLink` → `POST /workers/invite`; `useRemoveMember` → `DELETE /workers/:id`; `useAgrandir` → `POST /workers/agrandir`. Seed §8.
- **Modals:** agrandirSent ("Merci pour votre demande" → **"Retour à l'effectif"**).

### 7.16 `prestataire-profil`

- **Screens/routes:** `PrestataireProfilePage` (`/prestataire/profile`).
- **FR:** header **"Profil entreprise"**; company card (PlombEx, "Maintenance domestique · Alger"); warning "En attendant la mise à jour du logo…"; rows (inert): "Informations de l'entreprise", "Vérification KYC", "Mon effectif", "Notifications", "Paramètres"; **"Recruter des sous-traitants"** ("Renfort d'effectif · pros de9de9") → Recruter sheet; **"Contracter des personnes en situation de handicap"** ("Rejoignez la liste — de9de9 vous recontacte") → Handicap sheet; **"Contrat de partenariat"** card (badge **"✓ Signé"**, `contrat-partenariat-plombex-signe.pdf`, Signature 18/02/2026 / Échéance 18/02/2027, **"👁 Voir le contrat"** ↔ **"Masquer le contrat"**, **"⤓ Télécharger"** → toast "Téléchargement du contrat simulé"); **"Se déconnecter"** → `/login`.
- **Zod:** `recruterSchema = { categorie, sousCategorie, zone, nombre, note }` (validate cat+sub, else toast "Choisissez catégorie et sous-catégorie"); `handicapSchema = { contact, poste, zone, nombre?, email?, commentaire? }` (validate contact+poste+zone, else toast "Renseignez contact, poste et zone").
- **Hooks/mock:** `useRecruter` → `POST /sub/demandes`; `useHandicapJoin` → `POST /handicap`.
- **Modals:** Recruter sheet → recruterSent ("Demande envoyée" → **"OK"**); Handicap sheet → handicapSent ("Merci, nous vous recontacterons." → **"OK"**); Support.

### 7.17 `shared-modals`

Search-param- or `uiStore`-driven overlay hosts rendered by `AppLayout`:

| modal | trigger | FR | behavior |
|---|---|---|---|
| Support | many | **"Besoin d'aide ?"**; **"Appeler · 0560 00 00 00"**, **"WhatsApp · 0560 00 00 00"**, **"Email · aide@de9de9.dz"** | sheet, inert channels |
| Affecter | B2C/B2B | **"Affecter un ou plusieurs ouvriers"** / "Sélectionnez les membres…" | search, multi-select, **"Affecter ({count})"**, conflict → Conflit |
| Conflit | busy member | **"Conflit d'horaire"** / "Ce professionnel a déjà une tâche…" | **"Revenir"** / **"Continuer"** |
| DocView | factures/devis | **"Montant"**, **"Émetteur"**, **"Date"**, **"Crédits déduits"**, **"Statut"** | if waiting → **"Approuver"** / **"Contester"**; footer **"Télécharger"** / **"Partager"** |
| B2B Upload | B2B primary | **"Téléverser la facture"**, **"Montant (DZD)"**, **"Référence occurrence"**, **"Envoyer la facture"**, **"Facture envoyée !"** | stage machine |
| Postuler | B2C explorer | **"Envoyer une offre"**, **"Prix proposé (DZD)"**, **"Délai proposé"**, **"Message"**, **"Envoyer l'offre"** | sheet |
| Approve | facture | **"Approuver la facture"** / auto-approve note | **"Revenir"** / **"Confirmer l'approbation"** |
| Contest | facture | **"Contester la facture"**; motifs **"Montant incorrect"** / **"Prestation non conforme"** / **"Prestation non réalisée"**; **"Joindre une preuve"**; **"Envoyer la contestation"** | sheet, needs motif |
| Add/Reschedule récurrence | suivi | **"Ajouter une récurrence"** / **"Reprogrammer l'occurrence"**; **"Date proposée"** chips; **"Ajouter l'occurrence"** | sheet |
| Cancel demand | suivi early | **"Annuler la demande ?"** | **"Revenir"** / **"Confirmer l'annulation"** |
| Client review | occ/ponctuel | **"Évaluer la prestation"**, **"Votre note"** stars, **"Commentaire (optionnel)"**, **"Envoyer mon avis"** | sheet, needs note |
| Create-pick | dashboard | **"Type d'annonce"** → **"Annonce B2C"** / **"Annonce B2B"** | sheet |
| Recruter / Handicap | pro profil | see §7.16 | sheets → Sent modals |
| Toast | many | e.g. "Téléchargement du contrat simulé" | auto-dismiss 2s (`sonner`) |

---

## 8. Mock API + Seed Data

`api/mock/handlers.ts` — one flat file of `register('METHOD','/path', handler)` grouped by `// ===== feature =====`. Helpers: `ok(data)`→`{data}`; `notFound(msg)`→`{status:404,…}`; `badRequest(zodError)`→`{status:400, message: issues joined ' · '}`. Every mutation `safeParse`s the feature input schema, mutates `db`, returns `ok(...)`. `db.ts` holds the mutable singleton + helpers (`toISO`, `nowStamp`, `cmdById`, `currentOcc`, `computeDemandBadge`, `facturesFromTenders`). Types imported from feature schemas.

### 8.1 Endpoints

| method | path | feature |
|---|---|---|
| POST | `/auth/login`, `/auth/signup/pro`, `/auth/signup/client` | auth/onboarding |
| GET/POST | `/kyc/:key`, `/kyc/:key/docs`; DELETE `/kyc/:key/docs/:id` | kyc |
| GET | `/catalogue`, `/catalogue/:id` | catalogue |
| GET/POST | `/tenders`, `/tenders/:id`, `/tenders/:id/actions`, `/tenders/:id/reviews` | tenders |
| GET | `/wallet` | wallet |
| GET | `/factures` | factures |
| GET | `/client/calendar` | client calendrier |
| GET | `/prestataire/dashboard`, `/prestataire/stats`, `/prestataire/calendar` | dashboard/calendar |
| GET/POST | `/b2c/reservations`, `/b2c/open-offers`, `/b2c/sent-offers`, `/b2c/bids`, `/b2c/reservations/:id/affect` | b2c |
| GET/POST | `/b2b`, `/b2b/:id`, `/b2b/:id/actions` | b2b |
| GET/POST | `/annonces`, `/annonces/pros` | annonces |
| GET/PATCH/DELETE/POST | `/workers`, `/workers/:id`, `/workers/invite`, `/workers/agrandir` | effectif |
| POST | `/sub/demandes`, `/handicap` | recruter/handicap |
| GET | `/health` | infra |

### 8.2 Catalogue seed (16 families — Report D §2.2)

`{ id, colorKey, icon, name{fr,ar}, subs[] }`. Colors: 1,2,7,11 **noir**; 3,4,8,14,15 **bleu**; 6,9,10,16 **vert**; 5,12,13 **rouge**. TOP_IDS = [6,9,7,4].

| id | color | icon | FR name | #subs |
|---|---|---|---|---|
| 1 | noir | ⚖️ | Services Juridiques & Légaux | 13 |
| 2 | noir | 🧮 | Comptabilité, Finance & Fiscalité | 13 |
| 3 | bleu | 👥 | Ressources Humaines & Recrutement | 11 |
| 4 | bleu | 💻 | Services Informatiques & Digitaux | 14 |
| 5 | rouge | 📣 | Marketing, Communication & Créatif | 14 |
| 6 | vert | 🧼 | Nettoyage & Hygiène | 10 |
| 7 | noir | 🛡️ | Sécurité & Gardiennage | 9 |
| 8 | bleu | 🚚 | Logistique, Transport & Supply Chain | 10 |
| 9 | vert | 🏗️ | BTP, Travaux & Aménagement | 13 |
| 10 | vert | 🔧 | Maintenance Industrielle & Technique | 10 |
| 11 | noir | 📊 | Conseil & Stratégie d'Entreprise | 10 |
| 12 | rouge | 📦 | Fournitures & Équipements (Achat B2B) | 11 |
| 13 | rouge | 🍽️ | Restauration & Événementiel d'Entreprise | 9 |
| 14 | bleu | 🛟 | Assurance & Gestion des Risques | 8 |
| 15 | bleu | 🌍 | Import-Export & Commerce International | 7 |
| 16 | vert | 🗂️ | Services Généraux & Support | 8 |

Full sub-service lists (FR verbatim; AR mirrors FR until full AR taxonomy):

- **1** Avocat d'affaires · Notaire · Huissier de justice · Conseil juridique d'entreprise · Rédaction & révision de contrats · Propriété intellectuelle, brevets & marques (INAPI) · Recouvrement de créances · Contentieux & litiges commerciaux · Droit du travail & droit social · Droit fiscal & douanier · Mise en conformité réglementaire & RGPD · Constitution & modification de sociétés · Traduction juridique assermentée
- **2** Expert-comptable · Commissaire aux comptes · Tenue de comptabilité externalisée · Gestion de la paie · Déclarations fiscales (G50, IBS, TVA, IRG) · Déclarations sociales (CNAS, CASNOS) · Audit financier & comptable · Contrôle de gestion & reporting · Conseil financier & levée de fonds · Montage de dossier bancaire & crédit · Domiciliation d'entreprise · Évaluation d'entreprise · Gestion de trésorerie
- **3** Cabinet de recrutement · Chasse de têtes · Travail temporaire & intérim · Externalisation complète RH (SIRH) · Formation professionnelle en entreprise · Conseil RH & organisation · Évaluation & bilan de compétences · Coaching de dirigeants & cadres · Team building · Gestion administrative du personnel · Médecine du travail
- **4** Développement de logiciels sur mesure · Développement web & e-commerce · Développement d'applications mobiles · Maintenance informatique & helpdesk · Infogérance & gestion de parc · Infrastructure réseau & câblage · Administration serveurs & systèmes · Cybersécurité & audit de sécurité · Hébergement, cloud & sauvegarde · Intégration ERP (SAP, Odoo, Dolibarr) · Intégration & paramétrage CRM · Data, BI & intelligence artificielle · Transformation & conseil digital · Vidéosurveillance IP & systèmes électroniques
- **5** Agence de communication globale · Marketing digital & gestion réseaux sociaux · Référencement SEO & publicité SEA · Community management & création de contenu · Production vidéo & motion design · Montage vidéo & post-production · Photographie professionnelle & corporate · Design graphique & identité visuelle · Branding & stratégie de marque · Rédaction & copywriting · Régie publicitaire & affichage urbain · Relations presse & média · Impression & PLV · Goodies & objets publicitaires
- **6** Nettoyage de bureaux & locaux professionnels · Nettoyage industriel & usines · Nettoyage de fin de chantier · Nettoyage de vitres & façades · Désinfection, dératisation & désinsectisation (3D) · Gestion & collecte des déchets · Fourniture de produits d'hygiène sanitaire · Entretien des espaces verts · Blanchisserie industrielle & pressing pro · Dégraissage de hottes & cuisines pro
- **7** Société de gardiennage · Agents de sécurité & vigiles · Installation vidéosurveillance & alarme · Systèmes de contrôle d'accès · Sécurité incendie & extincteurs · Transport de fonds & valeurs · Sécurité événementielle · Conseil & audit de sûreté · Maître-chien & cynophile
- **8** Transport de marchandises (national) · Transit & dédouanement · Entreposage & stockage · Logistique & distribution · Livraison dernier kilomètre & coursier · Fret maritime, aérien & routier · Location de véhicules utilitaires & camions · Manutention & déménagement industriel · Location d'engins de levage · Gestion de flotte
- **9** Entreprise de bâtiment (gros œuvre) · Aménagement & agencement de bureaux · Électricité industrielle & bâtiment · Plomberie & sanitaire · Climatisation, chauffage & froid (CVC) · Étanchéité & isolation · Peinture & revêtement professionnel · Faux plafonds, cloisons & menuiserie · Vitrerie & façades · Bureau d'études techniques & architecture · Suivi, contrôle & coordination de chantier · Terrassement & VRD · Métallerie, ferronnerie & serrurerie
- **10** Maintenance d'équipements industriels · Maintenance préventive & curative · Électromécanique & automatisme industriel · Maintenance de groupes électrogènes · Maintenance d'ascenseurs & monte-charges · Chaudronnerie & soudure industrielle · Usinage & fabrication de pièces · Calibrage, métrologie & contrôle · Maintenance CVC & froid commercial · Maintenance informatique industrielle (GMAO)
- **11** Conseil en management & organisation · Conseil en stratégie & business plan · Étude de marché & étude de faisabilité · Accompagnement à la création d'entreprise · Conseil en certification (ISO 9001, HACCP, ISO 14001) · Conduite du changement & transformation · Intelligence économique & veille · Conseil en financement & subventions (ANADE, ANGEM) · Optimisation des processus (Lean) · Conseil RSE & développement durable
- **12** Fournitures de bureau · Mobilier de bureau & aménagement · Matériel informatique & bureautique · Équipements & machines industrielles · Consommables & pièces de rechange · Équipements de protection individuelle (EPI) · Matières premières · Emballage & conditionnement · Uniformes & vêtements de travail · Matériel médical & laboratoire · Énergie solaire & équipements
- **13** Restauration collective & cantine d'entreprise · Traiteur événementiel · Plateaux repas & livraison entreprise · Organisation de séminaires & conférences · Location de salles & espaces de réunion · Organisation de salons & stands · Location de matériel événementiel · Animation, sonorisation & spectacle · Agence de voyage d'affaires
- **14** Courtier en assurance entreprise · Assurance multirisque professionnelle · Assurance flotte automobile · Assurance responsabilité civile pro · Assurance transport & marchandises · Santé & prévoyance collective · Expertise & évaluation de sinistres · Conseil en gestion des risques
- **15** Société d'import-export · Sourcing & approvisionnement international · Représentation commerciale & agent · Accompagnement domiciliation bancaire import · Conseil en commerce extérieur & douane · Inspection & contrôle qualité marchandises · Traduction commerciale & technique
- **16** Secrétariat & assistance administrative externalisée · Centre d'appels & relation client (call center) · Numérisation & archivage de documents · Coursier & service de pli · Imprimerie & reprographie · Location de matériel bureautique · Gestion du courrier & domiciliation postale · Interprétariat & traduction

### 8.3 Client tenders seed (`db.tenders`)

| id | fam | service | wilaya | délai | type | budget | setup/status |
|---|---|---|---|---|---|---|---|
| AO-1042 | 6 | Nettoyage de bureaux & locaux professionnels | Alger | Sous 1 semaine | recurrent (Mensuel) | 180000 | active — occurrences at V2/V5 (enCours) |
| AO-1037 | 4 | Développement d'applications mobiles | Oran | 2 à 3 mois | ponctuel | 950000 | `assigne` (S4) |
| AO-1031 | 7 | Société de gardiennage | Alger | Immédiat | recurrent (Annuel) | — | `contacte` (S2) |
| AO-1029 | 1 | Rédaction & révision de contrats | Constantine | Sous 72h | ponctuel | 120000 | `arappeler` (S1) |
| AO-1018 | 13 | Traiteur événementiel | Alger | Terminé | ponctuel | 430000 | occurrence at V7 (termine) |

Seed AO-1042 with occurrences spanning V-states so the cascade demo works (e.g. occ1 `paid`, occ2 `doneInvoiced` → badge "Facture à approuver"). Form option lists: **WILAYAS** = Alger, Oran, Constantine, Annaba, Blida, Sétif, Béjaïa, Tizi Ouzou, Tlemcen, Batna, Ouargla, Ghardaïa; **DELAIS** = Immédiat, Sous 72h, Sous 1 semaine, Sous 1 mois, 2 à 3 mois, Flexible; **RECURRENCES** = Hebdomadaire, Mensuel, Trimestriel, Annuel.

### 8.4 Wallet seed (`db.wallet`)

`balanceCredits: 2 350 000`, `subscriptionActive: false`. Ledger:

| id | type | crédits | label | date | invoice |
|---|---|---|---|---|---|
| TX-09 | deduction | 1 800 000 | Nettoyage bureaux — Juin 2026 | 2026-06-15 | FAC-2061 |
| TX-08 | recharge | 5 000 000 | Rechargement (admin de9de9) | 2026-06-01 | — |
| TX-07 | deduction | 1 800 000 | Nettoyage bureaux — Mai 2026 | 2026-05-15 | FAC-2055 |
| TX-06 | deduction | 4 300 000 | Traiteur séminaire annuel | 2026-05-30 | FAC-2040 |
| TX-05 | recharge | 5 000 000 | Rechargement (admin de9de9) | 2026-05-02 | — |

### 8.5 Invoices seed (`db.factures`)

| id | tender | label | DZD | issued | occurrence | status |
|---|---|---|---|---|---|---|
| FAC-2061 | AO-1042 | Nettoyage bureaux — Juin 2026 | 180000 | 2026-06-15 | Occurrence 2/12 | waiting |
| FAC-2055 | AO-1042 | Nettoyage bureaux — Mai 2026 | 180000 | 2026-05-15 | Occurrence 1/12 | approved |
| FAC-2040 | AO-1018 | Traiteur séminaire annuel | 430000 | 2026-05-30 | — | approved |

`amountCredits = amountDzd × 10`.

### 8.6 Workers seed (`db.workers`)

| id | name | role | available | color |
|---|---|---|---|---|
| W1 | Karim Belkacem | Chef d'équipe | true | #E0A82E |
| W2 | Sofiane Haddad | Technicien | true | #2F9BE0 |
| W3 | Yacine Mansouri | Agent | true | #9B6BE2 |
| W4 | Nabil Cherif | Agent | false | #2E9E5B |
| W5 | Riad Toumi | Technicien | true | #E7464E |

Add pending (token `de9de9.dz/join/…`) + empty slots + 2 salariés (`type:'salarie'`, badge 🤝 de9de9) for the effectif states. Slots used/total 3/5 (exclude salariés).

### 8.7 B2C seed

**Reservations** (`db.reservations`):

| id | client | service | date | wilaya | status | DZD | worker | fromWonBid |
|---|---|---|---|---|---|---|---|---|
| R-2201 | Mme Lamia B. | Nettoyage appartement | 25 juin 2026 | Alger | recue | 6000 | — | false |
| R-2202 | M. Tarek H. | Réparation climatiseur | 26 juin 2026 | Blida | recue | 4500 | — | false |
| R-2185 | Mme Souad K. | Ménage hebdomadaire | 22 juin 2026 | Alger | confirmee | 5000 | W1 | false |
| R-2180 | M. Amine D. | Installation cuisine | 20 juin 2026 | Boumerdès | confirmee | 22000 | W2 | true |

**Open offers:** O-501 Peinture appartement F4 · "Rafraîchissement complet, peinture mate blanche." · Alger · ≈ 60 000 DZD · Sous 2 semaines; O-502 Déménagement villa · "Déménagement 3 niveaux avec démontage de meubles." · Oran · ≈ 35 000 DZD · Ce week-end; O-503 Entretien jardin mensuel · "Taille, tonte et arrosage pour une grande villa." · Tipaza · ≈ 12 000 DZD / mois · Récurrent.

**Sent offers:** S-301 Peinture bureau open-space · 48000 · 5 jours · "Disponible immédiatement, équipe de 3." · enAttente; S-298 Réparation plomberie · 9000 · 48h · "Intervention rapide possible." · retenue; S-290 Nettoyage fin de chantier · 30000 · 3 jours · "Matériel professionnel fourni." · refusee.

### 8.8 B2B jobs seed (`db.b2bJobs`)

| id | entreprise | service | occurrence | date | worker | facture | montant |
|---|---|---|---|---|---|---|---|
| B2B-7012 | Hôtel El Djazaïr | Nettoyage des chambres | Occurrence 3/12 | 25 juin 2026 | — | none | — |
| B2B-7008 | SARL TechnoPlus | Maintenance climatisation | Ponctuel | 24 juin 2026 | W5 | envoyee | 18000 |
| B2B-6995 | Clinique Ennour | Désinfection des locaux | Occurrence 1/6 | 18 juin 2026 | W1 | approuvee | 26000 |

### 8.9 Annonces / calendar seed

**Annonces:** A-11 "Nettoyage professionnel de bureaux" / Nettoyage & Hygiène / b2b / active; A-09 "Ménage à domicile" / Nettoyage appartement / b2c / active; A-07 "Maintenance CVC entreprise" / Maintenance technique / b2b / active.

**Calendar events** (25–26 June 2026): E1 Nettoyage chambres — Hôtel El Djazaïr · 2026-06-25T09:00 · Alger · b2b · W2; E2 Climatisation — Hôtel El Aurassi · 2026-06-25T14:00 · Kouba · b2b · W1; E5 Mise aux normes électriques · 2026-06-25T16:00 · El Biar · b2c · W3; E3 Maintenance climatisation — TechnoPlus · 2026-06-26T10:00 · Alger · b2b · W5; E4 Réparation climatiseur — M. Tarek · 2026-06-26T16:00 · Blida · b2c · W3.

**Revenue ratios:** Jan .4 / Fév .55 / Mar .5 / Avr .7 / Mai .85 / Juin .95. **Stats KPIs:** Revenue 312 000 DZD, Missions 48, Rating 4.8/5, Win-rate 62%.

---

## 9. i18n Keys

**Approach (Report C §6):** `lib/i18n/dict.ts` — `export const fr = {…} ` (source of truth for key set), `export type TKey = keyof typeof fr`, `export const ar: Record<TKey,string> = {…}` (TS forces parity), `export const dict = { fr, ar } as const`. Runtime: `useT()` (reactive `(key)=>dict[lang][key]`), `t(key)` (non-reactive, handlers/toasts), `useL(fr,ar)` (one-offs). Interpolation via `{n}`/`{date}` templates + `.replace()`. Status labels come from `statusModel` (French canonical), not the dict; `StatusBadge` renders the projection for the current role.

**Starter keys (grouped, FR shown; AR must supply each):**

```
// layout / nav (core — do not change)
navHome:'Accueil' navSuivi:'Demandes' navCalendrier:'Calendrier'
navWallet:'Crédits' navFactures:'Factures'
pNavHome:'Accueil' pNavB2c:'B2C' pNavB2b:'B2B' pNavCal:'Calendrier' pNavProfil:'Profil'
langLabel:'🌐 Français' clientTag:'CLIENT' proTag:'PRO'

// auth / onboarding
loginTitle:'Se connecter' email:'Adresse e-mail' password:'Password'
forgot:'Mot de passe oublié ?' rester:'Rester connecté' loginCta:'Se connecter'
noAccount:'Pas encore membre?' createAccount:'Créer un compte'
roleTitle:"S'identifier en tant que" roleClient:'Client' rolePro:'Professionnel'
proSignupTitle:'Créer une entreprise' clientSignupTitle:'Créer un compte client'
createEnterprise:'Créer mon entreprise' createAccountCta:'Créer mon compte'

// kyc
kycTitle:'Vérifier mon entreprise' kycImport:'Importer' kycRc:'Registre de commerce (RC)'
kycNif:'NIF' kycNis:'NIS' kycSubmit:'Soumettre la vérification'
kycSentTitle:'Demande envoyée !' kycOkTitle:'Entreprise vérifiée !'
kycLockTitle:'Vérification requise' kycVerify:'Compléter la vérification' kycOk:'Entreprise vérifiée'

// catalogue
catTitle:'Que recherchez-vous ?' catSub:'16 familles de services B2B'
searchPh:'Rechercher un service…' searchCat:'Catégorie' searchSub:'Service'
searchNoRes:'Aucun résultat' elseTitle:'Je cherche autre chose'
topTitle:'Top catégories du mois' allCatsTitle:'Toutes les catégories'
chooseSub:'Sélectionnez un ou plusieurs services' publishCta:'Publier un appel d\'offres'

// tenders / suivi
ficheTitle:'Appel d\'offres' familleLabel:'Famille & catégorie'
descLabel:'Description détaillée du besoin' wilayaLabel:'Wilaya / lieu d\'exécution'
delaiLabel:'Délai souhaité' budgetLabel:'Budget estimatif (optionnel)'
typeLabel:'Type de besoin' ponctuel:'Ponctuel' recurrent:'Contrat récurrent'
freqLabel:'Fréquence' docsLabel:'Documents joints' critLabel:'Critères de sélection prioritaires'
submitPublish:'Envoyer l\'appel d\'offres' confirmTitle:'Appel d\'offres envoyé !'
seeSuivi:'Suivre ma demande' suiviTitle:'Mes appels d\'offres'
suiviHint:'Suivez l\'avancement de vos demandes' suiviEmpty:'Aucune demande dans cette catégorie.'
filAll:'Tous' filAction:'Action requise' filWait:'Facture en attente'
filSetup:'En préparation' filDone:'Terminées' filCancelled:'Annulées'
nextAction:'Prochaine action' actModifier:'Modifier la demande'
actContactSupport:'Contacter le support' actAnnuler:'Annuler la demande'
confirmProvider:'Confirmer le prestataire' voirDevis:'Voir le devis'
occConfirmer:'Confirmer la visite' occReprog:'Reprogrammer' occAnnuler:'Annuler'
facVoir:'Voir / Télécharger la facture' facApprouver:'Approuver' facContester:'Contester'
laisserAvis:'Laisser un avis' addRecur:'Ajouter une récurrence' voirFactures:'Voir les factures'

// wallet
walletTitle:'Portefeuille' balance:'Solde actuel' creditsUnit:'crédits'
abonTitle:'Abonnement annuel' abonCta:'Choisir l\'abonnement' histTitle:'Mouvements'

// factures
facturesTitle:'Factures' facAll:'Toutes' facWaiting:'En attente'
facApproved:'Approuvées' facContested:'Contestées'

// calendrier / profil
calTitle:'Calendrier' calConfirmBadge:'Confirmé'
profilTitle:'Profil entreprise' supportRow:'Support & contact' logout:'Se déconnecter'

// prestataire
dashTitle:'Tableau de bord' verifCta:'Vérifier mon entreprise'
statAvenir:'À venir' statEnCours:'En cours' statComplete:'Complétés'
createAnnonce:'Créer une annonce' mesAnnonces:'Mes annonces' monEquipe:'Mon équipe'
b2cTitle:'B2C · Particuliers' b2bTitle:'B2B · Entreprises'
recues:'Commandes reçues' explorer:'Explorer les offres' confirmes:'Services confirmés'
voirOffres:'Voir les offres' offresEnvoyees:'Offres envoyées' postuler:'Postuler'
stAttente:'En attente' stRetenue:'Retenue' stRefusee:'Refusée'
affecter:'Affecter un ouvrier' televerserFacture:'Téléverser la facture'
effectifTitle:'Mon effectif' agrandir:'+ Agrandir' voirPlus:'Voir plus'
supprimer:'Supprimer' copier:'Copier' copie:'✓ Copié' ajouterPro:'Ajouter un professionnel'
recruter:'Recruter des sous-traitants' handicap:'Contracter des personnes en situation de handicap'
contrat:'Contrat de partenariat' signe:'✓ Signé'

// shared modals
supportTitle:'Besoin d\'aide ?' callBtn:'Appeler · 0560 00 00 00'
whatsappBtn:'WhatsApp · 0560 00 00 00' emailBtn:'Email · aide@de9de9.dz'
affecterTitle:'Affecter un ou plusieurs ouvriers' conflitTitle:'Conflit d\'horaire'
docMontant:'Montant' docEmetteur:'Émetteur' docStatut:'Statut'
docDownload:'Télécharger' docShare:'Partager'
```

**Status labels** are not dict keys — `statusModel` provides the canonical FR per projection (§5.2–5.3). AR translations for status labels live in a parallel `statusLabelsAr` map keyed by `${code}:${projection}` so the model stays FR-canonical while AR renders in RTL.

---

## 10. Build Order / Milestones

- [ ] **M0 — Scaffold + config.** `npm create vite` (react-ts); copy `package.json` deps (§2); copy `vite.config.ts`, all `tsconfig*`, `components.json`, `eslint.config.js`, `index.html` (Poppins + Noto Sans Arabic, `lang=fr`, title "DE9DE9 Entreprise"), `public/favicon.svg`, `src/main.tsx`, `lib/utils.ts`, `lib/queryClient.ts`. Verify `npm run dev` boots.
- [ ] **M1 — Tokens + UI + layout.** Copy `src/index.css` verbatim (add `cat-*` category tokens); copy `components/ui/*` (add `avatar`, `radio-group`, `accordion` if used); build `AppLayout` with the **role-scoped nav** (§4.2), `RoleBadge`, mobile `Sheet`, theme + RTL effects. Empty placeholder pages.
- [ ] **M2 — Stores + api + i18n.** `authStore` (role `client|prestataire`), `langStore`, `themeStore`, `uiStore`; `api/apiClient.ts` + `api/mock/{router,index,db,handlers}` skeleton; `lib/i18n/{dict,index}` with the §9 starter keys (FR + AR).
- [ ] **M3 — Status model.** `lib/statusModel/{index,setup,visite,badge}` with types, both transition tables (§5.2–5.3), projections, transition edges, and `computeDemandBadge` cascade (§5.4). Unit-test the cascade against the AO-1042 seed. `common/StatusBadge`, `common/Stepper`.
- [ ] **M4 — Auth + onboarding + KYC.** Login, role choose, pro/client signup, pro/client KYC + success; guards `requireAuth`/`requireRole`; wire landing logic. Verify both personas reach their shell.
- [ ] **M5 — Client features.** catalogue (+16-family seed), family detail, publish tender + confirm, my tenders (filters), tender detail (setup timeline, provider selection, recurrence, occurrence actions), wallet, factures, calendrier, profil. Seed §8.3–8.5.
- [ ] **M6 — Prestataire features.** dashboard + stats, b2c (3 tabs + explorer), b2b + detail (frise), annonces + create + assign, calendar, effectif + proDetail + workerProfile + agrandir, profil (contrat, recruter, handicap). Seed §8.6–8.9.
- [ ] **M7 — Shared modals.** Support, Affecter (+Conflit), DocView, B2B Upload, Postuler, Approve, Contest, Add/Reschedule récurrence, Cancel, Client review, Create-pick, Recruter/Handicap + Sent, Toast (`sonner`). Wire overlay hosts in `AppLayout`.
- [ ] **M8 — Polish / RTL / dark.** Verify FR/AR toggle flips `dir` + Arabic font; dark theme via `.dark` class; category colors legible on dark (`darkAccent`); responsive at mobile/tablet/desktop breakpoints; empty states; blind-assignment masking; S/V numbers never shown to users.
- [ ] **M9 — Verify build.** `npm run build` (`tsc -b && vite build`) green; `npm run lint` clean; smoke-test every route + each status transition end-to-end (publish→confirm→affect→realize→invoice→approve→pay; and dispute loop).

---

**End of spec.** This document is the single source of truth: preserve every FR string verbatim, keep S/V codes in English and labels in French, and mirror the admin slice recipe (`zod → react-query hook that parses → mock register() → component → lazy routes → root router`) for every feature.