import type { CategoryKey } from './categoryColors';

/** A bilingual string carrying French and Modern Standard Arabic (BUILD-SPEC §8.2). */
export interface LocalizedText {
  fr: string;
  ar: string;
}

export interface ServiceSub {
  id: string;
  name: LocalizedText;
}

export interface ServiceFamily {
  id: string;
  colorKey: CategoryKey;
  icon: string;
  name: LocalizedText;
  subs: ServiceSub[];
}

/** Families surfaced under "Top catégories du mois". */
export const TOP_FAMILY_IDS = ['6', '9', '7', '4'] as const;

/** A bilingual label authored as a `[fr, ar]` tuple. */
type Bilingual = [fr: string, ar: string];

const l = ([fr, ar]: Bilingual): LocalizedText => ({ fr, ar });

function family(
  id: string,
  colorKey: CategoryKey,
  icon: string,
  name: Bilingual,
  subs: Bilingual[],
): ServiceFamily {
  return {
    id,
    colorKey,
    icon,
    name: l(name),
    subs: subs.map((s, i) => ({ id: `${id}-${i + 1}`, name: l(s) })),
  };
}

export const CATALOGUE: ServiceFamily[] = [
  family('1', 'noir', '⚖️', ['Services Juridiques & Légaux', 'الخدمات القانونية والقضائية'], [
    ["Avocat d'affaires", 'محامي أعمال'],
    ['Notaire', 'موثّق'],
    ['Huissier de justice', 'محضر قضائي'],
    ["Conseil juridique d'entreprise", 'الاستشارة القانونية للمؤسسات'],
    ['Rédaction & révision de contrats', 'تحرير ومراجعة العقود'],
    [
      'Propriété intellectuelle, brevets & marques (INAPI)',
      'الملكية الفكرية وبراءات الاختراع والعلامات التجارية (INAPI)',
    ],
    ['Recouvrement de créances', 'تحصيل الديون'],
    ['Contentieux & litiges commerciaux', 'المنازعات والخصومات التجارية'],
    ['Droit du travail & droit social', 'قانون العمل والقانون الاجتماعي'],
    ['Droit fiscal & douanier', 'القانون الجبائي والجمركي'],
    ['Mise en conformité réglementaire & RGPD', 'الامتثال التنظيمي وحماية البيانات (RGPD)'],
    ['Constitution & modification de sociétés', 'تأسيس الشركات وتعديلها'],
    ['Traduction juridique assermentée', 'الترجمة القانونية المحلَّفة'],
  ]),
  family('2', 'noir', '🧮', ['Comptabilité, Finance & Fiscalité', 'المحاسبة والمالية والجباية'], [
    ['Expert-comptable', 'خبير محاسب'],
    ['Commissaire aux comptes', 'محافظ حسابات'],
    ['Tenue de comptabilité externalisée', 'مسك المحاسبة الخارجي'],
    ['Gestion de la paie', 'تسيير الأجور'],
    ['Déclarations fiscales (G50, IBS, TVA, IRG)', 'التصريحات الجبائية (G50, IBS, TVA, IRG)'],
    ['Déclarations sociales (CNAS, CASNOS)', 'التصريحات الاجتماعية (CNAS, CASNOS)'],
    ['Audit financier & comptable', 'التدقيق المالي والمحاسبي'],
    ['Contrôle de gestion & reporting', 'مراقبة التسيير وإعداد التقارير'],
    ['Conseil financier & levée de fonds', 'الاستشارة المالية وجمع الأموال'],
    ['Montage de dossier bancaire & crédit', 'إعداد الملف البنكي والقروض'],
    ["Domiciliation d'entreprise", 'توطين المؤسسات'],
    ["Évaluation d'entreprise", 'تقييم المؤسسات'],
    ['Gestion de trésorerie', 'تسيير الخزينة'],
  ]),
  family('3', 'bleu', '👥', ['Ressources Humaines & Recrutement', 'الموارد البشرية والتوظيف'], [
    ['Cabinet de recrutement', 'مكتب التوظيف'],
    ['Chasse de têtes', 'استقطاب الكفاءات'],
    ['Travail temporaire & intérim', 'العمل المؤقت والعمل بالنيابة'],
    ['Externalisation complète RH (SIRH)', 'التسيير الكامل الخارجي للموارد البشرية (SIRH)'],
    ['Formation professionnelle en entreprise', 'التكوين المهني داخل المؤسسة'],
    ['Conseil RH & organisation', 'استشارة الموارد البشرية والتنظيم'],
    ['Évaluation & bilan de compétences', 'تقييم الكفاءات وحصيلتها'],
    ['Coaching de dirigeants & cadres', 'تدريب المسيّرين والإطارات'],
    ['Team building', 'أنشطة بناء الفريق (Team Building)'],
    ['Gestion administrative du personnel', 'التسيير الإداري للموظفين'],
    ['Médecine du travail', 'طب العمل'],
  ]),
  family('4', 'bleu', '💻', ['Services Informatiques & Digitaux', 'الخدمات المعلوماتية والرقمية'], [
    ['Développement de logiciels sur mesure', 'تطوير البرمجيات حسب الطلب'],
    ['Développement web & e-commerce', 'تطوير المواقع والتجارة الإلكترونية'],
    ["Développement d'applications mobiles", 'تطوير تطبيقات الهاتف المحمول'],
    ['Maintenance informatique & helpdesk', 'الصيانة المعلوماتية والدعم التقني'],
    ['Infogérance & gestion de parc', 'إدارة النظم المعلوماتية وتسيير العتاد'],
    ['Infrastructure réseau & câblage', 'البنية التحتية للشبكات والكابلات'],
    ['Administration serveurs & systèmes', 'إدارة الخوادم والأنظمة'],
    ['Cybersécurité & audit de sécurité', 'الأمن السيبراني وتدقيق الأمن'],
    ['Hébergement, cloud & sauvegarde', 'الاستضافة والحوسبة السحابية والنسخ الاحتياطي'],
    [
      'Intégration ERP (SAP, Odoo, Dolibarr)',
      'تكامل أنظمة تخطيط موارد المؤسسة ERP (SAP, Odoo, Dolibarr)',
    ],
    ['Intégration & paramétrage CRM', 'تكامل وإعداد أنظمة إدارة علاقات العملاء (CRM)'],
    ['Data, BI & intelligence artificielle', 'البيانات وذكاء الأعمال (BI) والذكاء الاصطناعي'],
    ['Transformation & conseil digital', 'التحول الرقمي والاستشارة الرقمية'],
    ['Vidéosurveillance IP & systèmes électroniques', 'المراقبة بالفيديو عبر IP والأنظمة الإلكترونية'],
  ]),
  family('5', 'rouge', '📣', ['Marketing, Communication & Créatif', 'التسويق والاتصال والإبداع'], [
    ['Agence de communication globale', 'وكالة اتصال شاملة'],
    ['Marketing digital & gestion réseaux sociaux', 'التسويق الرقمي وتسيير مواقع التواصل الاجتماعي'],
    ['Référencement SEO & publicité SEA', 'تحسين محركات البحث (SEO) والإعلانات المدفوعة (SEA)'],
    ['Community management & création de contenu', 'إدارة المجتمعات الرقمية وإنشاء المحتوى'],
    ['Production vidéo & motion design', 'إنتاج الفيديو والرسوم المتحركة (Motion Design)'],
    ['Montage vidéo & post-production', 'مونتاج الفيديو وما بعد الإنتاج'],
    ['Photographie professionnelle & corporate', 'التصوير الفوتوغرافي الاحترافي والمؤسساتي'],
    ['Design graphique & identité visuelle', 'التصميم الجرافيكي والهوية البصرية'],
    ['Branding & stratégie de marque', 'بناء العلامة التجارية واستراتيجيتها'],
    ['Rédaction & copywriting', 'التحرير وكتابة المحتوى الإعلاني'],
    ['Régie publicitaire & affichage urbain', 'الوكالة الإعلانية والإشهار الحضري'],
    ['Relations presse & média', 'العلاقات الصحفية والإعلامية'],
    ['Impression & PLV', 'الطباعة ومواد الدعاية عند نقاط البيع (PLV)'],
    ['Goodies & objets publicitaires', 'الهدايا والمواد الترويجية'],
  ]),
  family('6', 'vert', '🧼', ['Nettoyage & Hygiène', 'التنظيف والنظافة'], [
    ['Nettoyage de bureaux & locaux professionnels', 'تنظيف المكاتب والمحلات المهنية'],
    ['Nettoyage industriel & usines', 'التنظيف الصناعي والمصانع'],
    ['Nettoyage de fin de chantier', 'تنظيف نهاية الورشة'],
    ['Nettoyage de vitres & façades', 'تنظيف الزجاج والواجهات'],
    ['Désinfection, dératisation & désinsectisation (3D)', 'التطهير ومكافحة القوارض والحشرات (3D)'],
    ['Gestion & collecte des déchets', 'تسيير النفايات وجمعها'],
    ["Fourniture de produits d'hygiène sanitaire", 'توفير مواد النظافة الصحية'],
    ['Entretien des espaces verts', 'صيانة المساحات الخضراء'],
    ['Blanchisserie industrielle & pressing pro', 'المغسلة الصناعية والتنظيف الجاف الاحترافي'],
    ['Dégraissage de hottes & cuisines pro', 'إزالة الدهون من الشفاطات والمطابخ المهنية'],
  ]),
  family('7', 'noir', '🛡️', ['Sécurité & Gardiennage', 'الأمن والحراسة'], [
    ['Société de gardiennage', 'شركة حراسة'],
    ['Agents de sécurité & vigiles', 'أعوان الأمن والحراس'],
    ['Installation vidéosurveillance & alarme', 'تركيب المراقبة بالفيديو وأجهزة الإنذار'],
    ["Systèmes de contrôle d'accès", 'أنظمة مراقبة الدخول'],
    ['Sécurité incendie & extincteurs', 'الأمن ضد الحرائق وأجهزة الإطفاء'],
    ['Transport de fonds & valeurs', 'نقل الأموال والقيم'],
    ['Sécurité événementielle', 'أمن التظاهرات والفعاليات'],
    ['Conseil & audit de sûreté', 'الاستشارة والتدقيق الأمني'],
    ['Maître-chien & cynophile', 'مدرّب الكلاب والحراسة بالكلاب'],
  ]),
  family('8', 'bleu', '🚚', ['Logistique, Transport & Supply Chain', 'اللوجستيك والنقل وسلسلة التوريد'], [
    ['Transport de marchandises (national)', 'نقل البضائع (وطني)'],
    ['Transit & dédouanement', 'العبور والتخليص الجمركي'],
    ['Entreposage & stockage', 'الإيداع والتخزين'],
    ['Logistique & distribution', 'اللوجستيك والتوزيع'],
    ['Livraison dernier kilomètre & coursier', 'التوصيل للكيلومتر الأخير وخدمة السعاة'],
    ['Fret maritime, aérien & routier', 'الشحن البحري والجوي والبري'],
    ['Location de véhicules utilitaires & camions', 'كراء المركبات النفعية والشاحنات'],
    ['Manutention & déménagement industriel', 'المناولة والترحيل الصناعي'],
    ["Location d'engins de levage", 'كراء آليات الرفع'],
    ['Gestion de flotte', 'تسيير حظيرة السيارات'],
  ]),
  family('9', 'vert', '🏗️', ['BTP, Travaux & Aménagement', 'البناء والأشغال والتهيئة'], [
    ['Entreprise de bâtiment (gros œuvre)', 'مؤسسة بناء (الأشغال الكبرى)'],
    ['Aménagement & agencement de bureaux', 'تهيئة المكاتب وترتيبها'],
    ['Électricité industrielle & bâtiment', 'الكهرباء الصناعية والمباني'],
    ['Plomberie & sanitaire', 'السباكة والتجهيزات الصحية'],
    ['Climatisation, chauffage & froid (CVC)', 'التكييف والتدفئة والتبريد (CVC)'],
    ['Étanchéité & isolation', 'العزل المائي والحراري'],
    ['Peinture & revêtement professionnel', 'الدهان والتغليف الاحترافي'],
    ['Faux plafonds, cloisons & menuiserie', 'الأسقف المستعارة والقواطع والنجارة'],
    ['Vitrerie & façades', 'الزجاج والواجهات'],
    ["Bureau d'études techniques & architecture", 'مكتب الدراسات التقنية والهندسة المعمارية'],
    ['Suivi, contrôle & coordination de chantier', 'متابعة الورشة ومراقبتها وتنسيقها'],
    ['Terrassement & VRD', 'أشغال الحفر والتهيئة الخارجية (VRD)'],
    ['Métallerie, ferronnerie & serrurerie', 'أشغال المعادن والحدادة والأقفال'],
  ]),
  family('10', 'vert', '🔧', ['Maintenance Industrielle & Technique', 'الصيانة الصناعية والتقنية'], [
    ["Maintenance d'équipements industriels", 'صيانة التجهيزات الصناعية'],
    ['Maintenance préventive & curative', 'الصيانة الوقائية والعلاجية'],
    ['Électromécanique & automatisme industriel', 'الكهروميكانيك والأتمتة الصناعية'],
    ['Maintenance de groupes électrogènes', 'صيانة المولدات الكهربائية'],
    ["Maintenance d'ascenseurs & monte-charges", 'صيانة المصاعد ورافعات الحمولة'],
    ['Chaudronnerie & soudure industrielle', 'أشغال الصفائح المعدنية واللحام الصناعي'],
    ['Usinage & fabrication de pièces', 'الخراطة وتصنيع القطع'],
    ['Calibrage, métrologie & contrôle', 'المعايرة والقياس والمراقبة'],
    ['Maintenance CVC & froid commercial', 'صيانة التكييف (CVC) والتبريد التجاري'],
    ['Maintenance informatique industrielle (GMAO)', 'الصيانة المعلوماتية الصناعية (GMAO)'],
  ]),
  family('11', 'noir', '📊', ["Conseil & Stratégie d'Entreprise", 'الاستشارة واستراتيجية المؤسسات'], [
    ['Conseil en management & organisation', 'الاستشارة في الإدارة والتنظيم'],
    ['Conseil en stratégie & business plan', 'الاستشارة في الاستراتيجية وخطة الأعمال'],
    ['Étude de marché & étude de faisabilité', 'دراسة السوق ودراسة الجدوى'],
    ["Accompagnement à la création d'entreprise", 'مرافقة إنشاء المؤسسات'],
    [
      'Conseil en certification (ISO 9001, HACCP, ISO 14001)',
      'الاستشارة في المصادقة والاعتماد (ISO 9001, HACCP, ISO 14001)',
    ],
    ['Conduite du changement & transformation', 'قيادة التغيير والتحول'],
    ['Intelligence économique & veille', 'الذكاء الاقتصادي واليقظة'],
    [
      'Conseil en financement & subventions (ANADE, ANGEM)',
      'الاستشارة في التمويل والإعانات (ANADE, ANGEM)',
    ],
    ['Optimisation des processus (Lean)', 'تحسين العمليات (Lean)'],
    ['Conseil RSE & développement durable', 'الاستشارة في المسؤولية المجتمعية والتنمية المستدامة (RSE)'],
  ]),
  family('12', 'rouge', '📦', ['Fournitures & Équipements (Achat B2B)', 'اللوازم والتجهيزات (الشراء B2B)'], [
    ['Fournitures de bureau', 'لوازم المكتب'],
    ['Mobilier de bureau & aménagement', 'أثاث المكتب والتهيئة'],
    ['Matériel informatique & bureautique', 'العتاد المعلوماتي والمكتبي'],
    ['Équipements & machines industrielles', 'التجهيزات والآلات الصناعية'],
    ['Consommables & pièces de rechange', 'المواد الاستهلاكية وقطع الغيار'],
    ['Équipements de protection individuelle (EPI)', 'معدات الحماية الفردية (EPI)'],
    ['Matières premières', 'المواد الأولية'],
    ['Emballage & conditionnement', 'التغليف والتعبئة'],
    ['Uniformes & vêtements de travail', 'الأزياء الموحدة وملابس العمل'],
    ['Matériel médical & laboratoire', 'العتاد الطبي والمخبري'],
    ['Énergie solaire & équipements', 'الطاقة الشمسية والتجهيزات'],
  ]),
  family('13', 'rouge', '🍽️', ["Restauration & Événementiel d'Entreprise", 'الإطعام وتنظيم فعاليات المؤسسات'], [
    ["Restauration collective & cantine d'entreprise", 'الإطعام الجماعي ومطعم المؤسسة'],
    ['Traiteur événementiel', 'خدمات الطعام للمناسبات'],
    ['Plateaux repas & livraison entreprise', 'الوجبات الجاهزة والتوصيل للمؤسسات'],
    ['Organisation de séminaires & conférences', 'تنظيم الملتقيات والمؤتمرات'],
    ['Location de salles & espaces de réunion', 'كراء القاعات وفضاءات الاجتماعات'],
    ['Organisation de salons & stands', 'تنظيم المعارض والأجنحة'],
    ['Location de matériel événementiel', 'كراء عتاد التظاهرات'],
    ['Animation, sonorisation & spectacle', 'التنشيط والصوتيات والعروض'],
    ["Agence de voyage d'affaires", 'وكالة أسفار الأعمال'],
  ]),
  family('14', 'bleu', '🛟', ['Assurance & Gestion des Risques', 'التأمين وتسيير المخاطر'], [
    ['Courtier en assurance entreprise', 'وسيط تأمين المؤسسات'],
    ['Assurance multirisque professionnelle', 'التأمين المهني المتعدد الأخطار'],
    ['Assurance flotte automobile', 'تأمين حظيرة السيارات'],
    ['Assurance responsabilité civile pro', 'تأمين المسؤولية المدنية المهنية'],
    ['Assurance transport & marchandises', 'تأمين النقل والبضائع'],
    ['Santé & prévoyance collective', 'التأمين الصحي والاحتياط الجماعي'],
    ['Expertise & évaluation de sinistres', 'الخبرة وتقييم الأضرار'],
    ['Conseil en gestion des risques', 'الاستشارة في تسيير المخاطر'],
  ]),
  family('15', 'bleu', '🌍', ['Import-Export & Commerce International', 'الاستيراد والتصدير والتجارة الدولية'], [
    ["Société d'import-export", 'شركة استيراد وتصدير'],
    ['Sourcing & approvisionnement international', 'التموين والتوريد الدولي'],
    ['Représentation commerciale & agent', 'التمثيل التجاري والوكالة'],
    ['Accompagnement domiciliation bancaire import', 'مرافقة التوطين البنكي للاستيراد'],
    ['Conseil en commerce extérieur & douane', 'الاستشارة في التجارة الخارجية والجمارك'],
    ['Inspection & contrôle qualité marchandises', 'التفتيش ومراقبة جودة البضائع'],
    ['Traduction commerciale & technique', 'الترجمة التجارية والتقنية'],
  ]),
  family('16', 'vert', '🗂️', ['Services Généraux & Support', 'الخدمات العامة والدعم'], [
    ['Secrétariat & assistance administrative externalisée', 'الأمانة والمساعدة الإدارية الخارجية'],
    ['Centre d’appels & relation client (call center)', 'مركز الاتصال وعلاقات العملاء (Call Center)'],
    ['Numérisation & archivage de documents', 'رقمنة الوثائق وأرشفتها'],
    ['Coursier & service de pli', 'خدمة السعاة وإيصال الطرود'],
    ['Imprimerie & reprographie', 'المطبعة والنسخ'],
    ['Location de matériel bureautique', 'كراء العتاد المكتبي'],
    ['Gestion du courrier & domiciliation postale', 'تسيير البريد والتوطين البريدي'],
    ['Interprétariat & traduction', 'الترجمة الفورية والتحريرية'],
  ]),
];

export const FAMILY_BY_ID: Record<string, ServiceFamily> = Object.fromEntries(
  CATALOGUE.map((f) => [f.id, f]),
);

/** Shared form option lists (BUILD-SPEC §8.3). */
export const WILAYAS = [
  'Alger',
  'Oran',
  'Constantine',
  'Annaba',
  'Blida',
  'Sétif',
  'Béjaïa',
  'Tizi Ouzou',
  'Tlemcen',
  'Batna',
  'Ouargla',
  'Ghardaïa',
] as const;

export const DELAIS = [
  'Immédiat',
  'Sous 72h',
  'Sous 1 semaine',
  'Sous 1 mois',
  '2 à 3 mois',
  'Flexible',
] as const;

export const RECURRENCES = ['Hebdomadaire', 'Mensuel', 'Trimestriel', 'Annuel'] as const;
