I have now read the entire prototype (all 3714 lines: template screens, modals/sheets, bottom navs, and the full JS state + logic). Here is the complete flow map.

---

# PROTOTYPE FLOW MAP — DE9DE9 Entreprise

Single-file interactive prototype. A JS `Component` holds one `state` object; `renderVals()` (Prestataire + shared) and `clientVals()` (Cliente Entreprise) derive boolean flags (`scrX`, `modalX`, `showNav`…) that a mustache/`<sc-if>` template switches on. There is one `screen` string, plus `modal`, `supportOpen`, and `toast` overlays. Bilingual FR/AR (`lang`); **all FR strings below are verbatim**. AR shown only where useful.

Navigation primitives:
- `navTo` (uses `data-screen`) / `go(screen)` — push current screen onto `stack`, then switch.
- `goBack` — pop `stack` (fallback `dashboard`).
- `setTab` (Prestataire bottom nav) / `setClientTab` (Client bottom nav) — switch screen AND clear `stack`.
- `cgo(screen)` — client push helper.
- Modals set `state.modal='…'`; `closeModal` clears it. `supportOpen` and `toast` are separate booleans.

---

## 1. Screen Inventory

`screen` id → human name → role. (Role: **AUTH** = shared onboarding, **PRES** = Prestataire/PlombEx, **CLI** = Cliente Entreprise/Hôtel El Aurassi.)

| # | screen id | Human name (FR header) | Role |
|---|-----------|------------------------|------|
| 1 | `login` | Se connecter (login) | AUTH |
| 2 | `roleChoose` | S'identifier en tant que | AUTH |
| 3 | `signup` | Créer une entreprise (pro signup) | AUTH→PRES |
| 4 | `kyc` | Vérifier mon entreprise (pro KYC) | PRES |
| 5 | `kycSuccess` | Demande envoyée ! (pro KYC done) | PRES |
| 6 | `dashboard` | Tableau de bord / Accueil | PRES |
| 7 | `equipe` | Mon effectif | PRES |
| 8 | `b2c` | B2C · Particuliers | PRES |
| 9 | `b2b` | B2B · Entreprises | PRES |
| 10 | `b2bDetail` | Détail de la mission | PRES |
| 11 | `annonces` | Annonces | PRES |
| 12 | `calendar` | Calendrier (pro) | PRES |
| 13 | `profil` | Profil entreprise (pro) | PRES |
| 14 | `stats` | Statistiques | PRES |
| 15 | `proDetail` | Gestion du professionnel | PRES |
| 16 | `workerProfile` | Profil de l'ouvrier | PRES |
| 17 | `createAnnonce` | Créer une annonce B2C / B2B | PRES |
| 18 | `assignAnnonce` | Affecter l'annonce | PRES |
| 19 | `agrandir` | Agrandir la société | PRES |
| 20 | `cSignup` | Créer un compte client | AUTH→CLI |
| 21 | `cKyc` | Vérifier mon entreprise (client KYC) | CLI |
| 22 | `cKycSuccess` | Entreprise vérifiée ! (client KYC done) | CLI |
| 23 | `cHome` | Que recherchez-vous ? (catalogue) | CLI |
| 24 | `cFamily` | Family detail / sous-services | CLI |
| 25 | `cPublish` | Appel d'offres (publier) | CLI |
| 26 | `cConfirm` | Appel d'offres envoyé ! | CLI |
| 27 | `cSuivi` | Mes appels d'offres | CLI |
| 28 | `cSuiviDetail` | Appel d'offres (fiche détail) | CLI |
| 29 | `cCalendrier` | Calendrier (client) | CLI |
| 30 | `cWallet` | Portefeuille | CLI |
| 31 | `cFactures` | Factures | CLI |
| 32 | `cProfil` | Profil entreprise (client) | CLI |

Role routing after `roleChoose` (`pickRole`, `data-role` = `cliente` | `prestataire`):
- `authMode==='signup'` → cliente → `cSignup`; prestataire → `signup`.
- `authMode==='login'` → cliente → `cHome`; prestataire → `dashboard`.

---

## 2. Per-Screen Detail

### AUTH / SHARED

**1. `login`** — Purpose: entry point.
- Logo "Deĝ De9" + "ENTREPRISE". Fields: **"Adresse e-mail"** (pre-filled `contact@plombex.dz`), **"Password"** (label literally "Password", value `123456789`, eye toggle). Link **"Mot de passe oublié ?"** (inert). Checkbox row **"Rester connecté"** → `toggleRest` (toggles `restConnecte`).
- **"Se connecter"** → `loginContinue` (sets `authMode:'login'`, → `roleChoose`).
- Google + Apple social icons (inert).
- Footer: "Pas encore membre? **Créer un compte**" → `goSignup` (sets `authMode:'signup'`, → `roleChoose`).

**2. `roleChoose`** — Purpose: pick account type. Header **"S'identifier en tant que"**. Back arrow → `goBack`.
- Card **"Client"** (`data-role="cliente"`) → `pickRole`.
- Card **"Professionnel"** (`data-role="prestataire"`) → `pickRole`.

**3. `signup`** (pro) — Header **"Créer une entreprise"** (back → `navTo login`). Note: "Un compte client est créé automatiquement avec votre compte professionnel."
- Fields: **Nom** (Mansouri), **Prénom** (Nadir), **Nom de l'entreprise** (PlombEx), **Registre de commerce** (16/00-1234567 B 24), **Email**, **Mot de passe**.
- **"Nombre de comptes professionnels désiré"** → options `3 / 4 / 5 / 6+` (`pickAccounts`, sets `desiredAccounts`).
- **"Créer mon entreprise"** → `navTo dashboard`. Footer "En continuant vous acceptez les conditions d'utilisation".

