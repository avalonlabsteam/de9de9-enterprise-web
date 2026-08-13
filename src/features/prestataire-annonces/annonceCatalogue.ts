/**
 * B2C taxonomy driving the "Créez votre annonce" wizard: category → service →
 * service groups → questionnaire. Separate from `@/lib/catalogue`, which is the
 * 16-family B2B catalogue used by the client side.
 */

type Bilingual = [fr: string, ar: string];

export interface LocalizedText {
  fr: string;
  ar: string;
}

const l = ([fr, ar]: Bilingual): LocalizedText => ({ fr, ar });

/** One checkable item inside a service group. */
export interface ServiceItem {
  id: string;
  name: LocalizedText;
}

/** A titled block of checkable services ("Installation de sanitaires"). */
export interface ServiceGroup {
  id: string;
  title: LocalizedText;
  items: ServiceItem[];
}

export interface AnnonceService {
  id: string;
  emoji: string;
  name: LocalizedText;
  groups: ServiceGroup[];
}

export interface AnnonceCategory {
  id: string;
  emoji: string;
  name: LocalizedText;
  services: AnnonceService[];
}

function group(id: string, title: Bilingual, items: Bilingual[]): ServiceGroup {
  return {
    id,
    title: l(title),
    items: items.map((name, i) => ({ id: `${id}-${i}`, name: l(name) })),
  };
}

function service(
  id: string,
  emoji: string,
  name: Bilingual,
  groups: ServiceGroup[],
): AnnonceService {
  return { id, emoji, name: l(name), groups };
}

/** Fallback groups for services that have no bespoke breakdown yet. */
const genericGroups = (id: string): ServiceGroup[] => [
  group(`${id}-g1`, ['Prestations courantes', 'الخدمات الشائعة'], [
    ['Diagnostic et devis', 'التشخيص والتسعير'],
    ['Intervention standard', 'تدخل عادي'],
    ['Intervention urgente', 'تدخل عاجل'],
  ]),
  group(`${id}-g2`, ['Entretien et suivi', 'الصيانة والمتابعة'], [
    ['Contrat d’entretien', 'عقد صيانة'],
    ['Visite de contrôle', 'زيارة مراقبة'],
  ]),
];

export const ANNONCE_CATEGORIES: AnnonceCategory[] = [
  {
    id: 'beaute',
    emoji: '💇',
    name: l(['Beauté', 'الجمال']),
    services: [
      service('coiffure', '💇', ['Coiffure', 'الحلاقة'], genericGroups('coiffure')),
      service('esthetique', '💅', ['Esthétique', 'التجميل'], genericGroups('esthetique')),
      service('maquillage', '💄', ['Maquillage', 'المكياج'], genericGroups('maquillage')),
    ],
  },
  {
    id: 'electronique',
    emoji: '⚡',
    name: l(['Electronique', 'الإلكترونيات']),
    services: [
      service('informatique', '💻', ['Informatique', 'الإعلام الآلي'], genericGroups('informatique')),
      service('electromenager', '🔌', ['Électroménager', 'الأجهزة المنزلية'], genericGroups('electromenager')),
      service('telephonie', '📱', ['Téléphonie', 'الهاتف'], genericGroups('telephonie')),
    ],
  },
  {
    id: 'sante',
    emoji: '❤️',
    name: l(['Santé', 'الصحة']),
    services: [
      service('infirmier', '🩺', ['Soins infirmiers', 'التمريض'], genericGroups('infirmier')),
      service('kine', '🧑‍⚕️', ['Kinésithérapie', 'العلاج الطبيعي'], genericGroups('kine')),
      service('garde', '🤝', ['Garde-malade', 'مرافقة المرضى'], genericGroups('garde')),
    ],
  },
  {
    id: 'travaux',
    emoji: '🔧',
    name: l(['Travaux', 'الأشغال']),
    services: [
      service('plomberie', '🔧', ['Plomberie', 'السباكة'], [
        group('plomberie-sanitaires', ['Installation de sanitaires', 'تركيب الأدوات الصحية'], [
          ['Pose de lavabos, toilettes et douches', 'تركيب المغاسل والمراحيض والدشات'],
          ['Mise en place de compteurs et régulateurs', 'تركيب العدادات والمنظمات'],
          ['Installation de tuyauteries de gaz', 'تركيب أنابيب الغاز'],
        ]),
        group('plomberie-chauffage', ['Système de chauffage', 'نظام التدفئة'], [
          ['Installation de chaudières', 'تركيب المراجل'],
          ['Pose de radiateurs', 'تركيب المدفآت'],
          ['Entretien et dépannage', 'الصيانة والإصلاح'],
        ]),
        group('plomberie-depannage', ['Dépannage', 'الإصلاح'], [
          ['Recherche et réparation de fuites', 'كشف وإصلاح التسربات'],
          ['Débouchage de canalisations', 'تسليك القنوات'],
        ]),
      ]),
      service('electricite', '💡', ['Electricité', 'الكهرباء'], [
        group('electricite-install', ['Installation électrique', 'التركيب الكهربائي'], [
          ['Pose de tableaux électriques', 'تركيب اللوحات الكهربائية'],
          ['Câblage et prises', 'الأسلاك والمآخذ'],
          ['Éclairage intérieur et extérieur', 'الإنارة الداخلية والخارجية'],
        ]),
        group('electricite-depannage', ['Dépannage', 'الإصلاح'], [
          ['Recherche de pannes', 'كشف الأعطال'],
          ['Mise aux normes', 'المطابقة للمعايير'],
        ]),
      ]),
      service('peinture', '🎨', ['Peinture', 'الدهن'], genericGroups('peinture')),
      service('climatisation', '❄️', ['Climatisation', 'التكييف'], genericGroups('climatisation')),
      service('chauffage', '🔥', ['Chauffage', 'التدفئة'], genericGroups('chauffage')),
      service('serrurier', '🔑', ['Serrurier', 'الأقفال'], genericGroups('serrurier')),
    ],
  },
  {
    id: 'cours',
    emoji: '🎓',
    name: l(['Cours particuliers', 'دروس خصوصية']),
    services: [
      service('scolaire', '📚', ['Soutien scolaire', 'الدعم المدرسي'], genericGroups('scolaire')),
      service('langues', '🗣️', ['Langues', 'اللغات'], genericGroups('langues')),
      service('musique', '🎵', ['Musique', 'الموسيقى'], genericGroups('musique')),
    ],
  },
  {
    id: 'maintenance',
    emoji: '🏠',
    name: l(['Maintenance domestique', 'الصيانة المنزلية']),
    services: [
      service('menage', '🧹', ['Ménage', 'التنظيف'], genericGroups('menage')),
      service('jardinage', '🌿', ['Jardinage', 'البستنة'], genericGroups('jardinage')),
      service('demenagement', '📦', ['Déménagement', 'النقل'], genericGroups('demenagement')),
    ],
  },
  {
    id: 'evenement',
    emoji: '🎉',
    name: l(['Évènement', 'المناسبات']),
    services: [
      service('traiteur', '🍽️', ['Traiteur', 'التموين'], genericGroups('traiteur')),
      service('photographe', '📷', ['Photographe', 'التصوير'], genericGroups('photographe')),
      service('decoration', '🎈', ['Décoration', 'الديكور'], genericGroups('decoration')),
    ],
  },
  {
    id: 'sport',
    emoji: '🏋️',
    name: l(['Sport', 'الرياضة']),
    services: [
      service('coach', '🏋️', ['Coach personnel', 'مدرب شخصي'], genericGroups('coach')),
      service('yoga', '🧘', ['Yoga', 'اليوغا'], genericGroups('yoga')),
      service('natation', '🏊', ['Natation', 'السباحة'], genericGroups('natation')),
    ],
  },
];

