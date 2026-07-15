I now have a complete picture across the Flutter app, the ported web data, and the admin console's S/V status system. Here is the report.

---

# FLUTTER CROSS-CHECK & DOMAIN DATA

Cross-check of the DE9DE9 Entreprise flows against the Flutter implementation (`/Users/haithamattab/Documents/Flutter Projects/de9de9-entreprise/lib`), the already-ported web data (`…/de9de9-entreprise-web/src`), and the admin/back-office console (`…/react-projects/de9de9-enterprise`) which owns the canonical **S/V status pipeline**.

Key structural fact: the Flutter app is **two personas in one app** (`UserRole.cliente` = B2B buyer, `UserRole.prestataire` = provider), each with its own 5-tab bottom-nav shell, sharing one auth/onboarding front door. The web port (`mockClient.ts`, `mockPrestataire.ts`, `mockCatalogue.ts`) is a faithful 1:1 transcription of the Flutter mock data — the data below is reproduced verbatim and is already consistent across both.

---

## 1. Flows as implemented in Flutter

### 1.1 Entry / auth (shared)

Router: `lib/src/routing/app_router.dart` + `app_routes.dart`.

```
/onboarding (initialLocation)
  → [Get Started] → /login
/login
  → [submit] → /client            (ALWAYS lands on client — see gap G2)
  → "mot de passe oublié" → /forgot-password
  → "créer un compte" → /signup
/signup  (role picker: Cliente | Prestataire, default Cliente)
  → [submit] → /client   if role == cliente
  → [submit] → /prestataire  if role == prestataire
/forgot-password → [submit] → /login
```

- Auth guard (`createAppRouter.redirect`): while `SessionStatus.unknown` no redirect (splash). Once known, any non-public route requires auth else `→ /login`. Public set = `{onboarding, login, signup, forgotPassword}`.
- Role landing lives in `auth_bloc.dart`: **login ignores role** and hardcodes `context.go(AppRoutes.clientHome)`; **only signup** branches on `event.role.isCliente`.
- `/` (`HomePage`) and `/splash` route constants exist but are essentially vestigial (HomePage is a generic welcome screen, not part of either persona flow).

### 1.2 Client (Cliente Entreprise) flow

Shell: `client_shell.dart` — 5 branches (StatefulShellRoute, independent stacks), primed on mount with `CatalogueLoaded / TendersLoaded / WalletLoaded / KycLoaded`.

Bottom nav: **Catalogue (0) · Suivi/Mes AO (1) · Portefeuille (2) · Factures (3) · Profil (4)**.

```
Catalogue  (/client)                       catalogue_screen.dart
  grid of 16 families → tap → /client/family/:id
Family detail (/client/family/:id)         family_detail_screen.dart
  ├─ KYC GATE: canPublish == kyc.validated
  │   if NOT validated → amber "_KycLockBanner" + bottom CTA reads
  │      "Publier (verrouillé)" and routes → /client/kyc  (not publish)
  │   sub-service rows are non-tappable while locked
  └─ if validated:
       sub-service row → /client/publish/:familyId?sub=<name>
       bottom CTA "Publier un appel d'offres" → /client/publish/:familyId
Publish (/client/publish/:familyId)        publish_tender_screen.dart
  form: service (prefilled from sub), description, wilaya, budget(opt),
        délai, type = Ponctuel|Récurrent (+recurrence if récurrent),
        attachment (mock "cahier-des-charges.pdf")
  [submit] → TenderPublished(status: enAttente) → success dialog
           → dialog CTA pops back to family
Suivi / Mes AO (/client/tenders)           my_tenders_screen.dart
  list of tenders → tap → /client/tender/:id
Tender detail (/client/tender/:id)         tender_detail_screen.dart
  ├─ 5-step vertical timeline: enAttente→contacte→assigne→enCours→termine
  └─ BLIND ASSIGNMENT: at `assigne`, banner "de9de9 a assigné un
     professionnel" — provider identity intentionally hidden
KYC (/client/kyc)                          kyc_screen.dart
  RC / NIF / NIS → submit → repo forces validated:true → toast → pop
Portefeuille (/client/wallet)              wallet_screen.dart
  balance in crédits (+≈DZD, 1 DZD=10 cr), negative-allowed warning,
  subscription card (inactive; "coming soon"), credit ledger
Factures (/client/invoices)                invoices_screen.dart
  provider invoices; shows DZD and −crédits, occurrence label
Profil (/client/profile)                   client_profile_screen.dart
  → KYC tile (/client/kyc), theme (system/light/dark), language,
    support, logout → /login
```