**4. `kyc`** (pro) — Header **"Vérifier mon entreprise"** (back). Info: "La vérification KYC débloque la publication d'annonces et la création de comptes professionnels." Docs list (`kycDocs`, each with **"Importer"**): **"Registre de commerce (RC)"** / "PDF ou photo"; **"NIF"** / "Numéro d'identification fiscale"; **"NIS"** / "Numéro d'identification statistique". CTA **"Soumettre la vérification"** → `navTo kycSuccess`.

**5. `kycSuccess`** (pro) — **"Demande envoyée !"** / "Votre dossier KYC est en cours de revue. Vous serez notifié dès la validation de votre entreprise." CTA **"Aller au tableau de bord"** → `navTo dashboard`.

### PRESTATAIRE

**6. `dashboard`** — Purpose: pro home. Header: logo + **"Vérifier mon entreprise"** pill → `navTo kyc`; bell icon (badge, inert).
- Company card "PlombEx" (verified badge). Stat trio: **"À venir" 9**, **"En cours" 3**, **"Complétés" 512**.
- **"Créer une annonce"** → `openCreatePick` (modal `createPick`).
- **"Mes annonces"** section + **"Tout voir"** → `navTo annonces`; list `mesAnnonces` (badge B2C/B2B).
- **"Mon équipe"** card `3/5` → `navTo equipe`.
- **"Chiffre d'affaire" 152 000 DA** card → `navTo stats`.
- Bottom nav shown.

**7. `equipe`** ("Mon effectif") — back. Card: **"Slots utilisés" {slotsUsed}/{slotsTotal}** + **"+ Agrandir"** → `navTo agrandir`. Team list (`team`), three member states:
- **active**: buttons **"Voir plus"** → `openProDetail` (→ `proDetail`) and **"Supprimer"** → `removeMember` (converts to empty slot). Salarié badge **"🤝 de9de9"** if `type==='salarie'`; role line "{role} · Salarié de9de9".
- **pending**: "En attente de création…" / "Le professionnel doit créer son compte"; copy-link row `de9de9.dz/join/{token}` → `copyLink` (label **"Copier"** → **"✓ Copié"** for 1.6s).
- **empty**: **"Ajouter un professionnel"** → `generateLink` (creates pending token).

**8. `b2c`** ("B2C · Particuliers", sub "Clients particuliers — le de9de9 normal") — 3 segmented tabs via `setB2cTab` (`b2cTab`):
- **"Commandes reçues"** (`recues`): cards from `recues` (client, category, date/time, **"Services"** list). **"Voir les détails"** → `openAffecter` (ctx `res`) → **Affecter** modal. Empty: "Aucune commande reçue".
- **"Explorer les offres"** (`explorer`): sub-pills via `setExplorerTab` (`explorerTab`):
  - **"Voir les offres"** (`voir`): search "Rechercher", **"Categories :"** chips (`filterCats`: Nettoyage, Plomberie, Climatisation, Gardiennage), **"Zones :"** chips (Alger, Oran, Blida), `openOffres` cards each with **"Postuler"** → `openPostuler` → **Postuler/Envoyer une offre** sheet.
  - **"Offres envoyées"** (`envoyees`): `sentOffres` with status badges **"En attente"** / **"Retenue"** / **"Refusée"**.
- **"Services confirmés"** (`confirmes`): `confirmees` cards, **"Affecté à"** worker chips → `openWorker` (→ `workerProfile`), **"Modifier l'affectation"** → `openAffecter` (ctx `confirmed`). Empty: "Aucun service confirmé".
- **FAB "+"** (teal, `data-ct="b2c"`) → `openCreate` → `createAnnonce` (B2C).

**9. `b2b`** ("B2B · Entreprises", sub "Missions assignées par de9de9 (clients entreprises)") — filter chips (`b2bFilters`, `setB2bStatus`→`b2bFilter`): **"Toutes"**, **"Action requise"**, **"En attente"**, **"Terminées"**. Cards (`b2bJobs`, sorted by `kindRank`) → `openB2BDetail` (→ `b2bDetail`). Each card shows client + lead badge, service, occurrence, occ-state badge, facture badge. Empty: "Aucune mission dans cette catégorie". **FAB "+"** (blue, `data-ct="b2b"`) → `openCreate` → `createAnnonce` (B2B).

**10. `b2bDetail`** ("Détail de la mission", back) — driven by `b2bCardModel(job)`:
- Header card: client, service, occurrence; facture badge; **"☎ / WhatsApp · Contacter de9de9"** → `b2bAction` (`act=contact` → opens Support).
- **"Affecté à"** worker chips (→ `openWorker`) when `hasWorker`.
- Progress frise (steps **"Confirmée" / "Réalisée" / "Facturée" / "Payé"**), lead badge (**"À vous" / "En attente" / "Terminé" / "Annulée"**), action phrase. Contestée shows motif note "Motif : …".
- **Primary button** (`b2bAction`, `data-act=primaryAct`) by status: `confirmee`→**"Affecter un ouvrier"** (`affecter`); `realisee`→**"Téléverser la facture"** (`upload`); `contestee`→**"Re-téléverser la facture corrigée"** (`upload`). Others: none.
- **Secondary buttons** (`secs`): **"Voir le détail"** (`detail`, toast), **"Contacter de9de9"** (`contact`→Support), **"Changer l'ouvrier"** (`changer`→Affecter), **"Voir la facture"** (`facture`, toast), **"Re-téléverser (corriger)"** (`upload`→Upload), **"Voir le motif"** (`motif`, toast).
- **"Détails de l'occurrence"**: Adresse, Date / heure, Fréquence, Instructions.
- **"Historique des occurrences"** when present (dates + "Réalisée"/"Payée").