/** Billing units offered on the Tarifs step. */
export const TARIF_UNITS: { id: string; label: LocalizedText }[] = [
  { id: 'heure', label: l(['Par heure', 'بالساعة']) },
  { id: 'jour', label: l(['Par jour', 'باليوم']) },
  { id: 'forfait', label: l(['Forfait', 'جزافي']) },
  { id: 'm2', label: l(['Par m²', 'بالمتر المربع']) },
  { id: 'piece', label: l(['Par pièce', 'بالقطعة']) },
];

export interface QuestionOption {
  id: string;
  label: LocalizedText;
}

export interface Question {
  id: string;
  label: LocalizedText;
  /** `single` renders as radio-style, `multi` allows several answers. */
  mode: 'single' | 'multi';
  options: QuestionOption[];
}

export const QUESTIONNAIRE: Question[] = [
  {
    id: 'experience',
    mode: 'single',
    label: l(['Combien d’années d’expérience avez-vous ?', 'كم سنة خبرة لديك؟']),
    options: [
      { id: '0-2', label: l(['0 - 2 ans', '0 - 2 سنوات']) },
      { id: '3-5', label: l(['3 - 5 ans', '3 - 5 سنوات']) },
      { id: '5-10', label: l(['5 - 10 ans', '5 - 10 سنوات']) },
    ],
  },
  {
    id: 'formation',
    mode: 'single',
    label: l([
      'Avez-vous suivi des cours, des formations ou obtenu des qualifications professionnelles dans le domaine ?',
      'هل تابعت دروسًا أو تكوينات أو حصلت على مؤهلات مهنية في المجال؟',
    ]),
    options: [
      { id: 'oui', label: l(['Oui', 'نعم']) },
      { id: 'non', label: l(['Non', 'لا']) },
    ],
  },
  {
    id: 'deplacement',
    mode: 'single',
    label: l(['Vous déplacez-vous chez le client ?', 'هل تتنقل إلى منزل العميل؟']),
    options: [
      { id: 'oui', label: l(['Oui', 'نعم']) },
      { id: 'non', label: l(['Non', 'لا']) },
    ],
  },
];

/** Sunday-first, matching the availability screen. */
export const WEEK_DAYS: { id: string; label: LocalizedText }[] = [
  { id: 'dim', label: l(['Dimanche', 'الأحد']) },
  { id: 'lun', label: l(['Lundi', 'الإثنين']) },
  { id: 'mar', label: l(['Mardi', 'الثلاثاء']) },
  { id: 'mer', label: l(['Mercredi', 'الأربعاء']) },
  { id: 'jeu', label: l(['Jeudi', 'الخميس']) },
  { id: 'ven', label: l(['Vendredi', 'الجمعة']) },
  { id: 'sam', label: l(['Samedi', 'السبت']) },
];

export const categoryById = (id: string): AnnonceCategory | undefined =>
  ANNONCE_CATEGORIES.find((c) => c.id === id);

export const serviceById = (
  categoryId: string,
  serviceId: string,
): AnnonceService | undefined => categoryById(categoryId)?.services.find((s) => s.id === serviceId);
