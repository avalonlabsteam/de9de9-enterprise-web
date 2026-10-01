import { z } from 'zod';

/**
 * The de9de9 app's wire (guides 16a / 16b) — camelCase names, every enum an
 * int, `DateOnly` `"yyyy-MM-dd"`, `TimeOnly` `"HH:mm"`, paging `meta` in
 * snake_case. Empty values arrive absent (`stripNulls`), so every field the
 * app can do without is optional: one missing label must not blank a tab.
 */

const text = z.string().optional();
const num = z.number().optional();
const status = z.number().default(0);

/** `{ meta, data }` — rows are parsed one by one, an unreadable one is dropped. */
export const legacyPageSchema = z.object({
  meta: z
    .object({
      current_page: z.number().default(1),
      total: z.number().default(0),
      has_more_pages: z.boolean().default(false),
    })
    .default({ current_page: 1, total: 0, has_more_pages: false }),
  data: z.array(z.unknown()).default([]),
});

export interface LegacyPage<T> {
  page: number;
  total: number;
  hasMore: boolean;
  rows: T[];
}

// ------------------------------------------------------------ bookings (16a)

/** A row of « Commandes reçues » — `GET …/ProfessionalRepository/solicitations`. */
export const solicitationSchema = z.object({
  /** The orderId: every action takes it. */
  id: z.string(),
  category: text,
  clientFullName: text,
  clientPhoto: text,
  commune: text,
  description: text,
  /** `"yyyy-MM-dd"` / `"HH:mm"`; absent on very old rows. */
  dueDate: text,
  dueTime: text,
  /** Algeria wall-clock flagged `Z` — never converted (blocker B26). */
  dueDateTime: text,
  price: num,
  total: num,
  status,
  statusClient: status,
  statusPro: status,
  details: z.array(z.object({ serviceTask: text, price: num })).default([]),
  totalDays: num,
  totalHours: num,
  timeDiffInMinutes: num,
});
export type Solicitation = z.infer<typeof solicitationSchema>;

/** A row of « Services confirmés » and of the history — `GET …/User/my-historique`. */
export const historiqueSchema = z.object({
  /** The orderId, or the applicantId on an accepted-offer row. */
  id: z.string(),
  /** `order` · `offer` */
  type: z.string().default('order'),
  /** `"dd/MM/yyyy"` here — not the `"yyyy-MM-dd"` of solicitations. */
  dueDate: text,
  dueTime: text,
  dueDateTime: text,
  dueDayFr: text,
  dueDayAr: text,
  price: num,
  totalPrice: num,
  photoUrl: text,
  firstName: text,
  lastName: text,
  commune: text,
  categoryName: text,
  /** Offers only. */
  categoryServiceName: text,
  /** Bookings only. */
  tasks: z.array(z.object({ taskName: text, price: num })).default([]),
  status,
  statusClient: status,
  statusPro: status,
  /** The consumer's rating, 1–5, once finished. */
  evaluation: num,
  comment: text,
});
export type Historique = z.infer<typeof historiqueSchema>;

/**
 * `GET …/ProfessionalRepository/{id}/job-details` — one booking (`type: order`)
 * or one offer (`type: offer`); the id is tried as a booking first.
 */