B2B occ-state labels by status: `avenir`→"À venir", `confirmee`→"Confirmée", `affecte`→"Ouvrier affecté", `realisee`→"Réalisée", `deposee`→"En attente d'approbation", `contestee`→"Facture contestée", `approuvee`→"Approuvée", `payee`→"Terminée", `annulee`→"Annulée". Facture badges: "Aucune facture" / "Facture déposée" / "Facture contestée" / "Facture approuvée" / "Payée".

**11. `annonces`** — back, header **"Annonces"**. Tabs (`setAnnonceTab`, `annonceTab`): **"Mes annonces"** (`mine`) and **"Missions des pros"** (`pros`).
- `mine`: **"+ Créer une annonce"** → `navTo createAnnonce`; `mesAnnonces` cards with **"Modifier"** / **"Supprimer"** (inert).
- `pros`: "Missions assignées à chaque salarié par de9de9"; `prosWithJobs` accordion rows → `togglePro`; expanded shows **"Missions à venir"** / **"Missions passées"** with tags "À venir"/"Terminé", B2C/B2B chips; empty "Aucune mission assignée".

**12. `calendar`** (pro) — header **"Calendrier"** / "Avril 2025". Week strip (static). Source filter pills (`setCalSource`, `calSource`): **"Tous" / "B2C" / "B2B"**. Employee filter chips (Tous, Samir, Karim, Yacine — static). Timeline `calendarSlots` (filtered by source).

**13. `profil`** (pro) — header **"Profil entreprise"**. Company card (PlombEx, "Maintenance domestique · Alger"), warning "En attendant la mise à jour du logo, le badge des pros change aussi".
- Rows (`profileRows`, inert): "Informations de l'entreprise", "Vérification KYC", "Mon effectif", "Notifications", "Paramètres".
- **"Recruter des sous-traitants"** ("Renfort d'effectif · pros de9de9") → `openRecruter` (sheet).
- **"Contracter des personnes en situation de handicap"** ("Rejoignez la liste — de9de9 vous recontacte") → `openHandicap` (sheet).
- **"Contrat de partenariat"** card (badge **"✓ Signé"**), file `contrat-partenariat-plombex-signe.pdf`, Signature 18/02/2026 / Échéance 18/02/2027; **"👁 {contractPreviewLabel}"** → `toggleContractPreview` (label toggles **"Voir le contrat"** ↔ **"Masquer le contrat"**, reveals read-only preview); **"⤓ Télécharger"** → `downloadContract` (toast "Téléchargement du contrat simulé").
- **"Se déconnecter"** → `navTo login`.

**14. `stats`** — back, **"Statistiques"**. Gradient CA card "152 000 DA · ▲ +12% ce mois". **"Voir par employé"** → `navTo equipe`. **"CA par catégorie"** (`catStats`) + **"CA par service"** (`serviceStats`) bar lists.

**15. `proDetail`** ("Gestion du professionnel", back) — member `detailPro`. Header card (name, role, badge **"● Actif"**); if salarié: badge "🤝 Salarié / sous-traitant de9de9". **"Fiche — éditable"**: inputs Rôle / Heures travaillées / Tarif / Disponibilité → `setMemberField` (live-updates `team`). If salarié: **"Analytics"** (Missions réalisées, Satisfaction %, Délai de réponse). **"Statistiques"** (CA global, Sollicitations 47), **"CA par sous-catégorie"** (`detailCatStats`), Offres postulées 12 / Offres retenues 7. **"Missions assignées"** À venir / Passées.

**16. `workerProfile`** ("Profil de l'ouvrier", back) — read-only worker (`workerProfile`, opened via `openWorker`). Avatar, name, role, ★note badge, availability badge. **"Compétences"** chips. **"Contact"**: **"Appeler"** + **"WhatsApp"** (inert) + phone. **"Missions affectées"**: "En cours / à venir" / "Passées"; empty "Aucune mission affectée".

**17. `createAnnonce`** — back, title `createTitle` = **"Créer une annonce B2C"** or **"Créer une annonce B2B"** (`createType`).
- B2C body: photo uploader, **"Titre de l'annonce"** (Installation climatisation), **"Catégorie"** chips (❄️ Climatisation / 🚿 Plomberie / ⚡ Électricité), **"Description"**, **"Services & tarifs"** rows + **"+ Ajouter un service"**.
- B2B body: purple note "Annonce destinée aux clients entreprises (B2B) routés par de9de9."; **"Titre de l'offre"**, **"Familles & catégories"** chips, **"Wilayas / zone de couverture"** chips, **"Capacité / volume traitable"**, **"Certifications & agréments"**, **"Mode de tarification"** (Sur devis / Sur demande), **"Références"**.
- **"Affecter à un professionnel"** row → `navTo assignAnnonce`; summary `assignSummary` = "Optionnel · annonce au nom de la société" or "{n} professionnel(s) sélectionné(s)".
- **"Publier l'annonce"** → `submitCreate` (modal `created`).

**18. `assignAnnonce`** ("Affecter l'annonce", back) — "Sélectionnez le ou les professionnels qui auront cette annonce." List `assignProsList` (`toggleAssignPro`, checkbox). **"Valider ({assignCount})"** → `goBack` (returns to createAnnonce, keeps selection).

**19. `agrandir`** ("Agrandir la société", back) — 🚀 note "Besoin de plus de slots professionnels ? …". Fields: Nom de la société, Numéro de téléphone, Email, Pro actuels / Pro désirés. **"Envoyer la demande"** → `submitAgrandir` (modal `agrandirSent`).

### CLIENTE ENTREPRISE

**20. `cSignup`** ("Créer un compte client" = `t.signupTitle`, back) — "Espace acheteur B2B — hôtels, entreprises et grands comptes." Fields: Nom (Khelifi), Prénom (Amel), Nom de l'entreprise (Hôtel El Aurassi), Registre de commerce (RC), Numéro de téléphone, Email, Mot de passe. **"Créer mon compte"** → `navTo cKyc`.