Detail routes (`clientFamily`, `clientPublish`, `clientTender`, `clientKyc`) sit on the **root navigator** (cover the bottom bar). `clientKyc` is reachable from three places: family-detail lock, family CTA, and profile — and (see gap G3) from the prestataire profile.

### 1.3 Prestataire (Prestataire Entreprise) flow

Shell: `prestataire_shell.dart` — primes `EffectifLoaded / B2cLoaded / B2bLoaded / AnnoncesLoaded / CalendarLoaded`.

Bottom nav: **Accueil (0) · B2C (1) · B2B (2) · Calendrier (3) · Profil (4)**.

```
Accueil (/prestataire)                     accueil_screen.dart
  greeting ("Pro Services SARL"), 2 KPIs (reçues count, B2B count),
  "Créer une annonce" → bottom sheet {B2C | B2B} choice
     → /prestataire/annonce/create?type=b2c|b2b
  "Mes annonces" list (AnnoncesBloc)
B2C (/prestataire/b2c)                      b2c_screen.dart
  "Créer une annonce (B2C)" → create?type=b2c
  Tabs: [Commandes reçues] [Explorer les offres] [Services confirmés]
    Reçues:    ReservationCard → "Affecter" → showAffecterSheet
               → B2cWorkerAssigned
    Explorer:  nested tabs [Voir les offres] [Offres envoyées]
       Voir:   OpenOfferCard → "Postuler" → bid sheet (prix/délai/msg)
               → B2cBidSubmitted → moves to Offres envoyées (enAttente)
       Envoyées: SentOfferCard (enAttente|retenue|refusee) — read-only
    Confirmés: ReservationCard (confirmee) with assigned worker name
B2B (/prestataire/b2b)                      b2b_screen.dart
  "Créer une annonce (B2B)" → create?type=b2b
  list of B2bJob (admin-routed):
    "Affecter" → showAffecterSheet → B2bWorkerAssigned
    "Déposer facture" → showFactureUploadSheet(amount)
        → B2bFactureUploaded  (factureStatus none→envoyee)
Calendrier (/prestataire/calendar)          calendar_screen.dart
  day agenda of CalendarEvent, filter by source (b2c|b2b), worker color tags
Create annonce (/prestataire/annonce/create?type=) create_annonce_screen.dart
  → pop on submit
Profil (/prestataire/profile)               prestataire_profile_screen.dart
  → Mon effectif (/prestataire/effectif)   effectif_screen.dart  (team roster)
  → Statistiques (/prestataire/stats)      stats_screen.dart (KPIs + bar chart)
  → KYC (→ AppRoutes.clientKyc — reuses client KYC screen; gap G3)
  → logout → /login
```

### 1.4 Transitions the prototype flow map may miss / model differently

- **G1 — `roleSelection` route is dead.** `AppRoutes.roleSelection = '/role-selection'` is declared but never registered in the router or navigated to. Role is chosen inline on `/signup` (a `_role` field, default `cliente`), not a dedicated screen.
- **G2 — Login does not restore persona.** `_onLoginRequested` hardcodes `clientHome`. A prestataire who *logs in* (rather than signs up in the same session) lands in the **client** experience. There is no persisted role → landing decision. The prototype/admin model assumes a known role per account; Flutter only honors it at signup.
- **G3 — Prestataire KYC reuses the client KYC screen.** `prestataire_profile_screen.dart:70` pushes `AppRoutes.clientKyc`. There is no distinct provider KYC entity/flow in Flutter (the admin console *does* model provider KYC separately via polymorphic `kyc_state` key `pres:<id>` vs `client:<name>`).
- **G4 — Client suivi is a 5-state projection of the admin's 14-state S/V pipeline.** The client never sees `devis` (S3), per-occurrence granularity, dispute, or payout. Recurring tenders show a single status, not a per-occurrence V-timeline. See §4 for the mapping.
- **G5 — Provider-side facture lifecycle is partially wired.** `FactureStatus` has 5 states (`none/envoyee/recue/approuvee/contestee`) and seeds show `envoyee/approuvee`, but the only user action implemented is upload (`none→envoyee`). `recue/approuvee/contestee` are display-only — the admin console drives those transitions (V5→V6/V5·C).
- **G6 — B2C bidding loop closes only forward.** `B2cBidSubmitted` creates a `SentOffer(enAttente)`; there is no in-app transition to `retenue/refusee` (admin/other side drives it), and a won bid surfaces as a `Reservation(fromWonBid:true, confirmee)` rather than by mutating the SentOffer.
- **G7 — Wallet is admin-fed and read-only.** `recharge` transactions are labelled "Rechargement (admin de9de9)"; the subscription CTA is a "coming soon" toast. Negative balances warn but never hard-block (matches admin `credit_entry`).
- **G8 — No delete/toggle for annonces** (only `AnnoncesLoaded` + `AnnonceCreated`); `Annonce.active` exists but has no toggle action.