export const jobDetailsSchema = z.object({
  id: z.string(),
  type: z.string().default('order'),
  status,
  statusClient: status,
  statusPro: status,
  /** Offers: the current proposal's date; bookings: `dueDateTime`. Wall-clock flagged `Z`. */
  dueDateTime: text,
  dueAt: text,
  dueDayFr: text,
  dueDayAr: text,
  /** `"dd/MM/yyyy"` and `"HH:mm"`, cut without conversion: printed as they come. */
  dueDateFormatted: text,
  dueTimeFormatted: text,
  price: num,
  total: num,
  /** A booking: the consumer's text. An offer: the company's own message. */
  description: text,
  evaluation: num,
  comment: text,
  /** Offers only — absent: no counter yet · 0: the consumer countered · 1: the company did. */
  lastModifiedBy: num,
  negotiationCount: num,
  client: z
    .object({
      fullName: text,
      clientPhotoUrl: text,
      /** Returned before acceptance: shown only at `status == 2` (blocker B30). */
      clientPhoneNumber: text,
      clientIsVerified: z.boolean().optional(),
    })
    .optional(),
  /** Bookings: the catalogue lines (`detailId` is what `pro-modify` takes). */
  details: z
    .array(z.object({ detailId: z.string(), serviceTaskName: text, categoryServiceName: text, price: num }))
    .default([]),
  /** Bookings: the free lines the consumer typed. */
  otherTasks: z.array(z.object({ id: z.string(), description: text, price: num })).default([]),
  service: z.object({ categoryName: text }).optional(),
  /** `address`: shown only at `status == 2`. */
  location: z.object({ commune: text, address: text }).optional(),
  /** Offers: the consumer's post the offer answers. */
  clientPost: z
    .object({
      clientPostId: text,
      postDescription: text,
      commune: text,
      address: text,
      categoryName: text,
      categoryServiceName: text,
      mediaUrls: z.array(z.string()).default([]),
    })
    .optional(),
});
export type JobDetails = z.infer<typeof jobDetailsSchema>;

/** `GET …/User/badge-counts`, and the hub's `BadgeCountsUpdated`. */
export const badgeCountsSchema = z.object({
  cmds: z.number().default(0),
  /** The company's offers still pending — the « Offres envoyées » counter. */
  opport: z.number().default(0),
});
export type BadgeCounts = z.infer<typeof badgeCountsSchema>;

// -------------------------------------------------------------- offers (16b)

export const myCategoriesSchema = z.object({
  categories: z
    .array(z.object({ categoryId: z.number(), categoryName: z.string() }))
    .default([]),
});

/** One row per commune the company covers — grouped by wilaya for the chips. */
export const myZonesSchema = z.object({
  zones: z.array(z.object({ wilayaId: z.number(), wilayaName: z.string() })).default([]),
});

/** A consumer's post in « Voir les offres » — it has no title and no budget. */
export const exploreTaskSchema = z.object({
  clientPostId: z.string(),
  photoUrl: text,
  fullNameClient: text,
  hasDueDate: z.boolean().default(false),
  dueDayFr: text,
  dueDayAr: text,
  dueDateFormatted: text,
  commune: text,
  wilaya: text,
  description: text,
  category: text,
  service: text,
  mediaUrls: z.array(z.string()).default([]),
  countOffers: z.number().default(0),
  totalDays: num,
  totalHours: num,
  timeDiffInMinutes: num,
});
export type ExploreTask = z.infer<typeof exploreTaskSchema>;

/** `GET …/ProfessionalRepository/client-post/{clientPostId}` — the list row, plus the company's own offer on it. */
export const clientPostSchema = exploreTaskSchema.extend({
  clientIsVerified: z.boolean().optional(),
  dueTimeFormatted: text,
  /** The company's LATEST offer on the post, whatever its status. */
  myApplication: z
    .object({ hasApplied: z.boolean().default(false), applicantId: text, status: num })
    .default({ hasApplied: false }),
});
export type ClientPost = z.infer<typeof clientPostSchema>;

/** A row of « Offres envoyées » — `GET …/ProfessionalRepository/my-offers`. */
export const myOfferSchema = z.object({
  /** The applicantId. */
  id: z.string(),
  clientFullName: text,
  clientPhoto: text,
  commune: text,
  appliedDateFormatted: text,
  /** All lower case on the wire. */
  duetime: text,
  dueDateFormatted: text,
  dueDay: text,
  price: num,
  status,
  statusClient: status,
  statusPro: status,
  category: text,
  categoryService: text,
});
export type MyOffer = z.infer<typeof myOfferSchema>;

// --------------------------------------------------------------------- forms

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

/**
 * « Postuler » — `POST …/ProfessionalRepository/apply-to-client`. The date and
 * the time are read there with `ParseExact`: any other format is a 400.
 */
export const bidFormSchema = z.object({
  price: z.coerce.number().positive(),
  dueDate: z.string().regex(DATE),
  dueTime: z.string().regex(TIME),
  message: z.string().max(2000).default(''),
});