**21. `cKyc`** ("Vérifier mon entreprise" = `t.kycTitle`, back) — info `t.kycBody` "Importez RC · NIF · NIS pour débloquer la publication." Docs: **"Registre de commerce (RC)"** / "PDF ou photo", **"NIF"** / "N° d'identification fiscale", **"NIS"** / "N° d'identification statistique", each **"Importer"**. CTA `t.kycSubmit` **"Soumettre la vérification"** → `submitClientKyc` (sets `kycValidated=true`) → `cKycSuccess`.

**22. `cKycSuccess`** — badge check, `t.kycSuccessTitle` **"Entreprise vérifiée !"**, `t.kycSuccessBody` "Vous pouvez maintenant publier vos appels d'offres." CTA `t.kycSuccessCta` **"Parcourir le catalogue"** → `afterClientKyc` → `cHome`.

**23. `cHome`** (catalogue) — Header: logo + tag `t.clientTag` **"CLIENT"**; language pill `langLabel` ("🌐 العربية"/"🌐 Français") → `toggleLang`; support icon → `openSupport`; avatar "EL" (`data-ctab="profil"`) → `setClientTab` (→ `cProfil`).
- Title `t.catTitle` **"Que recherchez-vous ?"**, sub `t.catSub` **"16 familles de services B2B"**.
- Search input placeholder `t.searchPh` "Rechercher un service…" (`setCatSearch`/`clearCatSearch`). When query present → dropdown `catResults` (family match → `openFamily`, sub match → `openSearchSub`); kind badges `t.searchCatLabel` "Catégorie" / `t.searchSubLabel` "Service". No results → `t.searchNoRes` "Aucun résultat" + button `t.elseTitle` "Je cherche autre chose" → `openSupport`.
- Browse mode (no query):
  - If `kycLocked` (`!kycValidated`): amber banner → `navTo cKyc`. `t.kycLockTitle` "Vérification requise", `t.kycLockBody` "Validez RC · NIF · NIS pour publier un appel d'offres.", `t.kycVerify` "Compléter la vérification".
  - If `kycOk`: green badge `t.kycOk` "Entreprise vérifiée".
  - **"Top catégories du mois"** (`t.topTitle`) — `topFamilies` (ids 6,9,7,4) → `openFamily`.
  - **"Toutes les catégories"** (`t.allCatsTitle`) — 16-family grid (`families`) → `openFamily`.
  - **"Je cherche autre chose"** (`t.elseTitle`) card: **"WhatsApp"** + `t.callShort` "Appeler" — both → `openSupport`.

**24. `cFamily`** — back, family name, support icon. Family header (icon, cat label, `t.chooseSub` "Sélectionnez un ou plusieurs services"). `famSubs` rows → `toggleSub` (multi-select, `selectedSubs`). Sticky CTA `publishCtaLabel` = `t.publishCta` **"Publier un appel d'offres"** (+ count) → `goPublish`. `goPublish` logic: no subs → return; `!kycValidated` → `cKyc`; else → `cPublish`.

**25. `cPublish`** — back, `t.ficheTitle` **"Appel d'offres"**. Fields: `t.familleLabel` "Famille & catégorie" (chips), `t.descLabel` "Description détaillée du besoin", `t.wilayaLabel` "Wilaya / lieu d'exécution", `t.delaiLabel` "Délai souhaité", `t.budgetLabel` "Budget estimatif (optionnel)".
- `t.typeLabel` "Type de besoin" → **"Ponctuel"** (`t.ponctuel`) / **"Contrat récurrent"** (`t.recurrent`) via `setPublishType`. If recurrent: `t.freqLabel` "Fréquence" chips **Hebdomadaire / Mensuel / Trimestriel / Annuel** (`setRecurrence`).
- `t.docsLabel` "Documents joints", `t.critLabel` "Critères de sélection prioritaires".
- CTA `t.submitPublish` **"Envoyer l'appel d'offres"** → `submitPublish` → `cConfirm`.

**26. `cConfirm`** — badge `t.st_attente` **"En attente"**, `t.confirmTitle` **"Appel d'offres envoyé !"**, `t.confirmBody` "Merci, nous vous contacterons sous 1 à 2h maximum." CTA `t.seeSuivi` **"Suivre ma demande"** → `afterConfirm` → `cSuivi` (clears stack + `selectedSubs`).

**27. `cSuivi`** ("Mes appels d'offres" = `t.suiviTitle`) — avatar + support. `t.suiviHint` "Suivez l'avancement de vos demandes". Filter chips (`suiviFilters`, `setSuiviFilter`→`suiviFilter`), each "{label} · {count}": **"Tous"** (`all`), **"Action requise"** (`action`), **"Facture en attente"** (`wait`), **"En préparation"** (`setup`), **"Terminées"** (`done`), **"Annulées"** (`cancelled`). Cards `suiviView` → `openSuivi` (→ `cSuiviDetail`); dynamic status badge from `computeDemandBadge`. Empty `t.suiviEmpty` "Aucune demande dans cette catégorie."

**28. `cSuiviDetail`** — back, `t.ficheTitle` "Appel d'offres", support. Header card (cat, wilaya, date, derived status badge). Then phase-dependent (from demand `status`):
- **SETUP timeline** (`showSetupTimeline` = not active): frise `setupSteps` **"En attente" → "Devis en cours" → "Assigné"** (`ST` labels).
- **Assigned line** (`showAssignedLine`, active phase): "✓ {prestAssignedLabel}" ("Prestataire assigné") + provider card.
- **"Prochaine action"** card (`t.nextActionTitle`). Content by status:
  - `attente`: `t.attTitle` "Demande reçue" / `t.attBody`.
  - `devis`: `t.devisTitle` "Devis en cours" / `t.devisBody`.
  - `assigne`: `t.assignTitleProp` "Propositions reçues" / `t.assignHintProp`.
  - `encours`: `t.encTitle` "Prestation en cours" (+ visit frise via `buildFrise`).
  - `confirme`: `t.confTitle` "Prestation confirmée".
  - `termine`: `t.termTitle` "Prestation terminée".
  - `annule`: `t.annuleTitle` "Demande annulée" / `t.annuleBody`.