---

## 2. Service CATALOGUE

Source of truth: `lib/src/features/client/data/mock/mock_catalogue.dart` (Flutter) == `src/data/mockCatalogue.ts` (web). 16 families, each `id`, `colorKey`, `icon` (emoji), bilingual `name{fr,ar}`, and `subs[]` (`id: "<familyId>-<index>"`, `name{fr,ar}` with AR mirrored to FR until a full AR taxonomy lands).

### 2.1 Category color coding (NOIR / BLEU / VERT / ROUGE)

From `lib/src/theme/category_colors.dart` == `src/theme/categoryColors.ts`. Four-way coding; each family carries one `colorKey`. Cards/detail headers derive accent + soft background; a lifted `darkAccent` keeps coding legible on dark surfaces.

| key | label | main (light accent) | soft (light bg) | darkAccent | Meaning (grouping) |
|---|---|---|---|---|---|
| `noir` | NOIR | `#2D3340` | `#ECEEF1` | `#B6BEC8` | Professional / regulated / advisory: Juridique, Comptabilité-Finance, Sécurité-Gardiennage, Conseil & Stratégie |
| `bleu` | BLEU | `#2F9BE0` | `#EAF2FD` | `#5BB6F0` | People / tech / flow: RH, Informatique, Logistique-Transport, Assurance, Import-Export |
| `vert` | VERT | `#46B3AA` | `#E5F7F4` | `#5FC9C0` | Facilities / field / ops: Nettoyage, BTP, Maintenance industrielle, Services généraux |
| `rouge` | ROUGE | `#E7464E` | `#FDECEC` | `#FF6B72` | Commercial / brand / supply: Marketing, Fournitures B2B, Restauration-Événementiel |

Helpers (identical semantics in both): `accentOn(dark)`, `surfaceOn(dark)` (dark = `withAlpha(darkAccent, 0.16)`), `onBadgeOn(dark)` (`#11151C` dark / `#FFFFFF` light). Note: the color grouping is thematic, not strictly 1:1 — e.g. Sécurité is NOIR while Nettoyage/Maintenance are VERT.

### 2.2 Families + color + sub-services (reproduce verbatim into the mock DB)

| id | color | icon | FR name | AR name | # subs |
|---|---|---|---|---|---|
| 1 | noir | ⚖️ | Services Juridiques & Légaux | الخدمات القانونية | 13 |
| 2 | noir | 🧮 | Comptabilité, Finance & Fiscalité | المحاسبة والمالية والجباية | 13 |
| 3 | bleu | 👥 | Ressources Humaines & Recrutement | الموارد البشرية والتوظيف | 11 |
| 4 | bleu | 💻 | Services Informatiques & Digitaux | خدمات المعلوماتية والرقمنة | 14 |
| 5 | rouge | 📣 | Marketing, Communication & Créatif | التسويق والاتصال والإبداع | 14 |
| 6 | vert | 🧼 | Nettoyage & Hygiène | النظافة والصحة | 10 |
| 7 | noir | 🛡️ | Sécurité & Gardiennage | الأمن والحراسة | 9 |
| 8 | bleu | 🚚 | Logistique, Transport & Supply Chain | اللوجستيك والنقل وسلسلة الإمداد | 10 |
| 9 | vert | 🏗️ | BTP, Travaux & Aménagement | البناء والأشغال والتهيئة | 13 |
| 10 | vert | 🔧 | Maintenance Industrielle & Technique | الصيانة الصناعية والتقنية | 10 |
| 11 | noir | 📊 | Conseil & Stratégie d'Entreprise | الاستشارة واستراتيجية الأعمال | 10 |
| 12 | rouge | 📦 | Fournitures & Équipements (Achat B2B) | اللوازم والتجهيزات | 11 |
| 13 | rouge | 🍽️ | Restauration & Événementiel d'Entreprise | الإطعام وتنظيم المناسبات | 9 |
| 14 | bleu | 🛟 | Assurance & Gestion des Risques | التأمين وإدارة المخاطر | 8 |
| 15 | bleu | 🌍 | Import-Export & Commerce International | الاستيراد والتصدير والتجارة الدولية | 7 |
| 16 | vert | 🗂️ | Services Généraux & Support | الخدمات العامة والدعم | 8 |

