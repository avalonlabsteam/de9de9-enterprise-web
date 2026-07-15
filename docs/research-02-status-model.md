I have fully covered the canonical v1.6 spec plus the dedicated Status Model reference. The remaining concatenated blocks (complet 4, complet 5, dev2, dev3, De9De9 Implication) are older drafts superseded by "complet 6 — handicap last" (v1.6). Here is the report.

---

# STATUS MODEL & BUSINESS RULES
**DE9DE9 Entreprise — B2B services marketplace (Algeria)**
Source of truth: `DE9DE9 entreprise new app (1).md`, canonical block **"complet 6 — handicap last" (Version 1.6, 2026-06-30)** plus the dedicated **"Status Model & Numbering (developer reference)"** block. Older blocks (complet 4/5, dev2/dev3) are superseded drafts — do not use them where they conflict.

Global conventions (§Preamble): B2B services marketplace for Algeria, **orchestrated by phone by de9de9**. Bilingual **FR (primary) / AR (RTL)**. Credit-based payments. **Prose in English; all status names and product labels stay in French.**

---

## 1. Actors, front-ends, and the core principle

### 1.1 The three actors (§1.1)
| Actor | App | Role |
|---|---|---|
| **Cliente Entreprise** (buyer) | Entreprise app (client side) | Publishes appels d'offres, confirms visits, approves invoices, pays in credits. |
| **Prestataire Entreprise** (provider) | Entreprise app (provider side) | Sends quotes (devis), assigns workers, performs visits, deposits invoices, gets paid. |
| **de9de9 Admin / Commercial** | Admin panel | Orchestrator. A **superset operator**: can trigger *any* transition — including the client's and the prestataire's — **on their behalf**. Everything happens on the phone. |

### 1.2 The two front-ends (§1.1)
- **Entreprise app** — one app serving both client and prestataire; **login splits the two** sides.
- **Admin panel** — de9de9's orchestration console.

### 1.3 "One status, three projections + ball" principle (§1.2, ref §1)
- **One underlying status** = single source of truth (one number). It has **three projections** — the label the **Client**, **de9de9**, and the **Prestataire** each see. The admin changes the underlying status; **all three labels update together**.
- Each state also carries a **ball** = whose action is required to advance it: **Client (`C`)**, **de9de9 (`9`)**, or **Prestataire (`P`)**.
- **The derived demand badge** (the label the client sees on a whole demand) is **computed from its occurrences, never stored**.
- **No auto-confirm:** the client confirms every visit.
- **Audit everything** the admin does on behalf of another party.

---

## 2. The complete status state machine

### 2.1 Two levels + numbering (§2.1, ref §1–2)
- **`S` = Setup** (demand level, runs **once**): `S1 → S4`.
- **`V` = Visite** (occurrence level, **per visit**): `V0 … V7` + branches.
- The **number** = how far along; the **letter** = which level. **Happy path is the literal count-up:** `S1→S2→S3→S4→V1→V2→V3→V4→V5→V6→V7`.
- Rationale for the split: a demand runs `S1→S4` exactly once, but a **recurring** demand then runs `V1→V7` per visit (many times), so several occurrences can live at different `V` numbers simultaneously.

### 2.2 Setup track — master table (§2.3, ref §2)
| # | Statut (FR) | Code | Client label | de9de9 label | Prestataire label | Ball | Action → next |
|---|---|---|---|---|---|---|---|
| **S1** | En attente | `arappeler` | En attente | À rappeler | — | **de9** | Appeler le client → S2 |
| **S2** | Contacté | `contacte` | Contacté | Devis à demander | — | **de9** | Demander les devis → S3 |
| **S3** | Devis en cours | `devis` | Devis en cours | En attente des devis | Devis à envoyer | **Pro** | (devis reçus, validés) → S4 |
| **S4** | Assigné | `assigne` | Assigné | Devis transmis (attente choix) | Devis envoyé | **Client** | Choisir le prestataire → crée V1 |