- **Early actions** (`isEarly` = attente|devis): **"Modifier la demande"** (`t.actModifier`) → `editDemand` (→ `cPublish`); **"Contacter le support"** (`t.actContactSupport`) → `openSupport`; **"Annuler la demande"** (`t.actAnnuler`) → `openCancel` (modal).
- **Provider selection** (`showProvider`, when `assigne`): proposals list `proposals` → `chooseProposal`; each with devis line `t.devisMontant` "Montant du devis" / `t.devisDelai` "Délai proposé" and **"Voir le devis"** (`t.voirDevis`) → `openDocView` (devis viewer). CTA `t.confirmProvider` **"Confirmer le prestataire"** → `confirmProvider` (sets demand → `encours`).
- **Recurrence** (`showRecurrence` = recurrent & active): title `t.recurTitle` "Récurrence", pattern text, layout toggle (`toggleRecurLayout`: **timeline** vs **sections**).
  - Timeline: `occurrences` list with per-occ status badges and contextual actions (see below), plus **"+ Ajouter une récurrence"** (`t.addRecur`) → `openAddRecur`.
  - Sections layout: collapsible **"Dernier service"** (`t.secDernier`), **"Prochain service"** (`t.secProchain`), **"+ Ajouter une récurrence"**, **"Historique"** (`t.secHistorique`), and **"Contacter le support"** (`toggleRecurSec` per section).
  - Per-occurrence controls: **"Confirmer la visite"** (`t.occConfirmer`, `confirmable`) → `confirmOcc`; **"Reprogrammer"** (`t.occActReprog`) → `openAddRecur` (reschedule); **"Annuler"** (`t.occActAnnuler`) → `cancelOcc`; facture card (`showFacCard`) with `t.facVoir` **"Voir / Télécharger la facture"** → `openFacAction`, and if awaiting: **"Approuver"** (`t.facApprouver`) → `openApproveOcc` and **"Contester"** (`t.facContester`) → `openContestOcc`; review CTA `t.laisserAvis` **"Laisser un avis"** → `openClientReview`; reviewed state shows stars + `t.avisEnvoye`. Info chips: "📅 Prochaine visite : …" (`t.prochaineVisite`), "🧾 {t.occFacWaiting}", "⏳ {t.occNestedNote}".
- **Ponctuel facture** (`showPonctFac` = ponctuel & termine): facture card with approve/contest/review.
- **"Contacter le support"** (`showSupportBtn`).
- **"Voir les factures"** (`t.voirFactures`, `showTermineLink` = termine & recurrent) → `voirFactures` (→ `cFactures`).

**29. `cCalendrier`** — `t.calTitle` "Calendrier", month label, avatar. `t.calHint` "Vos prestations confirmées". Date strip `calStrip` → `pickCalDate`; agenda `calAgenda` cards → `openCalDetail` (→ `cSuiviDetail`), badge `t.calConfirmBadge` **"Confirmé"**. Empty `t.calEmpty`.

**30. `cWallet`** ("Portefeuille" = `t.walletTitle`) — avatar + support. Balance card: `t.balance` "Solde actuel", `−12 500` `t.creditsUnit` "crédits", "≈ … DZD · 1 DZD = 10 crédits". `walletNeg` warning `t.negWarn`. Abonnement card: `t.abonTitle` "Abonnement annuel", `t.abonBody`, "480 000 crédits / an", CTA `t.abonCta` "Choisir l'abonnement" (inert). Note `t.topupNote` (recharges manual, no in-app payment). `t.histTitle` "Mouvements" — `history` list (Rechargement / Facture deductions).

**31. `cFactures`** ("Factures" = `t.facturesTitle`) — avatar + support. `t.facturesHint`. Filter pills (`facFilters`, `setFacturesFilter`→`facturesFilter`): **"Toutes"** (`all`), **"En attente"** (`waiting`), **"Approuvées"** (`approved`), **"Contestées"** (`contested`) + counts. `factures` cards → `openDocView` (viewer). Status badge `facStatutLabel` ("En attente de confirmation" / "Approuvée→Confirmée label" / "Contestée"), credits badge "↓ −{credits} crédits", "⟳ {occ}". Empty `t.facFilterEmpty`.

**32. `cProfil`** ("Profil entreprise" = `t.profilTitle`) — company card "Hôtel El Aurassi", "Cliente Entreprise · Alger". Support banner → `openSupport` (`t.supportRow` "Support & contact", "0560 00 00 00 · 7j/7"). Rows `profileRowsClient` (all → `toggleLang`): "Informations de l'entreprise", "Vérification KYC" (badge ✓ if validated), "Abonnement & crédits", "Support & contact", "Langue", "Notifications". **"Se déconnecter"** (`t.logout`) → `clientLogout` (→ `login`, clears stack).

---

## 3. Bottom Nav / Tab Structure

**Prestataire shell** (`showNav` when `screen ∈ {dashboard, b2c, b2b, calendar, profil}`; `setTab` switches screen + clears stack). Order + labels:
1. **"Accueil"** → `dashboard`
2. **"B2C"** → `b2c` (+ teal FAB "+" → create B2C)
3. **"B2B"** → `b2b` (+ blue FAB "+" → create B2B)
4. **"Calendrier"** → `calendar`
5. **"Profil"** → `profil` (avatar "PlombEx")