Full sub-service lists (FR; AR mirrors FR in the current data):

- **1 Juridique:** Avocat d'affaires · Notaire · Huissier de justice · Conseil juridique d'entreprise · Rédaction & révision de contrats · Propriété intellectuelle, brevets & marques (INAPI) · Recouvrement de créances · Contentieux & litiges commerciaux · Droit du travail & droit social · Droit fiscal & douanier · Mise en conformité réglementaire & RGPD · Constitution & modification de sociétés · Traduction juridique assermentée
- **2 Comptabilité/Finance:** Expert-comptable · Commissaire aux comptes · Tenue de comptabilité externalisée · Gestion de la paie · Déclarations fiscales (G50, IBS, TVA, IRG) · Déclarations sociales (CNAS, CASNOS) · Audit financier & comptable · Contrôle de gestion & reporting · Conseil financier & levée de fonds · Montage de dossier bancaire & crédit · Domiciliation d'entreprise · Évaluation d'entreprise · Gestion de trésorerie
- **3 RH:** Cabinet de recrutement · Chasse de têtes · Travail temporaire & intérim · Externalisation complète RH (SIRH) · Formation professionnelle en entreprise · Conseil RH & organisation · Évaluation & bilan de compétences · Coaching de dirigeants & cadres · Team building · Gestion administrative du personnel · Médecine du travail
- **4 Informatique:** Développement de logiciels sur mesure · Développement web & e-commerce · Développement d'applications mobiles · Maintenance informatique & helpdesk · Infogérance & gestion de parc · Infrastructure réseau & câblage · Administration serveurs & systèmes · Cybersécurité & audit de sécurité · Hébergement, cloud & sauvegarde · Intégration ERP (SAP, Odoo, Dolibarr) · Intégration & paramétrage CRM · Data, BI & intelligence artificielle · Transformation & conseil digital · Vidéosurveillance IP & systèmes électroniques
- **5 Marketing:** Agence de communication globale · Marketing digital & gestion réseaux sociaux · Référencement SEO & publicité SEA · Community management & création de contenu · Production vidéo & motion design · Montage vidéo & post-production · Photographie professionnelle & corporate · Design graphique & identité visuelle · Branding & stratégie de marque · Rédaction & copywriting · Régie publicitaire & affichage urbain · Relations presse & média · Impression & PLV · Goodies & objets publicitaires
- **6 Nettoyage:** Nettoyage de bureaux & locaux professionnels · Nettoyage industriel & usines · Nettoyage de fin de chantier · Nettoyage de vitres & façades · Désinfection, dératisation & désinsectisation (3D) · Gestion & collecte des déchets · Fourniture de produits d'hygiène sanitaire · Entretien des espaces verts · Blanchisserie industrielle & pressing pro · Dégraissage de hottes & cuisines pro
- **7 Sécurité:** Société de gardiennage · Agents de sécurité & vigiles · Installation vidéosurveillance & alarme · Systèmes de contrôle d'accès · Sécurité incendie & extincteurs · Transport de fonds & valeurs · Sécurité événementielle · Conseil & audit de sûreté · Maître-chien & cynophile
- **8 Logistique:** Transport de marchandises (national) · Transit & dédouanement · Entreposage & stockage · Logistique & distribution · Livraison dernier kilomètre & coursier · Fret maritime, aérien & routier · Location de véhicules utilitaires & camions · Manutention & déménagement industriel · Location d'engins de levage · Gestion de flotte
- **9 BTP:** Entreprise de bâtiment (gros œuvre) · Aménagement & agencement de bureaux · Électricité industrielle & bâtiment · Plomberie & sanitaire · Climatisation, chauffage & froid (CVC) · Étanchéité & isolation · Peinture & revêtement professionnel · Faux plafonds, cloisons & menuiserie · Vitrerie & façades · Bureau d'études techniques & architecture · Suivi, contrôle & coordination de chantier · Terrassement & VRD · Métallerie, ferronnerie & serrurerie
- **10 Maintenance ind.:** Maintenance d'équipements industriels · Maintenance préventive & curative · Électromécanique & automatisme industriel · Maintenance de groupes électrogènes · Maintenance d'ascenseurs & monte-charges · Chaudronnerie & soudure industrielle · Usinage & fabrication de pièces · Calibrage, métrologie & contrôle · Maintenance CVC & froid commercial · Maintenance informatique industrielle (GMAO)
- **11 Conseil:** Conseil en management & organisation · Conseil en stratégie & business plan · Étude de marché & étude de faisabilité · Accompagnement à la création d'entreprise · Conseil en certification (ISO 9001, HACCP, ISO 14001) · Conduite du changement & transformation · Intelligence économique & veille · Conseil en financement & subventions (ANADE, ANGEM) · Optimisation des processus (Lean) · Conseil RSE & développement durable
- **12 Fournitures:** Fournitures de bureau · Mobilier de bureau & aménagement · Matériel informatique & bureautique · Équipements & machines industrielles · Consommables & pièces de rechange · Équipements de protection individuelle (EPI) · Matières premières · Emballage & conditionnement · Uniformes & vêtements de travail · Matériel médical & laboratoire · Énergie solaire & équipements
- **13 Restauration/Événementiel:** Restauration collective & cantine d'entreprise · Traiteur événementiel · Plateaux repas & livraison entreprise · Organisation de séminaires & conférences · Location de salles & espaces de réunion · Organisation de salons & stands · Location de matériel événementiel · Animation, sonorisation & spectacle · Agence de voyage d'affaires
- **14 Assurance:** Courtier en assurance entreprise · Assurance multirisque professionnelle · Assurance flotte automobile · Assurance responsabilité civile pro · Assurance transport & marchandises · Santé & prévoyance collective · Expertise & évaluation de sinistres · Conseil en gestion des risques
- **15 Import-Export:** Société d'import-export · Sourcing & approvisionnement international · Représentation commerciale & agent · Accompagnement domiciliation bancaire import · Conseil en commerce extérieur & douane · Inspection & contrôle qualité marchandises · Traduction commerciale & technique
- **16 Services généraux:** Secrétariat & assistance administrative externalisée · Centre d'appels & relation client (call center) · Numérisation & archivage de documents · Coursier & service de pli · Imprimerie & reprographie · Location de matériel bureautique · Gestion du courrier & domiciliation postale · Interprétariat & traduction

