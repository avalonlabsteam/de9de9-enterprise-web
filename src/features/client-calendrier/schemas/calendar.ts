import { z } from 'zod';

export const clientEventSchema = z.object({
  id: z.string(),
  tenderId: z.string(),
  title: z.string(),
  date: z.string(),
  wilaya: z.string(),
});

export const clientCalendarSchema = clientEventSchema.array();

export type ClientEvent = z.infer<typeof clientEventSchema>;