**Client shell** (`showClientNav` when `screen ∈ {cHome, cSuivi, cCalendrier, cWallet, cFactures, cProfil}`; `setClientTab`, map `home→cHome, suivi→cSuivi, calendrier→cCalendrier, wallet→cWallet, factures→cFactures, profil→cProfil`). Order + labels (FR):
1. **"Accueil"** (`t.navHome`) → `cHome`
2. **"Demandes"** (`t.navSuivi`) → `cSuivi`
3. **"Calendrier"** (`t.navCalendrier`) → `cCalendrier`
4. **"Crédits"** (`t.navWallet`) → `cWallet`
5. **"Factures"** (`t.navFactures`) → `cFactures`

Note: `cProfil` has no bottom-nav item — reached via the "EL" avatar in headers (`data-ctab="profil"`). The nav bar still renders while on `cProfil`.

---

## 4. Modal / Sheet Inventory

All set `state.modal` (except Support = `supportOpen`, Toast = `toast`). Backdrop tap → `closeModal`/`closeSupport`; inner tap `stop`.

1. **Recruter des sous-traitants** (`modal:'recruter'`, sheet) — Trigger: `openRecruter` (pro Profil). Contains: Catégorie / Sous-catégorie selects (`recruterCats()`), Zone/Nombre/Note. Confirm **"Soumettre la demande"** → `submitRecruter`: validates cat+sub (else toast "Choisissez catégorie et sous-catégorie") → `modal:'recruterSent'`.
2. **Demande envoyée (recruter)** (`modal:'recruterSent'`) — "Demande envoyée" / "Votre demande de sous-traitance a été transmise à de9de9…". **"OK"** → `closeRecruterSent` (clears + resets form).
3. **Waitlist handicap** (`modal:'handicap'`, sheet) — Trigger: `openHandicap` (pro Profil). Contains: legal/benefit info ("quota légal de 1 %", "avantages fiscaux"), contact/phone/email/poste/nombre/zone/commentaire fields. Confirm **"Rejoindre la liste"** → `submitHandicap`: validates contact+poste+zone (else toast "Renseignez contact, poste et zone") → `modal:'handicapSent'`.
4. **Waitlist envoyée** (`modal:'handicapSent'`) — "Merci, nous vous recontacterons." **"OK"** → `closeHandicapSent`.
5. **Choisir type d'annonce** (`modal:'createPick'`, sheet) — Trigger: `openCreatePick` (dashboard "Créer une annonce"). Header **"Type d'annonce"** / "Pour quel espace souhaitez-vous publier ?". Options **"Annonce B2C"** / **"Annonce B2B"** → `pickCreateType` (sets `createType`, → `createAnnonce`). ✕ → `closeModal`.
6. **Postuler / Envoyer une offre** (`modal:'postuler'`, sheet) — Trigger: `openPostuler` (B2C explorer "Postuler"). Header **"Envoyer une offre"** + "{service} · {wilaya}". Fields: **"Prix proposé (DZD)"**, **"Délai proposé"** (Sous 5 jours), **"Message"**. Confirm **"Envoyer l'offre"** → `submitPostuler` (`closeModal`).
7. **Téléverser la facture (B2B)** (`modal:'b2bUpload'`, sheet) — Trigger: `openB2BUpload` / `b2bAction act=upload` (b2bDetail). Title `t.facUpload` "Téléverser la facture". Stages (`upStage`): **idle** drop-zone → `upChooseFile`; **selected** file card + `t.upMontantLabel` "Montant (DZD)" + `t.upOccRef` "Référence occurrence" + **"Envoyer la facture"** (`t.upSend`) → `upSend`; **uploading** spinner `t.upUploading`; **success** `t.upSuccessTitle` "Facture envoyée !" + **"OK"**. On success: sets `b2bFacture[job]='Envoyée'`, `b2bStatus[job]='deposee'`.
8. **Affecter (un ou plusieurs ouvriers)** (`modal:'affecter'`, sheet) — Trigger: `openAffecter` (B2C recues ctx `res` / confirmées ctx `confirmed`) or `b2bAction act=affecter|changer` (ctx `b2b`). Header **"Affecter un ou plusieurs ouvriers"** / "Sélectionnez les membres de votre équipe". Search "Rechercher par nom ou compétence" (`setAffecterSearch`). List `assignList` (`pickMember` toggles `selectedMembers`). Confirm `affecterLabel` **"Affecter ({count})"** → `confirmAffecter`. Branches: ctx `b2b` → set `b2bWorker`/`b2bStatus='affecte'`; ctx `confirmed` → update `confirmees.proIds`; ctx `res` → if any busy member → **Conflit** modal, else `assign()` (moves recue → confirmées, switches to `confirmees` tab).
9. **Conflit d'horaire** (`modal:'conflict'`) — Trigger: busy member in `confirmAffecter`. "Conflit d'horaire" / "Ce professionnel a déjà une tâche au même moment." **"Revenir"** → `closeModal`; **"Continuer"** → `forceAffecter` (calls `assign`).
10. **Annonce publiée** (`modal:'created'`) — Trigger: `submitCreate`. "Annonce publiée !" **"Voir mes annonces"** → `afterCreate` (→ `annonces`, clears `assignPros`).
11. **Agrandir envoyée** (`modal:'agrandirSent'`) — Trigger: `submitAgrandir`. 🎉 "Merci pour votre demande". **"Retour à l'effectif"** → `afterAgrandir` (→ `equipe`).
12. **Visionneuse facture / devis** (`modal:'docView'`, full-panel) — Trigger: `openDocView` / `openFacAction` (cFactures, occ facture cards, proposals devis). Shows doc header, `t.docMontant` "Montant", meta rows (`t.docEmetteur` "Émetteur", `t.docDate` "Date", `t.docCredits` "Crédits déduits", `t.docStatut` "Statut"). If facture awaiting: **"Approuver"** → `openApprove` and **"Contester"** → `openContest`. Footer **"Télécharger"** (`t.docDownload`) / **"Partager"** (`t.docShare`) (inert).
13. **Laisser un avis** (`clientReviewModal`, sheet) — Trigger: `openClientReview` (occ/ponctuel review CTA). Title `t.avisModalTitle` "Évaluer la prestation" + "{prov} · {service}". `t.votreNote` "Votre note" star row (`setClientReviewNote`), `t.avisComment` "Commentaire (optionnel)" textarea. Confirm `t.envoyerAvis` **"Envoyer mon avis"** → `submitClientReview` (needs note; writes `clientReviews[key]`).
14. **Approuver la facture** (`modal:'facApprove'`) — Trigger: `openApprove` / `openApproveOcc`. `t.facApproveTitle` "Approuver la facture" / `t.facApprouveeMsg` / note `t.facApproveNote` (auto-approve after 5 days). **"Revenir"** (`t.cancelKeep`) → `closeModal`; **"Confirmer l'approbation"** (`t.facApproveCta`) → `confirmApprove` (sets `facStatus[title]='Approuvée'`, returns to `docView`).
15. **Contester la facture** (`modal:'facContest'`, sheet) — Trigger: `openContest` / `openContestOcc`. `t.facContestTitle` "Contester la facture" / `t.facContestSub`. `t.facContesteMotif` "Motif" chips: `t.facMotif1` "Montant incorrect", `t.facMotif2` "Prestation non conforme", `t.facMotif3` "Prestation non réalisée" (`pickContestMotif`). `t.facContestProof` "Pièce jointe (optionnel)": **"Joindre une preuve"** (`t.facContestAttach`, `attachProof`) / remove. Confirm `t.facContestSubmit` **"Envoyer la contestation"** → `submitContest` (needs motif; sets `facStatus='Contestée'`, → `docView`).
16. **Ajouter / Reprogrammer une récurrence** (`modal:'addRecur'`, sheet) — Trigger: `openAddRecur` (`data-key="new"` → add / else reschedule). Title `addRecurSheetTitle` = `t.addRecurTitle` "Ajouter une récurrence" or `t.reschedTitle` "Reprogrammer l'occurrence". `t.addRecurDate` "Date proposée" chips (`occDateOptions`: 08/06/2026, 15/06/2026, 22/06/2026, `pickOccDate`). Confirm `t.addRecurCta` **"Ajouter l'occurrence"** → `confirmAddRecur` (add: pushes occ `status:'attente'` to `addedOcc`; reschedule: writes `occDateOverride`).
17. **Annuler la demande** (`modal:'cancelDemand'`) — Trigger: `openCancel` (suivi detail early). `t.cancelTitle` "Annuler la demande ?" / `t.cancelBody`. **"Revenir"** (`t.cancelKeep`) → `closeModal`; **"Confirmer l'annulation"** (`t.cancelConfirm`) → `confirmCancel` (sets `demandStatus[id]='annule'`).
18. **Support** (`supportOpen`, sheet) — Trigger: `openSupport` / `b2bAction act=contact` (many entry points). `t.supportTitle` "Besoin d'aide ?" / `t.supportBody`. Channels: `t.callBtn` "Appeler · 0560 00 00 00", `t.whatsappBtn` "WhatsApp · 0560 00 00 00", `t.emailBtn` "Email · aide@de9de9.dz" (inert). ✕ → `closeSupport`.
19. **Toast** (`toast`) — Trigger: `b2bToast(msg)` (b2b secondary actions, validation errors, "Téléchargement du contrat simulé"). Auto-dismiss 2 s.

