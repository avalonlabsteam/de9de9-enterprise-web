# De9De9 Entreprise — Web

Web build of the **De9De9 Entreprise** app — the bilingual (FR primary / AR RTL)
Algerian B2B services marketplace. One React SPA serving **two personas behind a
single login**: **Cliente Entreprise** (buyer) and **Prestataire Entreprise**
(provider).

The **flows** (screen sequence, the S/V status model, every action & modal)
follow the interactive prototype and the Flutter app. The **architecture,
tooling, and visual language** are copied from the sibling admin console
(`de9de9-enterprise`): feature-sliced structure, `axios` + a mock-adapter API
layer, `@tanstack/react-query`, `zod`, `react-hook-form`, `zustand`,
`react-router`, radix/shadcn UI, `sonner`, dict-based i18n, Tailwind v4.

> Full spec: [`docs/BUILD-SPEC.md`](docs/BUILD-SPEC.md). Research reports that
> produced it: `docs/research-01..04-*.md`. The previous Flutter-port build is
> archived under `docs/legacy/`.

## Stack

- **Vite** + **React 19** + **TypeScript** (strict)
- **Tailwind v4** (CSS-first, `@tailwindcss/vite`, no `tailwind.config.js`) + shadcn `radix-nova` primitives
- **Zustand** (+ persist) — `auth` (role `client`/`prestataire`), `lang`, `theme`, `ui`
- **react-router-dom** — role-scoped shells under a single `AppLayout`
- **@tanstack/react-query** + **axios** talking to an in-memory **mock adapter** (`src/api/mock`)
- **zod** schemas parse every response; **react-hook-form** for forms
- **sonner** toasts; dict-based **i18n** (`useT`/`useL`) with FR + AR and full RTL

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # tsc -b && vite build
pnpm preview
pnpm lint
```

All data is mocked — the axios mock adapter (`src/api/mock/handlers.ts` +
`db.ts`) is the backend. Set `VITE_API_MOCK=false` to talk to a real API.

## The status model (heart of the app)

`src/lib/statusModel/` encodes the canonical **one-status / three-projections /
ball** model: setup states `S1–S4` and visite states `V0–V7` (+ `V5·C` contestée,
`V✕` annulée). The client, de9de9 and prestataire each see their own FR
projection label; the client's whole-demand badge is **derived** (never stored)
from the occurrences by an urgency cascade (`computeDemandBadge`). S/V numbers
are internal — users see a `Stepper` + projection labels only. Blind-assignment
is enforced: the client never sees provider identity past `assigne`.

## Project structure

```
src/
  api/
    apiClient.ts            # axios instance (+ mock adapter)
    mock/                   # router, handlers (routes + tender transitions), db (seed)
  components/
    ui/                     # shadcn radix-nova primitives
    layout/                 # AppLayout (role-scoped nav), RoleBadge, overlayHosts
    common/                 # StatusBadge, Stepper, EmptyState, PieceSlot, CategoryChip,
                            #   Logo, AffecterModal, DocViewer, WorkerAvatar
  features/<slice>/         # api/ · components/ · schemas/ · stores/  (feature-sliced)
    auth · onboarding · kyc
    client-catalogue · client-tenders · client-wallet · client-factures
      · client-calendrier · client-profil
    prestataire-dashboard · prestataire-b2c · prestataire-b2b
      · prestataire-annonces · prestataire-calendar · prestataire-equipe · prestataire-profil
  lib/
    statusModel/            # S/V states, projections, transitions, badge cascade
    catalogue.ts            # 16 service families + sub-services + form option lists
    categoryColors.ts       # NOIR/BLEU/VERT/ROUGE token classes
    i18n/                   # dict (FR + AR) + useT/useL/t
    queryClient.ts · utils.ts
  stores/                   # authStore, langStore, themeStore, uiStore
  routes/                   # index.tsx (router) + guards.tsx
```

## Personas & routes

- **Client shell** (`/client…`): Accueil/Catalogue → Publier un appel d'offres →
  Suivi (list + detail with stepper, provider selection, recurrences, facture
  approve/contest), Calendrier, Portefeuille (crédits), Factures, Profil, KYC.
- **Prestataire shell** (`/prestataire…`): Tableau de bord + Statistiques, B2C
  (Commandes/Explorer/Confirmés), B2B (+ detail frise), Annonces (create/assign),
  Calendrier, Effectif (+ pro/ouvrier detail, agrandir), Profil (contrat,
  recruter, handicap).

Auth is a single login → role chooser → the matching shell. Light/dark theme and
FR/AR (with `dir` + Arabic font swap) toggle from the top bar.