### 2.3 Visite track — master table (§2.3, ref §2)
| # | Statut (FR) | Code | Client label | de9de9 label | Prestataire label | Ball | Action → next |
|---|---|---|---|---|---|---|---|
| **V0** | À planifier | `added` | Visite à planifier | Occurrence à planifier | — | **de9** | Planifier l'occurrence → V1 |
| **V1** | À venir — à confirmer | `toConfirm` | Prochaine visite à confirmer : [date] | En attente du client | En attente de confirmation client | **Client** | Confirmer la visite → V2 |
| **V2** | Confirmée — visite prévue | `confirmed` | Prochaine visite : [date] | Suivi de la visite | Visite à venir — affecter | **Pro** | Affecter **un ou plusieurs** ouvriers → V3 |
| **V3** | Ouvrier affecté | `confirmedAssigned` | Prochaine visite : [date] | Visite à marquer réalisée | Ouvrier(s) affecté(s) · visite à venir | **de9** | Marquer la visite réalisée → V4 |
| **V4** | Réalisée — sans facture | `doneNoInvoice` | En attente de la facture | Suivi de la facture | Facture à déposer | **Pro** | Déposer la facture → V5 |
| **V5** | Facture déposée — à approuver | `doneInvoiced` | Facture à approuver | En attente du client | En attente d'approbation | **Client** | Approuver la facture → V6 |
| **V5·C** | Facture contestée | `doneDisputed` | Facture contestée | Litige à résoudre | Facture contestée | **de9** | Résoudre → **V5** |
| **V6** | Approuvée — à régler | `doneApproved` | Terminé | Facture à régler | Paiement en attente | **de9** | Régler (pro + prestataire) → V7 |
| **V7** | Payée — Terminé | `paid` | Terminé | Terminé | Payé · Transféré | — | (terminal) |
| **V✕** | Annulée | `cancelled` | Annulée | — | — | — | (terminal) |

### 2.4 Branch semantics (ref §2 Branches)
- **V0 `added`** — entry **before** V1, only for **ad-hoc** occurrences added by the client. Normal recurring visits start **directly at V1**.
- **V5·C `doneDisputed`** — a **detour from V5**: the occurrence **stays at the V5 level**, **payment frozen**, ball → de9de9 (litige). On resolution it returns to **V5** (re-approvable). It keeps the V5 base number so it is clear where it branched from.
- **V✕ `cancelled`** — **terminal**. Reachable from **V0–V3** (i.e., before the visit happens).

### 2.5 Ball legend (§6, ref §3)
- **Client** decides **V1** (confirm) and **V5** (approve) — plus **S4** (choose prestataire).
- **Prestataire** does **S3** (send devis), **V2** (affecter), **V4** (deposit invoice).
- **de9de9** owns the **setup** (S1, S2) and back-office steps **V3** (realize), **V6** (settle), plus **litiges** (V5·C).

---

## 3. Full transition graph (from → to, action, actor)

From the Mermaid state diagram (§2.2) and transition-rules summary (ref §5):