Note: the admin console independently tags providers with `cat` = 1..16 (`prestataire.cat` in `DATABASE_SCHEMA.md`), i.e. the same 16-family taxonomy is the join key between the two apps.

---

## 3. Concrete mock DATA worth reusing verbatim

All rows below are byte-identical between `lib/.../data/mock/*.dart` and `src/data/*.ts`. Money is DZD unless noted; wallet uses **crédits (1 DZD = 10 crédits)**. Dates seed to June/May 2026.

### 3.1 Client — Tenders (`MOCK_TENDERS`, covers every suivi status)

Shape: `{ id, familyId, serviceName, description, wilaya, delai, type: ponctuel|recurrent, recurrence?, budgetDzd?, status, createdAt, attachments[] }`

| id | fam | service | wilaya | délai | type | budget | status |
|---|---|---|---|---|---|---|---|
| AO-1042 | 6 | Nettoyage de bureaux & locaux professionnels | Alger | Sous 1 semaine | recurrent (Mensuel) | 180000 | **enCours** |
| AO-1037 | 4 | Développement d'applications mobiles | Oran | 2 à 3 mois | ponctuel | 950000 | **assigne** |
| AO-1031 | 7 | Société de gardiennage | Alger | Immédiat | recurrent (Annuel) | — | **contacte** |
| AO-1029 | 1 | Rédaction & révision de contrats | Constantine | Sous 72h | ponctuel | 120000 | **enAttente** |
| AO-1018 | 13 | Traiteur événementiel | Alger | Terminé | ponctuel | 430000 | **termine** |

### 3.2 Client — Wallet (`MOCK_WALLET`)

`balanceCredits: 2 350 000`, `subscriptionActive: false`. Ledger `{ id, type: recharge|deduction, amountCredits (always +), label, date, invoiceId? }`:

| id | type | crédits | label | date | invoice |
|---|---|---|---|---|---|
| TX-09 | deduction | 1 800 000 | Nettoyage bureaux — Juin 2026 | 2026-06-15 | FAC-2061 |
| TX-08 | recharge | 5 000 000 | Rechargement (admin de9de9) | 2026-06-01 | — |
| TX-07 | deduction | 1 800 000 | Nettoyage bureaux — Mai 2026 | 2026-05-15 | FAC-2055 |
| TX-06 | deduction | 4 300 000 | Traiteur séminaire annuel | 2026-05-30 | FAC-2040 |
| TX-05 | recharge | 5 000 000 | Rechargement (admin de9de9) | 2026-05-02 | — |

### 3.3 Client — Invoices (`MOCK_INVOICES`)

Shape `{ id, tenderId, label, amountDzd, issuedAt, occurrenceLabel? }`; UI derives `amountCredits = amountDzd × 10`.

