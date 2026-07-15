import { z } from 'zod';

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(), // ISO
  wilaya: z.string(),
  source: z.enum(['b2c', 'b2b']),
  assignedWorkerId: z.string().optional(),
});
export const calendarEventsSchema = calendarEventSchema.array();
export type CalendarEvent = z.infer<typeof calendarEventSchema>;

/** Minimal worker shape for employee filter chips + avatar colours. */
export const calWorkerSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorHex: z.string().optional(),
  status: z.enum(['active', 'pending', 'empty']).optional(),
});
export const calWorkersSchema = calWorkerSchema.array();
export type CalWorker = z.infer<typeof calWorkerSchema>;