**Setup chain**
- `[*] → S1` — demand created (client publishes an appel d'offres).
- `S1 → S2` — **de9de9**: "de9 appelle le client" (Appeler le client).
- `S2 → S3` — **de9de9**: "de9 demande les devis" (Demander les devis).
- `S3 → S4` — **Prestataire/de9de9**: devis reçus + **admin validates**, client can choose ("devis validés, client choisit").
- `S4 → V1` — **Client**: "Choisir le prestataire" — **creates the occurrence(s)**. Recurring demands create several occurrences, **each starting at V1** (no auto-confirm).

**Occurrence chain**
- `V0 → V1` — **de9de9**: schedules an ad-hoc occurrence ("de9 planifie (ajout ad-hoc)").
- `V1 → V2` — **Client**: "Confirmer la visite" — confirms the **appointment**, *not* that the service happened. Verrou: the prestataire may assign a worker only **from V2 onward**.
- `V2 → V3` — **Prestataire**: "Affecter un (ou plusieurs) ouvrier(s)".
- `V3 → V4` — **de9de9**: "Marquer réalisée".
- `V4 → V5` — **Prestataire**: "Déposer la facture" (deposits the service facture).
- `V5 → V6` — **Client**: "Approuver" (credits deducted at this step).
- `V6 → V7` — **de9de9**: "Régler (pro + prestataire)" — pays out and marks **Transféré**.
- `V7 → [*]` — terminal (fully closed).

**Dispute loop**
- `V5 → V5·C` — **Client**: "Contester" the invoice.
- `V5·C → V5` — **de9de9**: "Résoudre le litige" — returns to V5 (re-approvable). Payout is frozen while in V5·C.

**Cancel branches**
- `V1 → V✕`, `V2 → V✕`, `V3 → V✕` — "annuler". Per ref §5, cancellation is allowed on **V0–V3** (before the visit).

**Admin override rule (ref §5, §4C):** any transition can be triggered by the **admin on behalf of** the Client or Prestataire (phone-first); such actions are written to the audit log as **« fait par de9de9 pour le compte de [rôle] »**.

---

## 4. Derived demand badge cascade (client's list) (§2.4, ref §4)

The badge on a whole demand is **not stored** — it is derived from the demand's occurrences by an **urgency cascade** (**action before info**). The cascade decides **which occurrence to surface** when several are live. **Order (highest urgency first):**

| Priority | Badge (client) | Derived from |
|---|---|---|
| **1** | Facture à approuver | a **V5** occurrence |
| **2** | Prochaine visite à confirmer : [date] | the **nearest V1** |
| **3** | En attente de la facture | a **V4** |
| **4** | Facture contestée | a **V5·C** |
| **5** | Visite à planifier | a **V0** |
| **6** | Terminé | all occurrences at **V7** (or **V✕**) |
| (info) | Prochaine visite : [date] | **V2 / V3** when nothing above applies |
| (setup) | En attente / Contacté / Devis en cours / Assigné | **S1–S4** (no occurrences yet) |

**Progression ≠ priority** (critical for correctness): the S/V numbering is *progression order*; the cascade is *urgency order* and is deliberately different — e.g. **V5 outranks V1** (a pending invoice beats an upcoming visit). Keep the two concepts separate in code: number = where it is; cascade = what to show.

### Relationship matrix — whose turn (§2.5)
| Occurrence | Client | de9de9 | Prestataire |
|---|---|---|---|
| V0 | Visite à planifier | **Occurrence à planifier** | — |
| V1 | **Prochaine visite à confirmer** | En attente du client | En attente de confirmation client |
| V2 | Prochaine visite | Suivi | **Visite à venir — affecter** |
| V3 | Prochaine visite | **Marquer réalisée** | Ouvrier affecté |
| V4 | En attente de la facture | Suivi | **Facture à déposer** |
| V5 | **Facture à approuver** | En attente du client | En attente d'approbation |
| V5·C | Facture contestée | **Litige à résoudre** | Facture contestée |
| V6 | Terminé | **Facture à régler** | Paiement en attente |
| V7 | Terminé | Terminé | **Payé · Transféré** |

---

## 5. Business rules that affect the ENTREPRISE app (client + prestataire)

### 5.1 KYC gating for publishing (§4A p1/p7, §5.4)
- **Client** must validate **RC · NIF · NIS** before publishing an appel d'offres. Flow: `kycLock` (RC · NIF · NIS) → `kycSuccess`. This **gates S1** (creating a demand). Marked ⚠️ KYC-gated on Accueil (`cHome`).
- **Prestataire** has its own KYC/onboarding (Profil > onglet KYC shows verification status).

### 5.2 Credit-based payment model (PART 3)
- **Unit:** `1 DZD = 10 crédits` (fixed).
- **Recharge (crédits vendus):** admin tops up the client's wallet **manually** (cash/transfer + reference) — credits IN. **No in-app payment.** Admin attaches **two documents** per recharge: the client's **justificatif de paiement** and the **facture émise** by de9de9 (credit-purchase invoice), both viewable/downloadable; **alert if missing** (§4C Historique des crédits, changelog v1.2).
- **Débit:** at **V5 → V6** (client approves), credits are deducted from the client wallet.
- **Versement:** at **V6 → V7** (Régler), de9de9 pays out and marks **« Transféré »**. Split **85 % prestataire / 15 % marge de9de9** *(provisional rate)*. Each versement is **linked to the prestataire's service facture (the V5 invoice)** that generated it (changelog v1.3).
- **Marge de9de9 (« earned ») = débité − versé** *(stated as an assumption — commission rule to confirm).*
- **Contested invoice (V5·C) freezes payout** until resolved.
- **Client wallet page (`cWallet`):** Solde in credits + Historique of débits (linked to approved invoices).

### 5.3 No auto-confirm (§1.2, ref §5)
The client (or de9de9 on their behalf) confirms **every** visit at V1→V2. "Confirmer" means the **appointment is confirmed**, not that the service happened. (⚠️ The legacy Entreprise app misused "Confirmer" to mean *service done* — see §7.)

### 5.4 Multi-worker assignment V2→V3, editable until V4 lock (§2.3 note, §5.5, changelog v1.1)
- **Scope: prestataire app only** — the provider manages its **own** workers/team (`Équipe`).
- "Affecter un ouvrier" accepts **one or several** workers (multi-sélection; some jobs need a crew). Picker lists team members (avatar · name · skills/role · availability, checkboxes, search); confirm with **« Affecter (N) »**.
- **State effect:** occurrence becomes **V3 (Ouvrier affecté)** as soon as **≥ 1** worker is assigned. This is **not a new status/transition** — it just extends "1 worker" to "1..n".
- **Editable window:** add / remove workers while the visit is **not yet realized**; **locked at V4+** (visit done).
- **Worker is clickable → profile:** everywhere « Affecté à … » appears, each name/avatar opens that worker's read-only profile (skills, availability, ☎/WhatsApp, assigned missions). **Prestataire side only** — not in client or admin views.
- **Recurrence:** a default crew (professionnel attitré) can be set for the contract, with **per-occurrence override**.

### 5.5 Invoice deposit / approval / dispute (§4A p5, §4B p4, §2.3)
- **Prestataire** deposits the service facture at **V4→V5** ("Téléverser la facture" / upload → « Envoyée »).
- **Client** views/downloads PDF, sees Montant + **crédits débités**, then **approve** (V5→V6, credits debited) or **contest** (V5→V5·C).
- Client **Factures** page (`cFactures`) filters: Toutes / En attente / Approuvées.
- **Dispute resolution loop:** V5·C ball is de9de9's ("Litige à résoudre"); resolving returns to V5. Payout frozen throughout.

### 5.6 Recurrences — add / reschedule / cancel occurrences (§4A p2)
- On the **Demandes** detail, the client manages **Récurrence (occurrences)**: **confirmer · ajouter une récurrence · reprogrammer · annuler**.
- **Client actions that move statuses:** Choisir le prestataire (S4→V1), Confirmer la visite (V1→V2), Approuver / Contester la facture (V5→V6 / V5·C), **Ajouter / Reprogrammer / Annuler une occurrence**.
- Recurring demands spawn multiple occurrences each starting at V1 (no auto-confirm); the client leaves **one review per completed occurrence**.

### 5.7 Reviews / avis (§5.2)
- **Client:** when an occurrence reaches **Terminé (V6/V7)**, may leave **one review per occurrence** (recurring → one per completed visit).
- **de9de9:** can add a review on a prestataire (note + **mandatory comment**) anytime.
- **Visibility:** all reviews aggregate on the prestataire profile, visible to **admins only** (in Prestataires search) — **not to clients** for now. The provider card rating derives from these reviews.

### 5.8 Blind assignment / devis toggle (§4A p2, §5.1)
- **Devis flow (RFQ, S3):** admin sends the **same detailed brief** to all selected prestataires → they respond with quotes → **admin validates** the good ones → **only validated quotes become visible to the client** → client chooses → **S4**. Brief + non-validated quotes are visible to **admin + the concerned prestataire only**. Every doc (brief + each quote) is **viewable/downloadable as PDF**.
- On the client **Demandes** detail, devis has a toggle **« Aveugle / Propositions »** → then **choisir le prestataire**. "Aveugle" (blind) is the anonymized view of proposals before the client picks.

### 5.9 Handicap / waitlist inclusion (§5.7, changelog v1.6)
- **Orthogonal to the S/V lifecycle — no status.**
- **Prestataire side:** `Profil > Contracter des personnes en situation de handicap` → small form (contact · type de poste · nombre · zone · commentaire) → **« Rejoindre la liste »** → confirmation.
- **Admin side:** `Handicap` section — waitlist of all registered enterprises (entreprise · contact · type de poste · nombre · zone · date · commentaire · ☎/WhatsApp), enterprise name clickable → fiche prestataire, optional **« Contacté »** marker. **Admin-only.**
- **Privacy:** filled by the enterprise (its own contact + need); **no individual medical data** collected.

### 5.10 Sous-traitance / salariés (§5.6, changelog v1.5) — also entreprise-facing
- **Orthogonal to the order lifecycle — no status, no touch to invoices/credits.**
- **Prestataire side:** `Profil > Recruter des sous-traitants` → small form (**catégorie + sous-catégorie**) → **sends a demand** to admin (fill → send → confirmation, no status). Hired pros appear in **Équipe** as **salariés** with an **editable fiche** (heures, rôle, tarif…) + analytics, and are **assignable via the existing « Affecter un ouvrier » flow** (no new status).
- **Admin side:** `Sous-traitance` — two tables: **Demandes** (from enterprises, no status) and **Pros disponibles** (de9de9 pros opted into "sous-traitant pour grandes entreprises"), filterable by location · category · abandonment rate · services done · offers received/sent. **Manual match:** admin contacts pro → **« Ajouter comme salarié à [entreprise] »** (audited).
- **Deferred (not built):** the opt-in on the normal de9de9 app, and salariés receiving assignments as `commandes reçues`.

### 5.11 Contrat de partenariat (§4B p9, §4C p3, changelog v1.2–1.3)
- **Prestataire** consults its signed contract + **Signé / Non signé** status (Profil > onglet Contrat de partenariat). Uploaded by de9de9 on the admin side; the signed contract "assures the récurrence".

### 5.12 Prestataire B2C vs B2B (§4B p3–p4)
- **B2C tab** = de9de9 standard marketplace: Commandes reçues → Affecter un ouvrier / Refuser; Services confirmés; Explorer les offres (auction marketplace). Reservation states: **recues → confirmees** (separate from the S/V model).
- **B2B tab** = enterprise jobs assigned by admin: assign worker(s) at **V2**, upload invoice at **V4**; occurrence timeline mirrors the client (À confirmer → Confirmée → Réalisée → Facturée).

---

## 6. French product-label strings that MUST stay in French

**Setup status labels:** `En attente`, `À rappeler`, `Contacté`, `Devis à demander`, `Devis en cours`, `En attente des devis`, `Devis à envoyer`, `Assigné`, `Devis transmis`, `Devis envoyé`.

**Visite status labels:** `À planifier`, `Occurrence à planifier`, `Visite à planifier`, `À venir — à confirmer`, `Prochaine visite à confirmer : [date]`, `En attente du client`, `En attente de confirmation client`, `Confirmée — visite prévue`, `Prochaine visite : [date]`, `Suivi de la visite`, `Visite à venir — affecter`, `Ouvrier affecté`, `Visite à marquer réalisée`, `Réalisée — sans facture`, `En attente de la facture`, `Suivi de la facture`, `Facture à déposer`, `Facture déposée — à approuver`, `Facture à approuver`, `En attente d'approbation`, `Facture contestée`, `Litige à résoudre`, `Approuvée — à régler`, `Terminé`, `Facture à régler`, `Paiement en attente`, `Payée — Terminé`, `Payé · Transféré`, `Annulée`.

**Actions / buttons:** `Appeler le client`, `Demander les devis`, `Choisir le prestataire`, `Planifier`, `Confirmer la visite`, `Affecter un ouvrier` / `Affecter (N)`, `Marquer réalisée` / `Marquer la visite réalisée`, `Déposer la facture` / `Téléverser la facture`, `Approuver`, `Contester`, `Résoudre`, `Régler`, `Reprogrammer`, `Annuler`, `Ajouter une récurrence`, `Voir la facture`, `Évaluer`, `Proposer au client`, `Demander des devis`, `Rejoindre la liste`, `Voir en tant que`, `Agir pour…`, `Contacter de9de9`.

**Client nav & pages:** `Accueil · Demandes · Calendrier · Crédits · Factures · Profil`. **Client filters:** `Tous / Action requise / Facture en attente / En préparation / Terminées / Annulées`; toggle `Aveugle / Propositions`; `Carte « Action requise »`, `Publier un appel d'offres`, `Prochaine visite`.

**Prestataire nav & pages:** `Accueil · B2C · B2B · Calendrier · Profil` (+ `Annonces`, `Équipe`, `Statistiques`, `Devis`). Labels: `Commandes reçues`, `Services confirmés`, `Explorer les offres`, `Prochain service`, `Mes annonces`, `Affecté à …`, `Recruter des sous-traitants`, `Contracter des personnes en situation de handicap`, `Contrat de partenariat` (`Signé / Non signé`). **Devis statuses:** `En attente / Retenue / Refusée` (also `attente / retenue / refusee`).

**Admin nav & pages:** `Commandes · Prestataires · Sous-traitance · Handicap · Historique des crédits · Analytics crédits`. Ledger types: `Recharge / Débit facture / Versement`; `Justificatif de paiement`, `Facture émise`, `ventilation (85 % pro / 15 % marge)`; KPIs `vendus · dépensés · versés · marge · en circulation`; KPI banner `À rappeler · Litiges · Factures à régler · Commandes actives`; `File de travail`, `Console`, `Journal d'audit`, `Prochaine action`. Audit string: **« fait par de9de9 pour le compte de [Client / Prestataire], le [date] »**.

**Money term:** `1 DZD = 10 crédits`; `Solde`, `Historique des crédits`, `Transféré`.

**Code strings (kept in English — the enum codes, not to be translated but not FR labels either):** `arappeler, contacte, devis, assigne, added, toConfirm, confirmed, confirmedAssigned, doneNoInvoice, doneInvoiced, doneDisputed, doneApproved, paid, cancelled`; page codes `cHome, cSuivi, cCalendrier, cWallet, cFactures, cProfil, kycLock, kycSuccess`.

---

## 7. Critical implementation caveat (§2.6)

- **Admin panel:** implements the canonical model above (10 occurrence states incl. V3/V4). ✅
- **Entreprise app:** still on a **collapsed legacy model** (`avenir → confirmee → terminee`), **missing V2/V3/V4**, and with **"Confirmer" meaning *service done* instead of *appointment confirmed***. **Needs alignment.** Until aligned, the entreprise app and admin **disagree on the meaning of "Confirmer"** — this is the top correctness risk for the entreprise app.

**UX rule (§6):** S/V numbers are an **admin-only** aid. Client and prestataire see a **progress stepper + action-first one-liner** (« À vous : … » / « En attente : … »), **never the numbers**.

---

**Source file (absolute path):** `/Users/haithamattab/Desktop/DE9DE9 entreprise new app (1).md` — canonical content is the first block, lines 1–292 (v1.6) and the Status-Model reference, lines 566–668.