| id | tender | label | DZD | issued | occurrence |
|---|---|---|---|---|---|
| FAC-2061 | AO-1042 | Nettoyage bureaux — Juin 2026 | 180000 | 2026-06-15 | Occurrence 2/12 |
| FAC-2055 | AO-1042 | Nettoyage bureaux — Mai 2026 | 180000 | 2026-05-15 | Occurrence 1/12 |
| FAC-2040 | AO-1018 | Traiteur séminaire annuel | 430000 | 2026-05-30 | — |

### 3.4 Client — KYC + form option lists

- `ClientKyc { rc, nif, nis, validated }` — repo (`client_profile_repository_impl.dart`) **starts un-validated** so the publish lock is visible, and `submitKyc` forces `validated:true` (any input passes). RC = Registre de commerce, NIF = N° identification fiscale, NIS = N° identification statistique.
- `WILAYAS` (publish form): Alger, Oran, Constantine, Annaba, Blida, Sétif, Béjaïa, Tizi Ouzou, Tlemcen, Batna, Ouargla, Ghardaïa.
- `DELAIS`: Immédiat, Sous 72h, Sous 1 semaine, Sous 1 mois, 2 à 3 mois, Flexible.
- `RECURRENCES`: Hebdomadaire, Mensuel, Trimestriel, Annuel.

### 3.5 Prestataire — Workers / effectif (`MOCK_WORKERS`)

`{ id, name, role, available (default true), colorHex }` — colorHex is the calendar/agenda tag color (Flutter stores ARGB int `0xFF……`, web stores `#……`).

| id | name | role | available | color |
|---|---|---|---|---|
| W1 | Karim Belkacem | Chef d'équipe | true | #E0A82E |
| W2 | Sofiane Haddad | Technicien | true | #2F9BE0 |
| W3 | Yacine Mansouri | Agent | true | #9B6BE2 |
| W4 | Nabil Cherif | Agent | **false** | #2E9E5B |
| W5 | Riad Toumi | Technicien | true | #E7464E |

### 3.6 Prestataire — B2C Reservations (`MOCK_RESERVATIONS`)

`{ id, clientName, serviceName, dateLabel, wilaya, status: recue|confirmee, priceDzd?, assignedWorkerId?, fromWonBid }`

| id | client | service | date | wilaya | status | DZD | worker | fromWonBid |
|---|---|---|---|---|---|---|---|---|
| R-2201 | Mme Lamia B. | Nettoyage appartement | 25 juin 2026 | Alger | recue | 6000 | — | false |
| R-2202 | M. Tarek H. | Réparation climatiseur | 26 juin 2026 | Blida | recue | 4500 | — | false |
| R-2185 | Mme Souad K. | Ménage hebdomadaire | 22 juin 2026 | Alger | confirmee | 5000 | W1 | false |
| R-2180 | M. Amine D. | Installation cuisine | 20 juin 2026 | Boumerdès | confirmee | 22000 | W2 | **true** |

### 3.7 Prestataire — Open offers & sent bids

`OpenOffer { id, serviceName, besoin, wilaya, budgetLabel, delai }`:
- O-501 Peinture appartement F4 · "Rafraîchissement complet, peinture mate blanche." · Alger · ≈ 60 000 DZD · Sous 2 semaines
- O-502 Déménagement villa · "Déménagement 3 niveaux avec démontage de meubles." · Oran · ≈ 35 000 DZD · Ce week-end
- O-503 Entretien jardin mensuel · "Taille, tonte et arrosage pour une grande villa." · Tipaza · ≈ 12 000 DZD / mois · Récurrent

`SentOffer { id, serviceName, prixDzd, delai, message, status: enAttente|retenue|refusee }`:
- S-301 Peinture bureau open-space · 48000 · 5 jours · "Disponible immédiatement, équipe de 3." · **enAttente**
- S-298 Réparation plomberie · 9000 · 48h · "Intervention rapide possible." · **retenue**
- S-290 Nettoyage fin de chantier · 30000 · 3 jours · "Matériel professionnel fourni." · **refusee**

### 3.8 Prestataire — B2B jobs (`MOCK_B2B_JOBS`)

`{ id, clientEntreprise, serviceName, occurrenceLabel, dateLabel, assignedWorkerId?, factureStatus, factureAmountDzd? }`