---

## 5. State Variables & Conditional Rendering

`state` (initial values) and how each drives the UI:

**Navigation / role**
- `screen:'login'` — the single active screen; every `scrX` flag is `screen===id`.
- `tab:'dashboard'` — active Prestataire bottom-nav tab (colors + which of the 5 tab-screens shows).
- `stack:[]` — back-navigation history; `go` pushes, `goBack` pops, `setTab`/`setClientTab` clear.
- `role:'cliente'` — chosen at `roleChoose`; `pickRole` routes to pro vs client trees.
- `authMode:'login'` — `login` vs `signup`; decides pro/client signup vs home after role pick.
- `clientTab:'home'` — active Client bottom-nav tab; `navColor()` highlights; maps to `cX` screen.
- `lang:'fr'` — FR/AR; `t` (T object) supplies all client strings; `dir` = rtl/ltr; b2b card labels localized.
- `restConnecte:true` — "Rester connecté" checkbox visual only.

**Onboarding / KYC**
- `kycValidated:false` — gates client publishing. `goPublish` diverts to `cKyc` when false; `cHome` shows `kycLocked` banner vs `kycOk` badge; profile KYC row badge "✓". `submitClientKyc` sets it true. (Pro side KYC is display-only; `desiredAccounts:5` = chosen account count on pro signup.)

**Catalogue / publish (client)**
- `catSearch:''` — search query; drives `catResults` dropdown vs `catBrowse` grid; `catNoResults`.
- `selectedFamily:1` — active family for `cFamily`/`cPublish` (`openFamily`/`openSearchSub`).
- `selectedSubs:[]` — chosen sub-services (multi-select); controls CTA active state + count; publish chips.
- `publishType:'ponctuel'` — Ponctuel vs récurrent; toggles frequency block + downstream ponctuel-vs-recurrence rendering.
- `recurrence:'Mensuel'` — chosen frequency chip.

