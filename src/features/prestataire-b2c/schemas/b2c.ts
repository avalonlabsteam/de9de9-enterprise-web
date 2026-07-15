import { z } from 'zod';

export const reservationSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  serviceName: z.string(),
  dateLabel: z.string(),
  wilaya: z.string(),
  status: z.enum(['recue', 'confirmee']),
  priceDzd: z.number().optional(),
  assignedWorkerId: z.string().optional(),
  fromWonBid: z.boolean(),
});
export const reservationsSchema = z.array(reservationSchema);
export type Reservation = z.infer<typeof reservationSchema>;

export const openOfferSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  wilaya: z.string(),
  priceLabel: z.string(),
  delai: z.string(),
});
export const openOffersSchema = z.array(openOfferSchema);
export type OpenOffer = z.infer<typeof openOfferSchema>;

export const sentOfferSchema = z.object({
  id: z.string(),
  title: z.string(),
  prixDzd: z.number(),
  delai: z.string(),
  message: z.string(),
  status: z.enum(['enAttente', 'retenue', 'refusee']),
});
export const sentOffersSchema = z.array(sentOfferSchema);
export type SentOffer = z.infer<typeof sentOfferSchema>;

export const b2cWorkerSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorHex: z.string().optional(),
});
export const b2cWorkersSchema = z.array(
  b2cWorkerSchema.extend({
    role: z.string().optional(),
    available: z.boolean().optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    token: z.string().optional(),
  }),
);
export type B2cWorker = z.infer<typeof b2cWorkerSchema>;

/** Form values for Postuler (submit a bid). */
export const bidFormSchema = z.object({
  prixDzd: z.coerce.number().min(1, 'Prix requis'),
  delai: z.string().min(1, 'Délai requis'),
  message: z.string().optional(),
});
export type BidFormValues = z.infer<typeof bidFormSchema>;