| id | entreprise | service | occurrence | date | worker | facture | montant |
|---|---|---|---|---|---|---|---|
| B2B-7012 | Hôtel El Djazaïr | Nettoyage des chambres | Occurrence 3/12 | 25 juin 2026 | — | **none** | — |
| B2B-7008 | SARL TechnoPlus | Maintenance climatisation | Ponctuel | 24 juin 2026 | W5 | **envoyee** | 18000 |
| B2B-6995 | Clinique Ennour | Désinfection des locaux | Occurrence 1/6 | 18 juin 2026 | W1 | **approuvee** | 26000 |

### 3.9 Prestataire — Annonces, Calendar, Revenue

`Annonce { id, title, serviceName, type: b2c|b2b, active }`:
- A-11 "Nettoyage professionnel de bureaux" / Nettoyage & Hygiène / b2b / active
- A-09 "Ménage à domicile" / Nettoyage appartement / b2c / active
- A-07 "Maintenance CVC entreprise" / Maintenance technique / b2b / active

`CalendarEvent { id, title, start(ISO), wilaya, source: b2c|b2b, assignedWorkerId? }` — 25 & 26 June 2026:
- E1 Nettoyage chambres — Hôtel El Djazaïr · 2026-06-25T09:00 · Alger · b2b · W2
- E2 Climatisation — Hôtel El Aurassi · 2026-06-25T14:00 · Kouba · b2b · W1
- E5 Mise aux normes électriques · 2026-06-25T16:00 · El Biar · b2c · W3
- E3 Maintenance climatisation — TechnoPlus · 2026-06-26T10:00 · Alger · b2b · W5
- E4 Réparation climatiseur — M. Tarek · 2026-06-26T16:00 · Blida · b2c · W3

`MONTHLY_REVENUE` (bar ratios): Jan 0.4 · Fév 0.55 · Mar 0.5 · Avr 0.7 · Mai 0.85 · Juin 0.95.
Stats screen hardcoded KPIs (not in a data file): Revenue **312 000 DZD**, Missions **48**, Rating **4.8/5**, Win-rate **62 %**.

---

## 4. Enums / status types and the S/V mapping

### 4.1 Flutter enums (client + prestataire)

Shared: `AppStatus {initial, loading, success, failure}` (`app_status.dart`); `UserRole {cliente, prestataire}` (`user_role.dart`, `.key`/`.fromKey`); `ButtonVariant/ButtonSize/ButtonState` (`button_enums.dart`); `CategoryColor {noir,bleu,vert,rouge}` (`theme/category_colors.dart`).

Client (`client/domain/entities/`):
- `TenderStatus { enAttente, contacte, assigne, enCours, termine }` — `.key` → `en_attente|contacte|assigne|en_cours|termine`; `.step` = ordinal index (drives the 5-dot timeline). Comment in source: "En attente → Contacté → Assigné → En cours → Terminé … `assigne` shows only that de9de9 assigned a professional — provider identity intentionally hidden (blind assignment)."
- `TenderType { ponctuel, recurrent }`
- `WalletTxType { recharge, deduction }`
- `ClientKyc.validated : bool` (gate: `canPublish == kyc.validated`)

Prestataire (`prestataire/domain/entities/`):
- `ReservationStatus { recue, confirmee }`
- `SentOfferStatus { enAttente, retenue, refusee }`
- `FactureStatus { none, envoyee, recue, approuvee, contestee }` — source comment: "Mirrors the Cliente Entreprise side: Envoyée → Reçue → Approuvée (or Contestée). `none` = not yet uploaded."
- `AnnonceType { b2c, b2b }`, `BookingSource { b2c, b2b }`

Web mirrors these as string-literal unions (same values), plus `TENDER_STATUS_ORDER` and `STATUS_META` (badge hex per status): enAttente `#9AA4B2`, contacte `#2F9BE0`, assigne `#7C5CFC`, enCours `#46B3AA`, termine `#3FB36B` (`src/lib/tenderStatus.ts`).

### 4.2 Admin canonical S/V pipeline (source of the codes)

From `commandes/schemas/commande.ts`, `WorklistPage.tsx` `STATUS_NUM`, and `docs/DATABASE_SCHEMA.md`:

Setup (S) — `commande.setup`, `setup_status`:
`arappeler` **S1** → `contacte` **S2** → `devis` **S3** → `assigne` **S4**

Occurrence (V) — `occurrence.status`, `occ_status` (per scheduled visit):
`added` **V0** → `toConfirm` **V1** → `confirmed` **V2** → `confirmedAssigned` **V3** → `doneNoInvoice` **V4** → `doneInvoiced` **V5** (`doneDisputed` **V5·C**) → `doneApproved` **V6** → `paid` **V7**; terminal `cancelled` **V✕**.