**Suivi / demand lifecycle (client)** — the core state machine.
- `DEMANDS` (10 items, ids 1–10) — each has `type` (ponctuel|recurrent), `status` (setup badge: `attente`/`devis`/`assigne`/`encours`/`confirme`/`termine`/`annule`), `fam`, `cat`, `wilaya`, `date`, optional `pattern`, `props` (proposals), `prov` (assigned provider), `occ[]` (occurrence dates + `status`+`montant`).
- `demandStatus:{}` — per-demand status overrides (`confirmProvider`→`encours`; `confirmCancel`→`annule`). `curStatus(id)` = override ?? base.
- `selectedSuivi:3` — which demand `cSuiviDetail` shows.
- `chosenProposal:null` — selected proposal id; gates "Confirmer le prestataire".
- `suiviFilter:'all'` — filters `cSuivi` list by badge `kind`.
- `addedOcc:{}`, `occDateOverride:{}`, `cancelledOcc:{}`, `confirmedOcc:{}` — per-occurrence mutations (add/reschedule/cancel/confirm), keyed `demandId:index`.
- `clientReviews:{}`, `clientReviewModal:null` — submitted reviews (stars/comment) + open review sheet.
- `recurLayout:'sections'`, `recurSecOpen:{d:true,p:true,h:false}` — recurrence display mode + accordion state.
- `addRecurMode:'add'`, `addRecurTarget:null`, `newOccDate:null` — add-vs-reschedule sheet context.

Two derived engines convert this into badges/frises:
- **`computeDemandBadge(dem)`** — SETUP phase keeps stored status label; once active (`encours`/`confirme`/`termine`) the badge is DERIVED from occurrence states by priority: (1) "Facture à approuver", (2) "Prochaine visite à confirmer : {date}", (3) "En attente de la facture", (4) "Facture contestée", (5) "Visite à planifier", (5b) "Prochaine visite : {date}", (6) "Terminé". Anchor "today" = 2026-06-24.
- **`buildFrise(role, stage)`** — 4-step progress (Confirmée/Réalisée/Facturée/Terminé|Payé) with lead badge (À vous/En attente/Terminé) and action phrase, per stage code.

**Factures / wallet (client)**
- `facStatus:{…}` — invoice-title → 'Approuvée'/'Contestée'; set by approve/contest; feeds facture badges, occurrence→Terminée transition, and factures filters.
- `facturesFilter:'all'` — Toutes/En attente/Approuvées/Contestées.
- `contestMotif:''`, `contestProof:null` — contest sheet inputs (gates submit).
- `docCtx:null` — payload for the doc viewer/uploader (kind, title, emetteur, montant, credits, statut, date, occRef).
- `calDate:null` — selected day in `cCalendrier`.
- Wallet is static in `clientVals` (`soldeC=-12500`, `history[]`).

**Prestataire activity**
- `activSpace:'b2c'`, `b2cTab:'recues'`, `explorerTab:'voir'`, `calSource:'tous'`, `createType:'b2c'` — tab/segment selectors for B2C/B2B/create/calendar.
- `b2bFilter:'all'` — Toutes/Action requise/En attente/Terminées over B2B jobs.
- `b2bSel:null` — selected B2B job for `b2bDetail`.
- `b2bWorker:{}` — jobId → assigned worker id(s) (from Affecter).
- `b2bFacture:{}`, `b2bStatus:{}` — per-job facture flag + status override (upload → `deposee`, affect → `affecte`).
- `B2B_JOBS` (9, ids 1–9) — client, service, occ, `status` (avenir/confirmee/affecte/realisee/deposee/contestee/approuvee/payee/annulee), addr/dt/freq/instr, optional worker + history. `b2bCardModel(job)` is the status→(frise/badges/worker/primary/secondaries) machine.
- `b2bUploadJob:null`, `postulerJob:null` — active job for upload / postuler sheets.
- `upStage:'idle'`, `upFile:null`, `upMontant:''` — upload sheet stage machine.
- `OPEN_OFFRES` (3), `SENT_OFFRES` (3, statuts attente/retenue/refusee) — B2C explorer data.

**Team / affectation (prestataire)**
- `team` (7 members: ids 1–3 active pros, 4 pending, 5 empty, 6–7 salariés `type:'salarie'`) — fields name/role/status/init/color/busy/skills/avail/hours/tarif/note/etc. Status drives active/pending/empty card variants; `type` drives salarié badge + border + analytics. `slotsUsed`/`slotsTotal` exclude salariés.
- `recues` (2), `confirmees` (1, `proIds`) — B2C order queues; `assign()` moves recue→confirmée on affectation; `refuseRes` drops one.
- `annonceTab:'mine'`, `expandedPro:null`, `assignPros:[]`, `detailPro:1`, `selectedMember(s)`, `affecterSearch:''`, `detailWorker:null`, `copiedSlot:null` — annonces tab, accordion, assign-annonce selection, detail targets, affecter search, copy-link feedback.
- `mesAnnonces` (3, `type` b2c/b2b → B2C/B2B badge).
- `recruter{}`, `handicap{}` — sheet form models.

**Overlays**
- `modal:null` — active modal id (see §4). `supportOpen:false` — Support sheet. `toast:null` — transient toast (2 s).
- `contractPreview:false` — pro-profile contract preview toggle.

**Reference catalog** (in `clientVals`): `FAM` — the 16 service families (`id`, color class `noir/bleu/vert/rouge`, icon, FR/AR name, and full `subs[]` sub-service lists) that populate the client catalogue, search, and family detail. `TOP_IDS=[6,9,7,4]` = "Top catégories du mois".

---

Source file: `/private/tmp/claude-501/-Users-haithamattab-Documents-Flutter-Projects-de9de9-entreprise-web/53fd8a0a-8ea4-4bd8-8fad-a312787094bd/scratchpad/template.html` — screens lines ~184–2037, FAB/nav ~2041–2069, modals/sheets ~2071–2506, JS state ~2515–2607, data arrays (`DEMANDS`/`B2B_JOBS`/`OPEN_OFFRES`/`SENT_OFFRES`) ~2609–2672, handlers ~2674–2916, `clientVals` ~2965–3487, `renderVals` ~3489–3710.