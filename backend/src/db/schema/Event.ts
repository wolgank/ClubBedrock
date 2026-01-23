import { mysqlTable, serial, varchar, date, decimal, int, boolean, datetime, bigint } from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { reservation } from './Reservation';

export const event = mysqlTable('event', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  startHour: datetime('start_hour').notNull(),
  endHour: datetime('end_hour').notNull(),
  spaceUsed: varchar('space_used', { length: 255 }).notNull(),
  ticketPriceMember: decimal('ticket_price_member', { precision: 10, scale: 2 }).notNull(),
  ticketPriceGuest: decimal('ticket_price_guest', { precision: 10, scale: 2 }),
  capacity: int('capacity').notNull(),
  registerCount: int('register_count').notNull().default(0),
  urlImage: varchar('url_image', { length: 255 }),
  isActive: boolean('is_active').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  allowOutsiders: boolean('allow_outsiders').notNull(),
  numberOfAssistants: int('number_of_assistants').notNull(),
  reservationId: bigint('reservation_id',{ mode: 'number', unsigned: true }).notNull().references(() => reservation.id, { onDelete: 'cascade' }),
});
export const eventInsertSchema = createInsertSchema(event, {
  name: z.string().min(1),
  date: z.string(),
  startHour: z.string(), 
  endHour: z.string(), // Basic HH:MM:SS time validation
  spaceUsed: z.string().min(1),
  ticketPriceMember: z.preprocess((val) => Number(val), z.number().nonnegative()),
  ticketPriceGuest: z.preprocess((val) => Number(val), z.number().nonnegative()),
  capacity: z.number().int().min(1),
  urlImage: z.string().url(),
  isActive: z.boolean(),
  description: z.string().min(1),
  allowOutsiders: z.boolean(),
  numberOfAssistants: z.number().int(),
  reservationId: z.number().int(),
});


export const eventSelectSchema = createSelectSchema(event, {
  ticketPriceMember: z.preprocess((val) => Number(val), z.number().nonnegative()),
  ticketPriceGuest: z.preprocess((val) => Number(val), z.number().nonnegative()),
  date: z.preprocess((val) => new Date(val as string | number | Date), z.date()),
  startHour: z.preprocess((val) => new Date(val as string | number | Date), z.date()),
  endHour: z.preprocess((val) => new Date(val as string | number | Date), z.date()),
});

export const eventUpdateSchema = eventInsertSchema.partial();

export const eventInsertSchemaM = createInsertSchema(event, {
  name: z.string().min(1),
  date: z.string(),
  startHour: z.string(), 
  endHour: z.string(), // Basic HH:MM:SS time validation
  spaceUsed: z.string().min(1),
  ticketPriceMember: z.string(),
  ticketPriceGuest: z.string(),
  capacity: z.number().int().min(1),
  urlImage: z.string().nullable(),
  isActive: z.boolean(),
  description: z.string().min(1),
  allowOutsiders: z.boolean(),
  numberOfAssistants: z.number().int(),
  reservationId: z.number().int(),
}).omit ( {
  reservationId : true,
});