Supporting admin enums: `ball {client,pro,de9,done}` (whose action is pending), `devis_status {attente,recu,valide,refuse}`, `facture_status {doneInvoiced,doneDisputed,doneApproved,paid}`, `credit_type {rech,deb,vers}`, `kyc_status {verified,pending,rejected}`.

### 4.3 How the Flutter enums map to S/V

**Client `TenderStatus` → S/V** (the client sees a compressed, blind-assignment view — it never surfaces S3 `devis` and collapses the whole V-timeline into two states):

| TenderStatus | S/V code(s) | Admin meaning surfaced |
|---|---|---|
| `enAttente` | **S1** `arappeler` | Order received, de9de9 to call the client |
| `contacte` | **S2** `contacte` | de9de9 contacted; (S3 `devis` runs here, hidden from client) |
| `assigne` | **S4** `assigne` / **V3** `confirmedAssigned` | Provider assigned — identity hidden (blind) |
| `enCours` | **V2/V3/V4** `confirmed`→`doneNoInvoice` | Service scheduled/in progress |
| `termine` | **V6/V7** `doneApproved`/`paid` | Delivered & approved/paid |

**Prestataire `FactureStatus` → occurrence facture (V4→V7 tail):**

| FactureStatus | S/V code | occ_facture state |
|---|---|---|
| `none` | **V4** `doneNoInvoice` | realised, no invoice yet (`facture == null`) |
| `envoyee` | **V5** `doneInvoiced` | invoice deposited (`deposee: true`) |
| `recue` | **V5** `doneInvoiced` | received by de9de9 (intermediate; not driven in-app) |
| `contestee` | **V5·C** `doneDisputed` | disputed |
| `approuvee` | **V6** `doneApproved` | approved (→ V7 `paid`, provider gets 85 %, de9de9 15 %) |

**Prestataire `ReservationStatus` (B2C) → V (individual-client path):** `recue` ≈ **V1** `toConfirm` (new, needs accept/affecter); `confirmee` ≈ **V2/V3** `confirmed`/`confirmedAssigned` (after Affecter). B2C is the "de9de9 normal" consumer path and does not run the full S-setup pipeline.

**Prestataire `SentOfferStatus` (bidding) → devis analogue:** `enAttente` ≈ `devis_status.attente`, `retenue` ≈ `valide`/`chosen`, `refusee` ≈ `refuse`. A `retenue` bid materialises on the provider side as `Reservation(fromWonBid:true, confirmee)` (see G6).

**`WalletTxType` → `credit_type`:** `recharge` = `rech` (admin top-up, +), `deduction` = `deb` (invoice-linked, −); admin also has `vers` (`vers` = provider payout/versement) which has no client-app equivalent. Wallet unit is **crédits**, 1 DZD = 10 crédits (`CREDITS_PER_DZD = 10`; admin schema notes provider gets 85 %, de9de9 15 %).

### 4.4 Notable modelling gaps vs the admin S/V flow map (for the new app)

- Flutter has **no `devis`/S3 stage, no per-occurrence V-timeline, no `ball`, no audit trail, no dispute path on the client side**, and no `cancelled/V✕`. If the new app is meant to be S/V-faithful, the client suivi should expand from 5 flat states to the S1–S4 + V0–V7 model (still honoring blind assignment by masking provider identity from S4 onward).
- Provider identity is deliberately hidden client-side at `assigne`; keep that invariant when wiring the richer statuses.
- `recue`, `contestee`, `retenue`/`refusee` exist as enum values but have **no in-app transition** (admin-driven) — the new app should either drive them or clearly mark them as externally-set.

---

### Reference file paths

- Flutter catalogue: `…/de9de9-entreprise/lib/src/features/client/data/mock/mock_catalogue.dart`
- Flutter mocks: `…/client/data/mock/{mock_tenders,mock_wallet,mock_invoices}.dart`, `…/prestataire/data/mock/mock_prestataire.dart`
- Flutter enums/entities: `…/lib/src/shared/enums/`, `…/client/domain/entities/`, `…/prestataire/domain/entities/`
- Flutter routing/flow: `…/lib/src/routing/{app_routes,app_router}.dart`, `…/features/*/presentation/{screens,blocs}/`
- Web ported data: `…/de9de9-entreprise-web/src/data/*.ts`, `src/types/*.ts`, `src/theme/categoryColors.ts`, `src/lib/tenderStatus.ts`
- Admin S/V source: `…/react-projects/de9de9-enterprise/src/features/commandes/schemas/commande.ts`, `…/commandes/components/WorklistPage.tsx`, `…/docs/DATABASE_SCHEMA.md`